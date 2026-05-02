from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import LeaveApplication, AnnualQuota, User, Department
from datetime import datetime, date
from dateutil import parser
from sqlalchemy import and_

applications_bp = Blueprint('applications', __name__)

def calculate_days(start_date, end_date):
    delta = end_date - start_date
    return delta.days + 1

def get_pending_days(user_id, holiday_type_id, year):
    pending_apps = LeaveApplication.query.filter(
        LeaveApplication.user_id == user_id,
        LeaveApplication.holiday_type_id == holiday_type_id,
        LeaveApplication.status == 'pending',
        db.extract('year', LeaveApplication.start_date) == year
    ).all()
    return sum(app.days for app in pending_apps)

def get_department_user_ids(department_id):
    if department_id:
        users = User.query.filter_by(department_id=department_id).all()
    else:
        users = User.query.filter_by(department_id=current_user.department_id).all()
    return [u.id for u in users]

@applications_bp.route('', methods=['GET'])
@login_required
def get_applications():
    status = request.args.get('status')
    user_id = request.args.get('user_id', type=int)
    department_id = request.args.get('department_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = LeaveApplication.query

    if current_user.role == 'employee':
        query = query.filter_by(user_id=current_user.id)
    elif current_user.role == 'manager':
        dept_user_ids = get_department_user_ids(department_id)
        if dept_user_ids:
            query = query.filter(LeaveApplication.user_id.in_(dept_user_ids))
        else:
            query = query.filter(LeaveApplication.user_id == -1)

    if status:
        query = query.filter_by(status=status)
    if user_id:
        query = query.filter_by(user_id=user_id)
    if start_date:
        query = query.filter(LeaveApplication.start_date >= parser.parse(start_date).date())
    if end_date:
        query = query.filter(LeaveApplication.end_date <= parser.parse(end_date).date())

    applications = query.order_by(LeaveApplication.created_at.desc()).all()
    return jsonify({'applications': [a.to_dict() for a in applications]}), 200

@applications_bp.route('/<int:app_id>', methods=['GET'])
@login_required
def get_application(app_id):
    application = LeaveApplication.query.get_or_404(app_id)

    if current_user.role == 'employee' and application.user_id != current_user.id:
        return jsonify({'error': '权限不足'}), 403

    return jsonify({'application': application.to_dict()}), 200

@applications_bp.route('', methods=['POST'])
@login_required
def create_application():
    data = request.get_json()
    holiday_type_id = data.get('holiday_type_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    reason = data.get('reason')

    if not holiday_type_id or not start_date_str or not end_date_str:
        return jsonify({'error': '假期类型、开始日期和结束日期不能为空'}), 400

    start_date = parser.parse(start_date_str).date()
    end_date = parser.parse(end_date_str).date()

    if start_date > end_date:
        return jsonify({'error': '开始日期不能晚于结束日期'}), 400

    days = calculate_days(start_date, end_date)

    year = start_date.year
    quota = AnnualQuota.query.filter_by(
        user_id=current_user.id,
        holiday_type_id=holiday_type_id,
        year=year
    ).first()

    if not quota:
        return jsonify({'error': '该年度此假期类型无额度配置'}), 400

    pending_days = get_pending_days(current_user.id, holiday_type_id, year)
    used_days = quota.used_days + pending_days
    remaining = quota.total_days - used_days

    if remaining < days:
        return jsonify({
            'error': f'额度不足，剩余 {remaining} 天（含待审批 {pending_days} 天），申请 {days} 天',
            'remaining': remaining,
            'used_days': quota.used_days,
            'pending_days': pending_days,
            'total_days': quota.total_days,
            'requested': days
        }), 400

    overlapping = LeaveApplication.query.filter(
        LeaveApplication.user_id == current_user.id,
        LeaveApplication.status != 'rejected',
        LeaveApplication.status != 'cancelled',
        LeaveApplication.start_date <= end_date,
        LeaveApplication.end_date >= start_date
    ).first()

    if overlapping:
        return jsonify({'error': '该时间段已有请假申请'}), 400

    application = LeaveApplication(
        user_id=current_user.id,
        holiday_type_id=holiday_type_id,
        start_date=start_date,
        end_date=end_date,
        days=days,
        reason=reason,
        status='pending'
    )

    db.session.add(application)
    db.session.commit()

    return jsonify({'message': '申请提交成功', 'application': application.to_dict()}), 201

@applications_bp.route('/<int:app_id>/approve', methods=['POST'])
@login_required
def approve_application(app_id):
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': '权限不足'}), 403

    application = LeaveApplication.query.get_or_404(app_id)

    if application.status != 'pending':
        return jsonify({'error': '只能审核待处理的申请'}), 400

    data = request.get_json()
    comment = data.get('comment', '')

    year = application.start_date.year
    quota = AnnualQuota.query.filter_by(
        user_id=application.user_id,
        holiday_type_id=application.holiday_type_id,
        year=year
    ).first()

    if not quota:
        return jsonify({'error': '额度信息不存在'}), 400

    pending_days = get_pending_days(application.user_id, application.holiday_type_id, year)
    used_days = quota.used_days + (pending_days - application.days)
    remaining = quota.total_days - used_days

    if remaining < application.days:
        return jsonify({'error': '额度不足，无法通过审批'}), 400

    quota.used_days += application.days
    application.status = 'approved'
    application.approver_id = current_user.id
    application.approval_comment = comment
    application.approved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': '审批通过', 'application': application.to_dict()}), 200

@applications_bp.route('/<int:app_id>/reject', methods=['POST'])
@login_required
def reject_application(app_id):
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': '权限不足'}), 403

    application = LeaveApplication.query.get_or_404(app_id)

    if application.status != 'pending':
        return jsonify({'error': '只能审核待处理的申请'}), 400

    data = request.get_json()
    comment = data.get('comment', '')

    application.status = 'rejected'
    application.approver_id = current_user.id
    application.approval_comment = comment
    application.approved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': '已拒绝申请', 'application': application.to_dict()}), 200

@applications_bp.route('/<int:app_id>/cancel', methods=['POST'])
@login_required
def cancel_application(app_id):
    application = LeaveApplication.query.get_or_404(app_id)

    if application.user_id != current_user.id:
        return jsonify({'error': '只能取消自己的申请'}), 403

    if application.status == 'approved':
        return jsonify({'error': '已审批通过的申请无法取消'}), 400

    if application.status != 'pending':
        return jsonify({'error': '只能取消待处理的申请'}), 400

    application.status = 'cancelled'
    db.session.commit()

    return jsonify({'message': '申请已取消', 'application': application.to_dict()}), 200

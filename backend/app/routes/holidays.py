from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import HolidayType, AnnualQuota, User
from datetime import datetime

holidays_bp = Blueprint('holidays', __name__)

@holidays_bp.route('/types', methods=['GET'])
@login_required
def get_holiday_types():
    is_active = request.args.get('is_active', type=bool)
    query = HolidayType.query
    if is_active is not None:
        query = query.filter_by(is_active=is_active)
    types = query.all()
    return jsonify({'types': [t.to_dict() for t in types]}), 200

@holidays_bp.route('/types', methods=['POST'])
@login_required
def create_holiday_type():
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    name = data.get('name')
    code = data.get('code')

    if not name or not code:
        return jsonify({'error': '假期名称和代码不能为空'}), 400

    if HolidayType.query.filter_by(code=code).first():
        return jsonify({'error': '假期代码已存在'}), 400

    holiday_type = HolidayType(
        name=name,
        code=code,
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )

    db.session.add(holiday_type)
    db.session.commit()

    return jsonify({'message': '假期类型创建成功', 'type': holiday_type.to_dict()}), 201

@holidays_bp.route('/types/<int:type_id>', methods=['PUT'])
@login_required
def update_holiday_type(type_id):
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    holiday_type = HolidayType.query.get_or_404(type_id)
    data = request.get_json()

    if 'name' in data:
        holiday_type.name = data['name']
    if 'description' in data:
        holiday_type.description = data['description']
    if 'is_active' in data:
        holiday_type.is_active = data['is_active']

    db.session.commit()
    return jsonify({'message': '假期类型更新成功', 'type': holiday_type.to_dict()}), 200

@holidays_bp.route('/quotas', methods=['GET'])
@login_required
def get_quotas():
    user_id = request.args.get('user_id', type=int)
    year = request.args.get('year', type=int, default=datetime.now().year)

    if current_user.role == 'employee':
        user_id = current_user.id

    if user_id is None and current_user.role not in ['admin', 'manager']:
        return jsonify({'error': '权限不足'}), 403

    query = AnnualQuota.query.filter_by(year=year)
    if user_id:
        query = query.filter_by(user_id=user_id)

    quotas = query.all()
    return jsonify({'quotas': [q.to_dict() for q in quotas]}), 200

@holidays_bp.route('/quotas', methods=['POST'])
@login_required
def create_quota():
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    user_id = data.get('user_id')
    holiday_type_id = data.get('holiday_type_id')
    year = data.get('year', datetime.now().year)
    total_days = data.get('total_days')

    if not user_id or not holiday_type_id or total_days is None:
        return jsonify({'error': '用户、假期类型和总天数不能为空'}), 400

    existing = AnnualQuota.query.filter_by(
        user_id=user_id,
        holiday_type_id=holiday_type_id,
        year=year
    ).first()

    if existing:
        return jsonify({'error': '该用户该年度此假期额度已存在'}), 400

    quota = AnnualQuota(
        user_id=user_id,
        holiday_type_id=holiday_type_id,
        year=year,
        total_days=total_days,
        used_days=0.0
    )

    db.session.add(quota)
    db.session.commit()

    return jsonify({'message': '额度创建成功', 'quota': quota.to_dict()}), 201

@holidays_bp.route('/quotas/batch', methods=['POST'])
@login_required
def batch_create_quotas():
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    holiday_type_id = data.get('holiday_type_id')
    year = data.get('year', datetime.now().year)
    total_days = data.get('total_days')
    department_id = data.get('department_id')

    if not holiday_type_id or total_days is None:
        return jsonify({'error': '假期类型和总天数不能为空'}), 400

    query = User.query.filter_by(role='employee')
    if department_id:
        query = query.filter_by(department_id=department_id)

    users = query.all()
    created_count = 0

    for user in users:
        existing = AnnualQuota.query.filter_by(
            user_id=user.id,
            holiday_type_id=holiday_type_id,
            year=year
        ).first()

        if not existing:
            quota = AnnualQuota(
                user_id=user.id,
                holiday_type_id=holiday_type_id,
                year=year,
                total_days=total_days,
                used_days=0.0
            )
            db.session.add(quota)
            created_count += 1

    db.session.commit()

    return jsonify({
        'message': f'批量创建成功，共创建 {created_count} 条额度记录',
        'created_count': created_count
    }), 201

@holidays_bp.route('/quotas/<int:quota_id>', methods=['PUT'])
@login_required
def update_quota(quota_id):
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    quota = AnnualQuota.query.get_or_404(quota_id)
    data = request.get_json()

    if 'total_days' in data:
        quota.total_days = data['total_days']

    db.session.commit()
    return jsonify({'message': '额度更新成功', 'quota': quota.to_dict()}), 200

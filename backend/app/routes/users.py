from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import User, Department

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@login_required
def get_users():
    if current_user.role not in ['admin', 'manager']:
        return jsonify({'error': '权限不足'}), 403

    department_id = request.args.get('department_id', type=int)
    role = request.args.get('role')

    query = User.query

    if department_id:
        query = query.filter_by(department_id=department_id)
    if role:
        query = query.filter_by(role=role)

    users = query.all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    if current_user.role not in ['admin', 'manager'] and current_user.id != user_id:
        return jsonify({'error': '权限不足'}), 403

    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()}), 200

@users_bp.route('', methods=['POST'])
@login_required
def create_user():
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    username = data.get('username')
    password = data.get('password', '123456')
    name = data.get('name')
    email = data.get('email')
    role = data.get('role', 'employee')
    department_id = data.get('department_id')

    if not username or not name:
        return jsonify({'error': '用户名和姓名不能为空'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': '用户名已存在'}), 400

    user = User(
        username=username,
        password=password,
        name=name,
        email=email,
        role=role,
        department_id=department_id
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': '用户创建成功', 'user': user.to_dict()}), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'error': '权限不足'}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'department_id' in data and current_user.role == 'admin':
        user.department_id = data['department_id']
    if 'role' in data and current_user.role == 'admin':
        user.role = data['role']

    db.session.commit()
    return jsonify({'message': '用户更新成功', 'user': user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()

    return jsonify({'message': '用户删除成功'}), 200

@users_bp.route('/departments', methods=['GET'])
@login_required
def get_departments():
    departments = Department.query.all()
    return jsonify({'departments': [d.to_dict() for d in departments]}), 200

@users_bp.route('/departments', methods=['POST'])
@login_required
def create_department():
    if current_user.role != 'admin':
        return jsonify({'error': '权限不足'}), 403

    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({'error': '部门名称不能为空'}), 400

    if Department.query.filter_by(name=name).first():
        return jsonify({'error': '部门已存在'}), 400

    department = Department(
        name=name,
        description=data.get('description'),
        manager_id=data.get('manager_id')
    )

    db.session.add(department)
    db.session.commit()

    return jsonify({'message': '部门创建成功', 'department': department.to_dict()}), 201

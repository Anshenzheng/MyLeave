from datetime import datetime
from app import db, login_manager
from flask_login import UserMixin

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120))
    role = db.Column(db.String(20), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = db.relationship('Department', backref='users', foreign_keys=[department_id])
    applications = db.relationship('LeaveApplication', backref='employee', lazy='dynamic', foreign_keys='LeaveApplication.user_id')
    quotas = db.relationship('AnnualQuota', backref='user', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None
        }

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200))
    manager_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'manager_id': self.manager_id
        }

class HolidayType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'is_active': self.is_active
        }

class AnnualQuota(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    holiday_type_id = db.Column(db.Integer, db.ForeignKey('holiday_type.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_days = db.Column(db.Float, nullable=False)
    used_days = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    holiday_type = db.relationship('HolidayType', backref='quotas')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'holiday_type_id': self.holiday_type_id,
            'holiday_type_name': self.holiday_type.name if self.holiday_type else None,
            'year': self.year,
            'total_days': self.total_days,
            'used_days': self.used_days,
            'remaining_days': self.total_days - self.used_days
        }

class LeaveApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    holiday_type_id = db.Column(db.Integer, db.ForeignKey('holiday_type.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending')
    approver_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    approval_comment = db.Column(db.String(500))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    holiday_type = db.relationship('HolidayType', backref='applications')
    approver = db.relationship('User', backref='approved_applications', foreign_keys=[approver_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'employee_name': self.employee.name if self.employee else None,
            'employee_department': self.employee.department.name if self.employee and self.employee.department else None,
            'holiday_type_id': self.holiday_type_id,
            'holiday_type_name': self.holiday_type.name if self.holiday_type else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'days': self.days,
            'reason': self.reason,
            'status': self.status,
            'approver_id': self.approver_id,
            'approver_name': self.approver.name if self.approver else None,
            'approval_comment': self.approval_comment,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

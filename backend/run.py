from app import create_app, db
from app.models import User, Department, HolidayType, AnnualQuota
from datetime import datetime

app = create_app()

with app.app_context():
    db.create_all()

    if not Department.query.filter_by(name='技术部').first():
        dept1 = Department(name='技术部', description='技术研发部门')
        dept2 = Department(name='市场部', description='市场营销部门')
        dept3 = Department(name='人事部', description='人力资源部门')
        db.session.add_all([dept1, dept2, dept3])
        db.session.commit()

    if not HolidayType.query.filter_by(code='annual').first():
        ht1 = HolidayType(name='年假', code='annual', description='带薪年假', is_active=True)
        ht2 = HolidayType(name='病假', code='sick', description='病假', is_active=True)
        ht3 = HolidayType(name='事假', code='personal', description='事假', is_active=True)
        ht4 = HolidayType(name='婚假', code='marriage', description='婚假', is_active=True)
        ht5 = HolidayType(name='产假', code='maternity', description='产假', is_active=True)
        db.session.add_all([ht1, ht2, ht3, ht4, ht5])
        db.session.commit()

    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            password='admin123',
            name='系统管理员',
            email='admin@company.com',
            role='admin'
        )
        db.session.add(admin)

        manager1 = User(
            username='manager1',
            password='123456',
            name='张经理',
            email='zhang@company.com',
            role='manager',
            department_id=1
        )
        db.session.add(manager1)

        employee1 = User(
            username='employee1',
            password='123456',
            name='李员工',
            email='li@company.com',
            role='employee',
            department_id=1
        )
        db.session.add(employee1)

        employee2 = User(
            username='employee2',
            password='123456',
            name='王员工',
            email='wang@company.com',
            role='employee',
            department_id=1
        )
        db.session.add(employee2)

        db.session.commit()

        current_year = datetime.now().year
        for user in [employee1, employee2]:
            quota1 = AnnualQuota(
                user_id=user.id,
                holiday_type_id=1,
                year=current_year,
                total_days=10.0,
                used_days=0.0
            )
            quota2 = AnnualQuota(
                user_id=user.id,
                holiday_type_id=2,
                year=current_year,
                total_days=5.0,
                used_days=0.0
            )
            quota3 = AnnualQuota(
                user_id=user.id,
                holiday_type_id=3,
                year=current_year,
                total_days=3.0,
                used_days=0.0
            )
            db.session.add_all([quota1, quota2, quota3])

        db.session.commit()

    print('数据库初始化完成！')
    print('默认账号：')
    print('  管理员: admin / admin123')
    print('  经理: manager1 / 123456')
    print('  员工: employee1 / 123456, employee2 / 123456')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

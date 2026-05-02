from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, supports_credentials=True)
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.holidays import holidays_bp
    from app.routes.applications import applications_bp
    from app.routes.reports import reports_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(holidays_bp, url_prefix='/api/holidays')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    
    return app

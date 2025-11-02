"""
Flask Application for Rice Disease Diagnosis Expert System
Main application factory and configuration
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app(config_name='development'):
    """Application factory function"""
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # We'll use session-based auth
    app.config['DATABASE_URL'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/padi_diagnosis')

    # Google OAuth Configuration
    app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID')
    app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET')

    # AI Configuration
    app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
    app.config['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')
    app.config['AI_MODEL'] = os.getenv('AI_MODEL', 'openai')  # 'openai' or 'gemini'

    # Rate limiting
    app.config['RATELIMIT_STORAGE_URL'] = os.getenv('REDIS_URL', 'memory://')
    app.config['RATELIMIT_DEFAULT'] = "200 per hour"

    # Initialize extensions
    CORS(app,
         origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')],
         supports_credentials=True)

    JWTManager(app)

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per hour"]
    )

    # Register blueprints
    from app.api.auth import auth_bp
    from app.api.diagnosis import diagnosis_bp
    from app.api.history import history_bp
    from app.api.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(diagnosis_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'padi-diagnosis-backend'}

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return {'error': 'Rate limit exceeded'}, 429

    return app
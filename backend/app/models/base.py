"""
Base database configuration
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Initialize SQLAlchemy
db = SQLAlchemy()

def init_database(app):
    """Initialize database with Flask app"""
    db.init_app(app)

    with app.app_context():
        # Import all models to ensure they're registered
        from .user import User
        from .symptom import Symptom
        from .disease import Disease
        from .treatment import Treatment, Medication
        from .rule import Rule, RuleSymptom
        from .diagnosis import DiagnosisHistory, DiagnosisStep, DiagnosisFeedback

        # Create tables
        db.create_all()
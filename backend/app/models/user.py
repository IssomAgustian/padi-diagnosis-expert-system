"""
User model for authentication and user management
"""

from datetime import datetime
from .base import db
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
import uuid

class User(db.Model):
    """User model for Google OAuth authentication"""
    __tablename__ = 'users'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    google_id = Column(String(100), unique=True, nullable=False)  # Google user ID
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(Text)  # Google profile picture
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin role
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    diagnosis_history = relationship("DiagnosisHistory", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("DiagnosisFeedback", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
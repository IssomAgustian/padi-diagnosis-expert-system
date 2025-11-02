"""
Symptom model for rice plant symptoms with Certainty Factor values
"""

from datetime import datetime
from .base import db
from sqlalchemy import Column, String, Numeric, DateTime, Text
from sqlalchemy.orm import relationship

class Symptom(db.Model):
    """Symptom model for rice plant symptoms"""
    __tablename__ = 'symptoms'

    id = Column(String(10), primary_key=True)  # e.g., "G01", "G02"
    name = Column(String(255), nullable=False)
    description = Column(Text)
    mb_value = Column(Numeric(3, 2), nullable=False, default=0.5)  # Measure of Belief (0-1)
    md_value = Column(Numeric(3, 2), nullable=False, default=0.5)  # Measure of Disbelief (0-1)
    category = Column(String(50), nullable=False)  # e.g., "Daun", "Batang", "Bunga"
    severity = Column(String(20), nullable=False)  # "ringan", "sedang", "berat"
    is_active = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    rule_symptoms = relationship("RuleSymptom", back_populates="symptom", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Symptom {self.id}: {self.name}>'

    def to_dict(self):
        """Convert symptom to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'mb_value': float(self.mb_value) if self.mb_value else 0.5,
            'md_value': float(self.md_value) if self.md_value else 0.5,
            'category': self.category,
            'severity': self.severity,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def get_active_symptoms(cls):
        """Get all active symptoms"""
        return cls.query.filter_by(is_active='yes').all()

    @classmethod
    def get_by_ids(cls, symptom_ids):
        """Get symptoms by list of IDs"""
        return cls.query.filter(cls.id.in_(symptom_ids), cls.is_active == 'yes').all()
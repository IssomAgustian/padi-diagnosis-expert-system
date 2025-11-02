"""
Disease model for rice plant diseases
"""

from datetime import datetime
from .base import db
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.orm import relationship

class Disease(db.Model):
    """Disease model for rice plant diseases"""
    __tablename__ = 'diseases'

    id = Column(String(10), primary_key=True)  # e.g., "P01", "P02"
    name = Column(String(255), nullable=False)
    scientific_name = Column(String(255))
    description = Column(Text, nullable=False)
    overview = Column(Text)
    causal_agent = Column(Text)
    favorable_conditions = Column(Text)
    economic_impact = Column(Text)
    is_active = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    treatments = relationship("Treatment", back_populates="disease", cascade="all, delete-orphan")
    rules = relationship("Rule", back_populates="disease", cascade="all, delete-orphan")
    diagnosis_history = relationship("DiagnosisHistory", back_populates="disease")

    def __repr__(self):
        return f'<Disease {self.id}: {self.name}>'

    def to_dict(self, include_treatments=False):
        """Convert disease to dictionary"""
        result = {
            'id': self.id,
            'name': self.name,
            'scientific_name': self.scientific_name,
            'description': self.description,
            'overview': self.overview,
            'causal_agent': self.causal_agent,
            'favorable_conditions': self.favorable_conditions,
            'economic_impact': self.economic_impact,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_treatments:
            result['treatments'] = [treatment.to_dict(include_medications=True)
                                  for treatment in self.treatments
                                  if treatment.is_active == 'yes']

        return result

    @classmethod
    def get_active_diseases(cls):
        """Get all active diseases"""
        return cls.query.filter_by(is_active='yes').all()

    @classmethod
    def get_by_id(cls, disease_id):
        """Get disease by ID"""
        return cls.query.filter_by(id=disease_id, is_active='yes').first()
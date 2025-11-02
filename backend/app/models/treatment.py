"""
Treatment and Medication models for disease treatment recommendations
"""

from datetime import datetime
from .base import db
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
import json

class Treatment(db.Model):
    """Treatment model for disease treatment recommendations"""
    __tablename__ = 'treatments'

    id = Column(String(10), primary_key=True)  # Unique treatment ID
    disease_id = Column(String(10), ForeignKey('diseases.id'), nullable=False)
    treatment_type = Column(String(20), nullable=False)  # "chemical", "biological", "cultural", "integrated"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    steps = Column(Text, nullable=False)  # JSON array of treatment steps
    recommendation = Column(Text)
    preventive_measures = Column(Text)
    is_active = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    priority = Column(Integer, nullable=False, default=1)  # 1=high, 2=medium, 3=low
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    disease = relationship("Disease", back_populates="treatments")
    medications = relationship("Medication", back_populates="treatment", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Treatment {self.id}: {self.title}>'

    def to_dict(self, include_medications=False):
        """Convert treatment to dictionary"""
        result = {
            'id': self.id,
            'disease_id': self.disease_id,
            'treatment_type': self.treatment_type,
            'title': self.title,
            'description': self.description,
            'steps': json.loads(self.steps) if self.steps else [],
            'recommendation': self.recommendation,
            'preventive_measures': self.preventive_measures,
            'is_active': self.is_active,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_medications:
            result['medications'] = [med.to_dict() for med in self.medications if med.is_active == 'yes']

        return result

    @property
    def steps_list(self):
        """Get steps as list"""
        try:
            return json.loads(self.steps) if self.steps else []
        except (json.JSONDecodeError, TypeError):
            return []

    @steps_list.setter
    def steps_list(self, value):
        """Set steps from list"""
        self.steps = json.dumps(value) if value else "[]"


class Medication(db.Model):
    """Medication model for specific medication recommendations"""
    __tablename__ = 'medications'

    id = Column(String(10), primary_key=True)
    treatment_id = Column(String(10), ForeignKey('treatments.id'), nullable=False)
    name = Column(String(255), nullable=False)
    active_ingredient = Column(String(255), nullable=False)
    dosage = Column(String(255), nullable=False)
    application_method = Column(String(255), nullable=False)
    frequency = Column(String(255), nullable=False)
    pre_harvest_interval = Column(String(50))  # Days before harvest
    safety_precautions = Column(Text)
    manufacturer = Column(String(255))
    is_active = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    treatment = relationship("Treatment", back_populates="medications")

    def __repr__(self):
        return f'<Medication {self.id}: {self.name}>'

    def to_dict(self):
        """Convert medication to dictionary"""
        return {
            'id': self.id,
            'treatment_id': self.treatment_id,
            'name': self.name,
            'active_ingredient': self.active_ingredient,
            'dosage': self.dosage,
            'application_method': self.application_method,
            'frequency': self.frequency,
            'pre_harvest_interval': self.pre_harvest_interval,
            'safety_precautions': self.safety_precautions,
            'manufacturer': self.manufacturer,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
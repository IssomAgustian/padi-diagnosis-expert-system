"""
Rule models for forward chaining expert system
"""

from datetime import datetime
from .base import db
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
import json

class Rule(db.Model):
    """Rule model for forward chaining diagnosis"""
    __tablename__ = 'rules'

    id = Column(String(10), primary_key=True)  # e.g., "R001", "R002"
    disease_id = Column(String(10), ForeignKey('diseases.id'), nullable=False)
    name = Column(String(255), nullable=False)
    symptom_conditions = Column(Text, nullable=False)  # JSON array of required symptom codes
    certainty_threshold = Column(Numeric(3, 2), nullable=False, default=0.8)  # Minimum CF threshold
    rule_type = Column(String(20), nullable=False, default='exact')  # "exact", "partial", "weighted"
    confidence = Column(Numeric(3, 2), nullable=False, default=1.0)  # Rule confidence level
    priority = Column(Integer, nullable=False, default=1)  # Rule priority for conflicts
    is_active = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    disease = relationship("Disease", back_populates="rules")
    rule_symptoms = relationship("RuleSymptom", back_populates="rule", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Rule {self.id}: {self.name}>'

    def to_dict(self):
        """Convert rule to dictionary"""
        return {
            'id': self.id,
            'disease_id': self.disease_id,
            'name': self.name,
            'symptom_conditions': json.loads(self.symptom_conditions) if self.symptom_conditions else [],
            'certainty_threshold': float(self.certainty_threshold) if self.certainty_threshold else 0.8,
            'rule_type': self.rule_type,
            'confidence': float(self.confidence) if self.confidence else 1.0,
            'priority': self.priority,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @property
    def symptom_conditions_list(self):
        """Get symptom conditions as list"""
        try:
            return json.loads(self.symptom_conditions) if self.symptom_conditions else []
        except (json.JSONDecodeError, TypeError):
            return []

    @symptom_conditions_list.setter
    def symptom_conditions_list(self, value):
        """Set symptom conditions from list"""
        self.symptom_conditions = json.dumps(value) if value else "[]"

    @classmethod
    def get_active_rules(cls):
        """Get all active rules"""
        return cls.query.filter_by(is_active='yes').order_by(cls.priority.asc()).all()

    def matches_symptoms(self, selected_symptoms):
        """Check if rule matches selected symptoms"""
        required_symptoms = set(self.symptom_conditions_list)
        selected_set = set(selected_symptoms)

        if self.rule_type == 'exact':
            return required_symptoms == selected_set
        elif self.rule_type == 'partial':
            return required_symptoms.issubset(selected_set)
        elif self.rule_type == 'weighted':
            # For weighted rules, check if all required symptoms are present
            required = [rs.symptom_id for rs in self.rule_symptoms if rs.is_required == 'yes']
            return set(required).issubset(selected_set)

        return False


class RuleSymptom(db.Model):
    """Rule-Symptom relationship for weighted rules"""
    __tablename__ = 'rule_symptoms'

    id = Column(String(36), primary_key=True)
    rule_id = Column(String(10), ForeignKey('rules.id'), nullable=False)
    symptom_id = Column(String(10), ForeignKey('symptoms.id'), nullable=False)
    weight = Column(Numeric(3, 2), nullable=False, default=1.0)  # Symptom weight in rule (0-1)
    is_required = Column(String(3), nullable=False, default='yes')  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    rule = relationship("Rule", back_populates="rule_symptoms")
    symptom = relationship("Symptom", back_populates="rule_symptoms")

    def __repr__(self):
        return f'<RuleSymptom {self.rule_id}:{self.symptom_id}>'

    def to_dict(self):
        """Convert rule symptom to dictionary"""
        return {
            'id': self.id,
            'rule_id': self.rule_id,
            'symptom_id': self.symptom_id,
            'weight': float(self.weight) if self.weight else 1.0,
            'is_required': self.is_required,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
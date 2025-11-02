"""
Diagnosis models for tracking diagnosis history and steps
"""

from datetime import datetime, timedelta
from .base import db
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
import json
import uuid

class DiagnosisHistory(db.Model):
    """Main diagnosis history table"""
    __tablename__ = 'diagnosis_history'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    session_id = Column(String(36), nullable=False)  # Session identifier
    symptoms_selected = Column(Text, nullable=False)  # JSON array of selected symptom IDs
    symptom_details = Column(Text)  # JSON object with symptom names and details
    certainty_factors = Column(Text)  # JSON object with CF values per symptom
    disease_id = Column(String(10), ForeignKey('diseases.id'))  # Final diagnosed disease
    disease_name = Column(String(255))  # Cached disease name for performance
    final_certainty_score = Column(Numeric(3, 2))  # Final CF calculation
    diagnosis_method = Column(String(20), nullable=False)  # "forward_chaining", "certainty_factor", "hybrid"
    rule_id = Column(String(10), ForeignKey('rules.id'))  # Rule that matched (if any)
    ai_response = Column(Text)  # JSON object with AI-generated treatment plan
    ai_model = Column(String(50))  # AI model used
    ai_tokens_used = Column(Integer)  # AI API tokens consumed
    processing_time = Column(Integer)  # Processing time in milliseconds
    ip_address = Column(String(45))  # User IP for analytics
    user_agent = Column(Text)  # Browser user agent
    status = Column(String(20), nullable=False, default='completed')  # "completed", "pending", "failed"
    expires_at = Column(DateTime, nullable=False)  # 30 days from creation
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="diagnosis_history")
    disease = relationship("Disease", back_populates="diagnosis_history")
    rule = relationship("Rule")
    steps = relationship("DiagnosisStep", back_populates="diagnosis", cascade="all, delete-orphan")
    feedback = relationship("DiagnosisFeedback", back_populates="diagnosis", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<DiagnosisHistory {self.id}: {self.disease_name}>'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(days=30)
        if not self.session_id:
            self.session_id = str(uuid.uuid4())

    def to_dict(self, include_ai_response=False):
        """Convert diagnosis to dictionary"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'symptoms_selected': json.loads(self.symptoms_selected) if self.symptoms_selected else [],
            'symptom_details': json.loads(self.symptom_details) if self.symptom_details else {},
            'certainty_factors': json.loads(self.certainty_factors) if self.certainty_factors else {},
            'disease_id': self.disease_id,
            'disease_name': self.disease_name,
            'final_certainty_score': float(self.final_certainty_score) if self.final_certainty_score else None,
            'diagnosis_method': self.diagnosis_method,
            'rule_id': self.rule_id,
            'ai_model': self.ai_model,
            'ai_tokens_used': self.ai_tokens_used,
            'processing_time': self.processing_time,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }

        if include_ai_response and self.ai_response:
            result['ai_response'] = json.loads(self.ai_response)

        return result

    @property
    def symptoms_selected_list(self):
        """Get symptoms selected as list"""
        try:
            return json.loads(self.symptoms_selected) if self.symptoms_selected else []
        except (json.JSONDecodeError, TypeError):
            return []

    @symptoms_selected_list.setter
    def symptoms_selected_list(self, value):
        """Set symptoms selected from list"""
        self.symptoms_selected = json.dumps(value) if value else "[]"

    @property
    def certainty_factors_dict(self):
        """Get certainty factors as dictionary"""
        try:
            return json.loads(self.certainty_factors) if self.certainty_factors else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    @certainty_factors_dict.setter
    def certainty_factors_dict(self, value):
        """Set certainty factors from dictionary"""
        self.certainty_factors = json.dumps(value) if value else "{}"

    @classmethod
    def get_user_history(cls, user_id, page=1, per_page=20):
        """Get paginated user diagnosis history"""
        return cls.query.filter_by(
            user_id=user_id,
            status='completed'
        ).order_by(
            cls.created_at.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    @classmethod
    def cleanup_expired(cls):
        """Clean up expired records"""
        expired_count = cls.query.filter(
            cls.expires_at < datetime.utcnow(),
            cls.status == 'completed'
        ).delete()
        db.session.commit()
        return expired_count


class DiagnosisStep(db.Model):
    """Diagnosis steps for tracking intermediate steps"""
    __tablename__ = 'diagnosis_steps'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    diagnosis_id = Column(String(36), ForeignKey('diagnosis_history.id'), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(String(50), nullable=False)  # "initial_input", "rule_matching", "cf_calculation", "ai_processing", "final_result"
    step_data = Column(Text, nullable=False)  # JSON object with step data
    description = Column(Text)  # Human-readable description
    processing_time = Column(Integer)  # Time for this step in ms
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    diagnosis = relationship("DiagnosisHistory", back_populates="steps")

    def __repr__(self):
        return f'<DiagnosisStep {self.step_number}: {self.step_type}>'

    def to_dict(self):
        """Convert diagnosis step to dictionary"""
        return {
            'id': self.id,
            'diagnosis_id': self.diagnosis_id,
            'step_number': self.step_number,
            'step_type': self.step_type,
            'step_data': json.loads(self.step_data) if self.step_data else {},
            'description': self.description,
            'processing_time': self.processing_time,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    @classmethod
    def get_diagnosis_steps(cls, diagnosis_id):
        """Get all steps for a diagnosis"""
        return cls.query.filter_by(diagnosis_id=diagnosis_id).order_by(cls.step_number.asc()).all()


class DiagnosisFeedback(db.Model):
    """User feedback on diagnosis accuracy"""
    __tablename__ = 'diagnosis_feedback'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    diagnosis_id = Column(String(36), ForeignKey('diagnosis_history.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    accuracy = Column(Integer, nullable=False)  # 1-5 rating of accuracy
    helpfulness = Column(Integer, nullable=False)  # 1-5 rating of helpfulness
    comments = Column(Text)  # User comments
    actual_disease = Column(String(255))  # If user later confirms different disease
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    diagnosis = relationship("DiagnosisHistory", back_populates="feedback")
    user = relationship("User", back_populates="feedback")

    def __repr__(self):
        return f'<DiagnosisFeedback {self.id}: {self.accuracy}/{self.helpfulness}>'

    def to_dict(self):
        """Convert feedback to dictionary"""
        return {
            'id': self.id,
            'diagnosis_id': self.diagnosis_id,
            'user_id': self.user_id,
            'accuracy': self.accuracy,
            'helpfulness': self.helpfulness,
            'comments': self.comments,
            'actual_disease': self.actual_disease,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
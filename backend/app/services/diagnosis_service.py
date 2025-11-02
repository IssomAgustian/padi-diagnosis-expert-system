"""
Diagnosis Service combining Forward Chaining and Certainty Factor methods
"""

import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import and_

from app.models.base import db
from app.models.symptom import Symptom
from app.models.disease import Disease
from app.models.rule import Rule, RuleSymptom
from app.models.diagnosis import DiagnosisHistory, DiagnosisStep
from app.services.ai_service import get_ai_service
from app.utils.errors import ValidationError

class DiagnosisEngine:
    """Main diagnosis engine combining forward chaining and certainty factors"""

    def __init__(self):
        self.ai_service = get_ai_service()

    def diagnose(self, user_id: str, selected_symptoms: List[str], certainty_factors: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Perform diagnosis using forward chaining and certainty factors
        """
        start_time = time.time()
        diagnosis_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        try:
            # Validate input
            self._validate_diagnosis_input(selected_symptoms, certainty_factors)

            # Create diagnosis record
            diagnosis = self._create_diagnosis_record(
                diagnosis_id, user_id, session_id, selected_symptoms, certainty_factors
            )

            # Step 1: Forward Chaining - Find exact rule matches
            self._log_diagnosis_step(diagnosis_id, 1, "initial_input", {
                "selected_symptoms": selected_symptoms,
                "certainty_factors": certainty_factors
            }, "Initial user input received")

            forward_result = self._forward_chaining(selected_symptoms)
            self._log_diagnosis_step(diagnosis_id, 2, "rule_matching", forward_result,
                                   "Forward chaining rule matching")

            if forward_result["exact_match"]:
                # Exact match found - use forward chaining result
                result = self._handle_exact_match(diagnosis, forward_result, start_time)
            else:
                # No exact match - use certainty factors if provided, or request them
                if certainty_factors is None:
                    result = {
                        "requires_certainty_factors": True,
                        "selected_symptoms": selected_symptoms,
                        "message": "Please provide certainty levels for selected symptoms"
                    }
                else:
                    # Perform certainty factor calculation
                    cf_result = self._certainty_factor_calculation(selected_symptoms, certainty_factors)
                    self._log_diagnosis_step(diagnosis_id, 3, "cf_calculation", cf_result,
                                           "Certainty factor calculation")

                    if cf_result["confidence"] > 0.5:  # Minimum confidence threshold
                        result = self._handle_certainty_match(diagnosis, cf_result, start_time)
                    else:
                        result = {
                            "diagnosis": "unknown",
                            "confidence": cf_result["confidence"],
                            "message": "Unable to determine disease with sufficient confidence",
                            "recommendations": ["Consult local agricultural extension officer"]
                        }

            processing_time = int((time.time() - start_time) * 1000)
            diagnosis.processing_time = processing_time
            db.session.commit()

            return result

        except Exception as e:
            db.session.rollback()
            diagnosis = DiagnosisHistory.query.get(diagnosis_id)
            if diagnosis:
                diagnosis.status = 'failed'
                db.session.commit()

            raise e

    def _validate_diagnosis_input(self, symptoms: List[str], certainty_factors: Optional[Dict[str, float]]):
        """Validate diagnosis input parameters"""
        if not symptoms:
            raise ValidationError("No symptoms provided")

        # Validate symptom IDs format
        valid_symptoms = Symptom.query.filter(Symptom.id.in_(symptoms), Symptom.is_active == 'yes').all()
        valid_ids = [s.id for s in valid_symptoms]

        if len(valid_ids) != len(symptoms):
            invalid_symptoms = set(symptoms) - set(valid_ids)
            raise ValidationError(f"Invalid symptoms: {invalid_symptoms}")

        # Validate certainty factors if provided
        if certainty_factors is not None:
            for symptom_id, cf_value in certainty_factors.items():
                if symptom_id not in symptoms:
                    raise ValidationError(f"Certainty factor provided for non-selected symptom: {symptom_id}")

                if not isinstance(cf_value, (int, float)) or not (0 <= cf_value <= 100):
                    raise ValidationError(f"Invalid certainty factor for {symptom_id}: {cf_value}")

    def _create_diagnosis_record(self, diagnosis_id: str, user_id: str, session_id: str,
                               symptoms: List[str], certainty_factors: Optional[Dict[str, float]]) -> DiagnosisHistory:
        """Create initial diagnosis record"""
        import json

        # Get symptom details for storage
        symptom_details = {}
        for symptom in Symptom.query.filter(Symptom.id.in_(symptoms)).all():
            symptom_details[symptom.id] = {
                "name": symptom.name,
                "description": symptom.description,
                "category": symptom.category
            }

        diagnosis = DiagnosisHistory(
            id=diagnosis_id,
            user_id=user_id,
            session_id=session_id,
            symptoms_selected=json.dumps(symptoms),
            symptom_details=json.dumps(symptom_details),
            certainty_factors=json.dumps(certainty_factors) if certainty_factors else None,
            diagnosis_method="forward_chaining",  # Will be updated based on method used
            status="pending",
            expires_at=datetime.utcnow() + timedelta(days=30)
        )

        db.session.add(diagnosis)
        db.session.commit()
        return diagnosis

    def _log_diagnosis_step(self, diagnosis_id: str, step_number: int, step_type: str,
                          step_data: Dict[str, Any], description: str):
        """Log diagnosis step for debugging and analysis"""
        import json

        step = DiagnosisStep(
            diagnosis_id=diagnosis_id,
            step_number=step_number,
            step_type=step_type,
            step_data=json.dumps(step_data),
            description=description,
            processing_time=int(time.time() * 1000)
        )

        db.session.add(step)

    def _forward_chaining(self, selected_symptoms: List[str]) -> Dict[str, Any]:
        """Perform forward chaining rule matching"""
        selected_set = set(selected_symptoms)
        active_rules = Rule.get_active_rules()

        for rule in active_rules:
            if rule.matches_symptoms(selected_symptoms):
                return {
                    "exact_match": True,
                    "rule_id": rule.id,
                    "disease_id": rule.disease_id,
                    "confidence": float(rule.confidence),
                    "rule_type": rule.rule_type,
                    "disease": rule.disease.to_dict() if rule.disease else None
                }

        return {
            "exact_match": False,
            "matched_rules": [],  # Could include partial matches
            "message": "No exact rule match found"
        }

    def _certainty_factor_calculation(self, selected_symptoms: List[str],
                                    certainty_factors: Dict[str, float]) -> Dict[str, Any]:
        """Perform certainty factor calculation"""
        cf_scores = {}

        for symptom_id in selected_symptoms:
            symptom = Symptom.query.get(symptom_id)
            if not symptom:
                continue

            user_cf = certainty_factors.get(symptom_id, 0) / 100.0  # Convert to 0-1 scale

            # Calculate combined CF: CF(H,E) = MB(H,E) - MD(H,E)
            mb = symptom.mb_value
            md = symptom.md_value
            symptom_cf = (mb - md) * user_cf

            cf_scores[symptom_id] = symptom_cf

        # Combine CFs using CF combination formula
        combined_cf = self._combine_certainty_factors(list(cf_scores.values()))

        # Determine most likely disease based on CF scores
        likely_disease = self._determine_disease_by_cf(selected_symptoms, cf_scores)

        return {
            "confidence": combined_cf,
            "symptom_cf_scores": cf_scores,
            "likely_disease": likely_disease,
            "method": "certainty_factor"
        }

    def _combine_certainty_factors(self, cf_values: List[float]) -> float:
        """Combine multiple certainty factors using CF combination formula"""
        if not cf_values:
            return 0.0

        combined_cf = cf_values[0]

        for cf in cf_values[1:]:
            if combined_cf >= 0 and cf >= 0:
                combined_cf = combined_cf + cf * (1 - combined_cf)
            elif combined_cf <= 0 and cf <= 0:
                combined_cf = combined_cf + cf * (1 + combined_cf)
            else:
                combined_cf = (combined_cf + cf) / (1 - min(abs(combined_cf), abs(cf)))

        return max(-1.0, min(1.0, combined_cf))

    def _determine_disease_by_cf(self, symptoms: List[str], cf_scores: Dict[str, float]) -> Optional[Dict[str, Any]]:
        """Determine most likely disease based on CF scores"""
        # This is a simplified approach - in practice, you'd use a more sophisticated method
        # based on symptom-disease relationships

        # For now, return a basic disease suggestion
        total_cf = sum(abs(cf) for cf in cf_scores.values())

        if total_cf > 0.5:  # Some threshold
            return {
                "disease_id": "P01",  # Default to first disease for now
                "confidence": total_cf / len(cf_scores) if cf_scores else 0,
                "method": "cf_based"
            }

        return None

    def _handle_exact_match(self, diagnosis: DiagnosisHistory, forward_result: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        """Handle exact rule match and generate AI response"""
        disease_id = forward_result["disease_id"]
        disease = Disease.query.get(disease_id)

        if not disease:
            raise ValidationError("Disease not found")

        # Update diagnosis record
        diagnosis.disease_id = disease_id
        diagnosis.disease_name = disease.name
        diagnosis.final_certainty_score = forward_result["confidence"]
        diagnosis.diagnosis_method = "forward_chaining"
        diagnosis.rule_id = forward_result["rule_id"]

        # Generate AI treatment plan
        try:
            ai_result = self.ai_service.generate_treatment_plan(
                disease.name,
                diagnosis.symptoms_selected_list,
                forward_result["confidence"]
            )

            # Update diagnosis with AI response
            import json
            diagnosis.ai_response = json.dumps(ai_result)
            diagnosis.ai_model = ai_result.get("model")
            diagnosis.ai_tokens_used = ai_result.get("tokens_used", 0)
            diagnosis.status = "completed"

            self._log_diagnosis_step(diagnosis.id, 4, "ai_processing", ai_result,
                                   "AI treatment plan generated")

            db.session.commit()

            return {
                "diagnosis": "completed",
                "disease": disease.to_dict(),
                "confidence": forward_result["confidence"],
                "method": "forward_chaining",
                "rule_id": forward_result["rule_id"],
                "treatment_plan": ai_result["treatment_plan"],
                "diagnosis_id": diagnosis.id
            }

        except Exception as e:
            # AI service failed, return basic result
            diagnosis.status = "completed"
            db.session.commit()

            return {
                "diagnosis": "completed",
                "disease": disease.to_dict(),
                "confidence": forward_result["confidence"],
                "method": "forward_chaining",
                "rule_id": forward_result["rule_id"],
                "treatment_plan": disease.treatments if disease.treatments else [],
                "ai_error": str(e),
                "diagnosis_id": diagnosis.id
            }

    def _handle_certainty_match(self, diagnosis: DiagnosisHistory, cf_result: Dict[str, Any], start_time: float) -> Dict[str, Any]:
        """Handle certainty factor based diagnosis"""
        likely_disease = cf_result.get("likely_disease")
        confidence = cf_result["confidence"]

        if likely_disease:
            disease_id = likely_disease["disease_id"]
            disease = Disease.query.get(disease_id)

            if disease:
                # Update diagnosis record
                diagnosis.disease_id = disease_id
                diagnosis.disease_name = disease.name
                diagnosis.final_certainty_score = confidence
                diagnosis.diagnosis_method = "certainty_factor"

                # Generate AI treatment plan
                try:
                    ai_result = self.ai_service.generate_treatment_plan(
                        disease.name,
                        diagnosis.symptoms_selected_list,
                        confidence
                    )

                    import json
                    diagnosis.ai_response = json.dumps(ai_result)
                    diagnosis.ai_model = ai_result.get("model")
                    diagnosis.ai_tokens_used = ai_result.get("tokens_used", 0)
                    diagnosis.status = "completed"

                    self._log_diagnosis_step(diagnosis.id, 4, "ai_processing", ai_result,
                                           "AI treatment plan generated")

                    db.session.commit()

                    return {
                        "diagnosis": "completed",
                        "disease": disease.to_dict(),
                        "confidence": confidence,
                        "method": "certainty_factor",
                        "symptom_cf_scores": cf_result["symptom_cf_scores"],
                        "treatment_plan": ai_result["treatment_plan"],
                        "diagnosis_id": diagnosis.id
                    }

                except Exception as e:
                    diagnosis.status = "completed"
                    db.session.commit()

                    return {
                        "diagnosis": "completed",
                        "disease": disease.to_dict(),
                        "confidence": confidence,
                        "method": "certainty_factor",
                        "symptom_cf_scores": cf_result["symptom_cf_scores"],
                        "treatment_plan": disease.treatments if disease.treatments else [],
                        "ai_error": str(e),
                        "diagnosis_id": diagnosis.id
                    }

        # No confident diagnosis possible
        diagnosis.status = "completed"
        db.session.commit()

        return {
            "diagnosis": "uncertain",
            "confidence": confidence,
            "method": "certainty_factor",
            "symptom_cf_scores": cf_result["symptom_cf_scores"],
            "message": "Low confidence in diagnosis",
            "recommendations": [
                "Consult local agricultural extension officer",
                "Consider laboratory testing",
                "Monitor symptom development"
            ],
            "diagnosis_id": diagnosis.id
        }


# Global diagnosis engine instance
_diagnosis_engine = None

def get_diagnosis_engine() -> DiagnosisEngine:
    """Get diagnosis engine instance"""
    global _diagnosis_engine
    if _diagnosis_engine is None:
        _diagnosis_engine = DiagnosisEngine()
    return _diagnosis_engine
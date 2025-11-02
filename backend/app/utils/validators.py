"""
Input validation utilities
"""

import re
from typing import List, Dict, Any
from .errors import ValidationError

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_symptom_ids(symptom_ids: List[str]) -> bool:
    """Validate symptom ID format (G01, G02, etc.)"""
    pattern = r'^G\d{2,3}$'
    return all(re.match(pattern, sid) for sid in symptom_ids)

def validate_certainty_factors(cf_dict: Dict[str, float]) -> bool:
    """Validate certainty factor values (0-100)"""
    if not isinstance(cf_dict, dict):
        return False

    for key, value in cf_dict.items():
        if not isinstance(value, (int, float)):
            return False
        if not (0 <= value <= 100):
            return False

    return True

def validate_diagnosis_request(data: Dict[str, Any]) -> None:
    """Validate diagnosis request payload"""
    if not isinstance(data, dict):
        raise ValidationError("Request data must be a JSON object")

    # Validate symptoms
    symptoms = data.get('symptoms', [])
    if not isinstance(symptoms, list):
        raise ValidationError("Symptoms must be an array")

    if len(symptoms) == 0:
        raise ValidationError("At least one symptom must be selected")

    if not validate_symptom_ids(symptoms):
        raise ValidationError("Invalid symptom ID format. Expected format: G01, G02, etc.")

def validate_certainty_request(data: Dict[str, Any]) -> None:
    """Validate certainty factor request payload"""
    if not isinstance(data, dict):
        raise ValidationError("Request data must be a JSON object")

    # Validate symptoms
    symptoms = data.get('symptoms', [])
    if not isinstance(symptoms, list):
        raise ValidationError("Symptoms must be an array")

    # Validate certainty factors
    certainty_factors = data.get('certainty_factors', {})
    if not validate_certainty_factors(certainty_factors):
        raise ValidationError("Certainty factors must be numbers between 0 and 100")

    # Check that all symptoms have certainty factors
    for symptom in symptoms:
        if symptom not in certainty_factors:
            raise ValidationError(f"Certainty factor missing for symptom: {symptom}")

def sanitize_string(text: str, max_length: int = 255) -> str:
    """Sanitize string input"""
    if not isinstance(text, str):
        return ""

    # Remove potential HTML/JS
    text = re.sub(r'<[^>]*>', '', text)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)

    # Limit length
    if len(text) > max_length:
        text = text[:max_length]

    return text.strip()

def validate_pagination_params(page: int, per_page: int, max_per_page: int = 100) -> tuple:
    """Validate and normalize pagination parameters"""
    page = max(1, int(page) if page else 1)
    per_page = max(1, min(int(per_page) if per_page else 20, max_per_page))

    return page, per_page
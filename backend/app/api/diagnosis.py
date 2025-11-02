"""
Diagnosis API endpoints for the expert system
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import time

from app.models.symptom import Symptom
from app.models.disease import Disease
from app.models.diagnosis import DiagnosisHistory
from app.services.diagnosis_service import get_diagnosis_engine
from app.utils.validators import (
    validate_diagnosis_request,
    validate_certainty_request,
    validate_pagination_params
)
from app.utils.errors import ValidationError, NotFoundError

diagnosis_bp = Blueprint('diagnosis', __name__)
limiter = Limiter(key_func=get_remote_address)

@diagnosis_bp.route('/symptoms', methods=['GET'])
@jwt_required()
def get_symptoms():
    """Get all available symptoms for diagnosis"""
    try:
        symptoms = Symptom.get_active_symptoms()
        return jsonify({
            'symptoms': [symptom.to_dict() for symptom in symptoms]
        })

    except Exception as e:
        return jsonify({'error': 'Failed to fetch symptoms'}), 500

@diagnosis_bp.route('/diseases', methods=['GET'])
@jwt_required()
def get_diseases():
    """Get all available diseases"""
    try:
        include_treatments = request.args.get('include_treatments', 'false').lower() == 'true'
        diseases = Disease.get_active_diseases()
        return jsonify({
            'diseases': [disease.to_dict(include_treatments=include_treatments) for disease in diseases]
        })

    except Exception as e:
        return jsonify({'error': 'Failed to fetch diseases'}), 500

@diagnosis_bp.route('/diagnose', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def diagnose():
    """Perform initial diagnosis based on selected symptoms"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate input
        validate_diagnosis_request(data)
        selected_symptoms = data['symptoms']
        certainty_factors = data.get('certainty_factors')

        # Get diagnosis engine
        engine = get_diagnosis_engine()

        # Perform diagnosis
        result = engine.diagnose(user_id, selected_symptoms, certainty_factors)

        return jsonify(result)

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Diagnosis error: {str(e)}")
        return jsonify({'error': 'Diagnosis failed'}), 500

@diagnosis_bp.route('/calculate-certainty', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def calculate_certainty():
    """Calculate diagnosis with certainty factors"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate input
        validate_certainty_request(data)
        selected_symptoms = data['symptoms']
        certainty_factors = data['certainty_factors']

        # Get diagnosis engine
        engine = get_diagnosis_engine()

        # Perform diagnosis with certainty factors
        result = engine.diagnose(user_id, selected_symptoms, certainty_factors)

        return jsonify(result)

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Certainty calculation error: {str(e)}")
        return jsonify({'error': 'Certainty calculation failed'}), 500

@diagnosis_bp.route('/diagnosis/<diagnosis_id>', methods=['GET'])
@jwt_required()
def get_diagnosis(diagnosis_id):
    """Get specific diagnosis details"""
    try:
        user_id = get_jwt_identity()
        diagnosis = DiagnosisHistory.query.filter_by(
            id=diagnosis_id,
            user_id=user_id
        ).first()

        if not diagnosis:
            raise NotFoundError('Diagnosis not found')

        return jsonify(diagnosis.to_dict(include_ai_response=True))

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to fetch diagnosis'}), 500

@diagnosis_bp.route('/diagnosis/<diagnosis_id>/feedback', methods=['POST'])
@jwt_required()
def submit_diagnosis_feedback(diagnosis_id):
    """Submit feedback for a diagnosis"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        # Validate input
        required_fields = ['accuracy', 'helpfulness']
        for field in required_fields:
            if field not in data:
                raise ValidationError(f'Missing required field: {field}')

            if not isinstance(data[field], int) or not (1 <= data[field] <= 5):
                raise ValidationError(f'{field} must be an integer between 1 and 5')

        # Check if diagnosis exists and belongs to user
        diagnosis = DiagnosisHistory.query.filter_by(
            id=diagnosis_id,
            user_id=user_id
        ).first()

        if not diagnosis:
            raise NotFoundError('Diagnosis not found')

        # Create feedback
        from app.models.diagnosis import DiagnosisFeedback
        feedback = DiagnosisFeedback(
            diagnosis_id=diagnosis_id,
            user_id=user_id,
            accuracy=data['accuracy'],
            helpfulness=data['helpfulness'],
            comments=data.get('comments'),
            actual_disease=data.get('actual_disease')
        )

        from app.models.base import db
        db.session.add(feedback)
        db.session.commit()

        return jsonify({
            'message': 'Feedback submitted successfully',
            'feedback': feedback.to_dict()
        })

    except (ValidationError, NotFoundError) as e:
        return jsonify({'error': str(e)}), e.status_code
    except Exception as e:
        return jsonify({'error': 'Failed to submit feedback'}), 500

@diagnosis_bp.route('/search-symptoms', methods=['GET'])
@jwt_required()
def search_symptoms():
    """Search symptoms by name or category"""
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category')

        if not query and not category:
            raise ValidationError('Search query or category is required')

        # Build query
        symptoms_query = Symptom.query.filter_by(is_active='yes')

        if query:
            symptoms_query = symptoms_query.filter(
                Symptom.name.ilike(f'%{query}%')
            )

        if category:
            symptoms_query = symptoms_query.filter_by(category=category)

        symptoms = symptoms_query.all()

        return jsonify({
            'symptoms': [symptom.to_dict() for symptom in symptoms],
            'count': len(symptoms)
        })

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Search failed'}), 500

@diagnosis_bp.route('/symptom-categories', methods=['GET'])
@jwt_required()
def get_symptom_categories():
    """Get available symptom categories"""
    try:
        from sqlalchemy import distinct
        categories = Symptom.query.with_entities(
            distinct(Symptom.category)
        ).filter_by(is_active='yes').all()

        category_list = [cat[0] for cat in categories if cat[0]]

        return jsonify({
            'categories': sorted(category_list)
        })

    except Exception as e:
        return jsonify({'error': 'Failed to fetch categories'}), 500

@diagnosis_bp.route('/validate-symptoms', methods=['POST'])
@jwt_required()
def validate_symptoms():
    """Validate selected symptoms and get potential matches"""
    try:
        data = request.get_json()
        symptom_ids = data.get('symptoms', [])

        if not symptom_ids:
            raise ValidationError('No symptoms provided')

        # Validate symptoms exist
        valid_symptoms = Symptom.query.filter(
            Symptom.id.in_(symptom_ids),
            Symptom.is_active == 'yes'
        ).all()

        if len(valid_symptoms) != len(symptom_ids):
            valid_ids = [s.id for s in valid_symptoms]
            invalid_ids = set(symptom_ids) - set(valid_ids)
            return jsonify({
                'valid': False,
                'invalid_symptoms': list(invalid_ids),
                'message': 'Invalid symptom IDs found'
            })

        # Check for potential rule matches
        from app.services.diagnosis_service import get_diagnosis_engine
        engine = get_diagnosis_engine()
        forward_result = engine._forward_chaining(symptom_ids)

        return jsonify({
            'valid': True,
            'symptoms': [symptom.to_dict() for symptom in valid_symptoms],
            'potential_matches': forward_result,
            'requires_certainty_factors': not forward_result['exact_match']
        })

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Validation failed'}), 500
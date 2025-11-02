"""
History API endpoints for diagnosis history management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import json

from app.models.diagnosis import DiagnosisHistory, DiagnosisFeedback
from app.models.user import User
from app.utils.validators import validate_pagination_params
from app.utils.errors import ValidationError, NotFoundError

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
@jwt_required()
def get_user_history():
    """Get paginated user diagnosis history"""
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Validate pagination parameters
        page, per_page = validate_pagination_params(page, per_page, max_per_page=50)

        # Get paginated history
        pagination = DiagnosisHistory.get_user_history(user_id, page, per_page)
        diagnoses = pagination.items

        # Format response
        result = {
            'diagnoses': [diagnosis.to_dict() for diagnosis in diagnoses],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next,
                'prev_num': pagination.prev_num,
                'next_num': pagination.next_num
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': 'Failed to fetch history'}), 500

@history_bp.route('/history/<diagnosis_id>', methods=['GET'])
@jwt_required()
def get_diagnosis_details(diagnosis_id):
    """Get detailed diagnosis information including steps and feedback"""
    try:
        user_id = get_jwt_identity()

        # Get diagnosis
        diagnosis = DiagnosisHistory.query.filter_by(
            id=diagnosis_id,
            user_id=user_id
        ).first()

        if not diagnosis:
            raise NotFoundError('Diagnosis not found')

        # Get diagnosis steps
        from app.models.diagnosis import DiagnosisStep
        steps = DiagnosisStep.get_diagnosis_steps(diagnosis_id)

        # Get feedback if exists
        feedback = DiagnosisFeedback.query.filter_by(diagnosis_id=diagnosis_id).first()

        result = diagnosis.to_dict(include_ai_response=True)
        result['steps'] = [step.to_dict() for step in steps]
        if feedback:
            result['feedback'] = feedback.to_dict()

        return jsonify(result)

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to fetch diagnosis details'}), 500

@history_bp.route('/history/<diagnosis_id>', methods=['DELETE'])
@jwt_required()
def delete_diagnosis(diagnosis_id):
    """Delete a specific diagnosis from history"""
    try:
        user_id = get_jwt_identity()

        # Get diagnosis
        diagnosis = DiagnosisHistory.query.filter_by(
            id=diagnosis_id,
            user_id=user_id
        ).first()

        if not diagnosis:
            raise NotFoundError('Diagnosis not found')

        # Delete diagnosis (cascade will delete related steps and feedback)
        from app.models.base import db
        db.session.delete(diagnosis)
        db.session.commit()

        return jsonify({'message': 'Diagnosis deleted successfully'})

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to delete diagnosis'}), 500

@history_bp.route('/history/<diagnosis_id>/export', methods=['GET'])
@jwt_required()
def export_diagnosis_pdf(diagnosis_id):
    """Export diagnosis as PDF-ready data"""
    try:
        user_id = get_jwt_identity()

        # Get diagnosis with full details
        diagnosis = DiagnosisHistory.query.filter_by(
            id=diagnosis_id,
            user_id=user_id
        ).first()

        if not diagnosis:
            raise NotFoundError('Diagnosis not found')

        # Get steps
        from app.models.diagnosis import DiagnosisStep
        steps = DiagnosisStep.get_diagnosis_steps(diagnosis_id)

        # Get user info
        user = User.query.get(user_id)

        # Get AI response if available
        ai_response = None
        if diagnosis.ai_response:
            try:
                ai_response = json.loads(diagnosis.ai_response)
            except json.JSONDecodeError:
                pass

        # Format for PDF export
        export_data = {
            'report_title': 'Rice Disease Diagnosis Report',
            'generated_at': datetime.utcnow().isoformat(),
            'patient_info': {
                'name': user.name if user else 'Unknown',
                'email': user.email if user else 'Unknown',
                'diagnosis_id': diagnosis.id,
                'diagnosis_date': diagnosis.created_at.isoformat() if diagnosis.created_at else 'Unknown'
            },
            'symptoms': {
                'selected': diagnosis.symptoms_selected_list,
                'details': diagnosis.symptom_details_dict if diagnosis.symptom_details else {},
                'certainty_factors': diagnosis.certainty_factors_dict if diagnosis.certainty_factors else {}
            },
            'diagnosis': {
                'disease': diagnosis.disease_name,
                'confidence': float(diagnosis.final_certainty_score) if diagnosis.final_certainty_score else None,
                'method': diagnosis.diagnosis_method,
                'rule_id': diagnosis.rule_id
            },
            'treatment_plan': ai_response.get('treatment_plan') if ai_response else None,
            'ai_info': {
                'model': diagnosis.ai_model,
                'tokens_used': diagnosis.ai_tokens_used
            },
            'steps': [step.to_dict() for step in steps],
            'system_info': {
                'status': diagnosis.status,
                'processing_time_ms': diagnosis.processing_time,
                'expires_at': diagnosis.expires_at.isoformat() if diagnosis.expires_at else None
            }
        }

        return jsonify(export_data)

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to export diagnosis'}), 500

@history_bp.route('/history/search', methods=['GET'])
@jwt_required()
def search_history():
    """Search diagnosis history"""
    try:
        user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        disease = request.args.get('disease')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if not any([query, disease, date_from, date_to]):
            raise ValidationError('At least one search parameter is required')

        # Validate pagination
        page, per_page = validate_pagination_params(page, per_page, max_per_page=50)

        # Build query
        diagnoses_query = DiagnosisHistory.query.filter_by(
            user_id=user_id,
            status='completed'
        )

        # Search by disease name
        if disease:
            diagnoses_query = diagnoses_query.filter(
                DiagnosisHistory.disease_name.ilike(f'%{disease}%')
            )

        # Search by date range
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                diagnoses_query = diagnoses_query.filter(
                    DiagnosisHistory.created_at >= from_date
                )
            except ValueError:
                raise ValidationError('Invalid date_from format')

        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                diagnoses_query = diagnoses_query.filter(
                    DiagnosisHistory.created_at <= to_date
                )
            except ValueError:
                raise ValidationError('Invalid date_to format')

        # Text search in symptoms and disease
        if query:
            diagnoses_query = diagnoses_query.filter(
                (DiagnosisHistory.disease_name.ilike(f'%{query}%')) |
                (DiagnosisHistory.symptoms_selected.ilike(f'%{query}%'))
            )

        # Order by date (most recent first)
        diagnoses_query = diagnoses_query.order_by(DiagnosisHistory.created_at.desc())

        # Paginate
        pagination = diagnoses_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        result = {
            'diagnoses': [diagnosis.to_dict() for diagnosis in pagination.items],
            'search_params': {
                'query': query,
                'disease': disease,
                'date_from': date_from,
                'date_to': date_to
            },
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next
            }
        }

        return jsonify(result)

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Search failed'}), 500

@history_bp.route('/history/stats', methods=['GET'])
@jwt_required()
def get_history_stats():
    """Get user diagnosis statistics"""
    try:
        user_id = get_jwt_identity()

        # Get all user diagnoses
        diagnoses = DiagnosisHistory.query.filter_by(
            user_id=user_id,
            status='completed'
        ).all()

        # Calculate statistics
        total_diagnoses = len(diagnoses)
        recent_diagnoses = len([d for d in diagnoses
                              if d.created_at and d.created_at > datetime.utcnow() - timedelta(days=30)])

        # Disease frequency
        disease_counts = {}
        for diagnosis in diagnoses:
            if diagnosis.disease_name:
                disease_counts[diagnosis.disease_name] = disease_counts.get(diagnosis.disease_name, 0) + 1

        # Method usage
        method_counts = {}
        for diagnosis in diagnoses:
            method_counts[diagnosis.diagnosis_method] = method_counts.get(diagnosis.diagnosis_method, 0) + 1

        # Average confidence
        confidences = [float(d.final_certainty_score) for d in diagnoses
                      if d.final_certainty_score is not None]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Feedback stats
        feedbacks = DiagnosisFeedback.query.filter_by(user_id=user_id).all()
        avg_accuracy = sum(f.accuracy for f in feedbacks) / len(feedbacks) if feedbacks else 0
        avg_helpfulness = sum(f.helpfulness for f in feedbacks) / len(feedbacks) if feedbacks else 0

        result = {
            'total_diagnoses': total_diagnoses,
            'recent_diagnoses_30_days': recent_diagnoses,
            'disease_frequency': disease_counts,
            'method_usage': method_counts,
            'average_confidence': round(avg_confidence, 2),
            'feedback_stats': {
                'total_feedback': len(feedbacks),
                'average_accuracy': round(avg_accuracy, 2),
                'average_helpfulness': round(avg_helpfulness, 2)
            },
            'account_created': User.query.get(user_id).created_at.isoformat() if User.query.get(user_id) else None
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@history_bp.route('/history/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_history():
    """Delete multiple diagnoses from history"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        diagnosis_ids = data.get('diagnosis_ids', [])

        if not diagnosis_ids:
            raise ValidationError('No diagnosis IDs provided')

        if len(diagnosis_ids) > 100:  # Limit bulk operations
            raise ValidationError('Cannot delete more than 100 diagnoses at once')

        # Verify all diagnoses belong to user
        diagnoses = DiagnosisHistory.query.filter(
            DiagnosisHistory.id.in_(diagnosis_ids),
            DiagnosisHistory.user_id == user_id
        ).all()

        if len(diagnoses) != len(diagnosis_ids):
            valid_ids = [d.id for d in diagnoses]
            invalid_ids = set(diagnosis_ids) - set(valid_ids)
            return jsonify({
                'error': 'Some diagnoses not found',
                'invalid_ids': list(invalid_ids)
            }), 400

        # Delete diagnoses
        from app.models.base import db
        for diagnosis in diagnoses:
            db.session.delete(diagnosis)

        db.session.commit()

        return jsonify({
            'message': f'Successfully deleted {len(diagnoses)} diagnoses',
            'deleted_count': len(diagnoses)
        })

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Bulk delete failed'}), 500
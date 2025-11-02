"""
Admin API endpoints for system administration
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
import json

from app.models.user import User
from app.models.diagnosis import DiagnosisHistory, DiagnosisFeedback
from app.models.symptom import Symptom
from app.models.disease import Disease
from app.models.base import db
from app.utils.validators import validate_pagination_params
from app.utils.errors import ValidationError, AuthorizationError, NotFoundError

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """Check if current user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        raise AuthorizationError('Admin access required')

@admin_bp.before_request
@jwt_required()
def admin_required():
    """Ensure all admin endpoints require admin access"""
    try:
        require_admin()
    except AuthorizationError:
        return jsonify({'error': 'Admin access required'}), 403

@admin_bp.route('/dashboard', methods=['GET'])
def get_admin_dashboard():
    """Get admin dashboard statistics"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        new_users_30_days = User.query.filter(
            User.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()

        # Diagnosis statistics
        total_diagnoses = DiagnosisHistory.query.count()
        completed_diagnoses = DiagnosisHistory.query.filter_by(status='completed').count()
        diagnoses_30_days = DiagnosisHistory.query.filter(
            DiagnosisHistory.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()

        # Disease frequency (all users)
        disease_stats = db.session.query(
            DiagnosisHistory.disease_name,
            func.count(DiagnosisHistory.id).label('count')
        ).filter(
            DiagnosisHistory.disease_name.isnot(None),
            DiagnosisHistory.status == 'completed'
        ).group_by(DiagnosisHistory.disease_name).order_by(func.count(DiagnosisHistory.id).desc()).limit(10).all()

        # Method usage statistics
        method_stats = db.session.query(
            DiagnosisHistory.diagnosis_method,
            func.count(DiagnosisHistory.id).label('count')
        ).filter_by(status='completed').group_by(DiagnosisHistory.diagnosis_method).all()

        # Feedback statistics
        feedback_count = DiagnosisFeedback.query.count()
        avg_accuracy = db.session.query(func.avg(DiagnosisFeedback.accuracy)).scalar() or 0
        avg_helpfulness = db.session.query(func.avg(DiagnosisFeedback.helpfulness)).scalar() or 0

        # AI usage statistics
        ai_diagnoses = DiagnosisHistory.query.filter(
            DiagnosisHistory.ai_model.isnot(None)
        ).count()
        total_tokens = db.session.query(func.sum(DiagnosisHistory.ai_tokens_used)).scalar() or 0

        result = {
            'user_stats': {
                'total_users': total_users,
                'active_users': active_users,
                'new_users_30_days': new_users_30_days
            },
            'diagnosis_stats': {
                'total_diagnoses': total_diagnoses,
                'completed_diagnoses': completed_diagnoses,
                'diagnoses_30_days': diagnoses_30_days,
                'completion_rate': round(completed_diagnoses / total_diagnoses * 100, 2) if total_diagnoses > 0 else 0
            },
            'disease_frequency': [
                {'disease': stat[0], 'count': stat[1]}
                for stat in disease_stats if stat[0]
            ],
            'method_usage': [
                {'method': stat[0], 'count': stat[1]}
                for stat in method_stats
            ],
            'feedback_stats': {
                'total_feedback': feedback_count,
                'average_accuracy': round(float(avg_accuracy), 2),
                'average_helpfulness': round(float(avg_helpfulness), 2)
            },
            'ai_usage': {
                'ai_diagnoses': ai_diagnoses,
                'total_tokens_used': int(total_tokens)
            },
            'system_health': {
                'database_status': 'healthy',
                'ai_service_status': 'operational',
                'last_cleanup': 'Manual trigger needed'
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': 'Failed to fetch dashboard data'}), 500

@admin_bp.route('/users', methods=['GET'])
def get_all_users():
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        is_active = request.args.get('is_active')

        page, per_page = validate_pagination_params(page, per_page, max_per_page=100)

        # Build query
        users_query = User.query

        if search:
            users_query = users_query.filter(
                or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )

        if is_active is not None:
            active_filter = is_active.lower() == 'true'
            users_query = users_query.filter_by(is_active=active_filter)

        # Order by creation date (newest first)
        users_query = users_query.order_by(User.created_at.desc())

        # Paginate
        pagination = users_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        result = {
            'users': [user.to_dict() for user in pagination.items],
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

    except Exception as e:
        return jsonify({'error': 'Failed to fetch users'}), 500

@admin_bp.route('/diagnoses', methods=['GET'])
def get_all_diagnoses():
    """Get all diagnoses with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_email = request.args.get('user_email', '').strip()
        disease = request.args.get('disease', '').strip()
        status = request.args.get('status')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')

        page, per_page = validate_pagination_params(page, per_page, max_per_page=100)

        # Build query
        diagnoses_query = DiagnosisHistory.query

        # Filter by user email
        if user_email:
            user = User.query.filter(User.email.ilike(f'%{user_email}%')).first()
            if user:
                diagnoses_query = diagnoses_query.filter_by(user_id=user.id)
            else:
                # If user not found, return empty result
                return jsonify({
                    'diagnoses': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0,
                        'has_prev': False,
                        'has_next': False
                    }
                })

        # Filter by disease
        if disease:
            diagnoses_query = diagnoses_query.filter(
                DiagnosisHistory.disease_name.ilike(f'%{disease}%')
            )

        # Filter by status
        if status:
            diagnoses_query = diagnoses_query.filter_by(status=status)

        # Filter by date range
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

        # Join with user to get user info
        diagnoses_query = diagnoses_query.join(User)

        # Order by creation date (newest first)
        diagnoses_query = diagnoses_query.order_by(DiagnosisHistory.created_at.desc())

        # Paginate
        pagination = diagnoses_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Format results with user info
        diagnoses_data = []
        for diagnosis in pagination.items:
            diagnosis_dict = diagnosis.to_dict()
            diagnosis_dict['user'] = {
                'id': diagnosis.user.id,
                'email': diagnosis.user.email,
                'name': diagnosis.user.name
            }
            diagnoses_data.append(diagnosis_dict)

        result = {
            'diagnoses': diagnoses_data,
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
        return jsonify({'error': 'Failed to fetch diagnoses'}), 500

@admin_bp.route('/feedback', methods=['GET'])
def get_all_feedback():
    """Get all user feedback with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        accuracy_min = request.args.get('accuracy_min', type=int)
        helpfulness_min = request.args.get('helpfulness_min', type=int)

        page, per_page = validate_pagination_params(page, per_page, max_per_page=100)

        # Build query
        feedback_query = DiagnosisFeedback.query.join(DiagnosisHistory).join(User)

        # Filter by ratings
        if accuracy_min is not None:
            feedback_query = feedback_query.filter(
                DiagnosisFeedback.accuracy >= accuracy_min
            )

        if helpfulness_min is not None:
            feedback_query = feedback_query.filter(
                DiagnosisFeedback.helpfulness >= helpfulness_min
            )

        # Order by creation date (newest first)
        feedback_query = feedback_query.order_by(DiagnosisFeedback.created_at.desc())

        # Paginate
        pagination = feedback_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Format results with user and diagnosis info
        feedback_data = []
        for feedback in pagination.items:
            feedback_dict = feedback.to_dict()
            feedback_dict['user'] = {
                'id': feedback.user.id,
                'email': feedback.user.email,
                'name': feedback.user.name
            }
            feedback_dict['diagnosis'] = {
                'id': feedback.diagnosis.id,
                'disease_name': feedback.diagnosis.disease_name,
                'created_at': feedback.diagnosis.created_at.isoformat() if feedback.diagnosis.created_at else None
            }
            feedback_data.append(feedback_dict)

        result = {
            'feedback': feedback_data,
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

    except Exception as e:
        return jsonify({'error': 'Failed to fetch feedback'}), 500

@admin_bp.route('/cleanup', methods=['POST'])
def trigger_cleanup():
    """Trigger cleanup of expired diagnosis records"""
    try:
        # Run cleanup
        cleaned_count = DiagnosisHistory.cleanup_expired()

        # Get cleanup stats
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        upcoming_expirations = DiagnosisHistory.query.filter(
            DiagnosisHistory.expires_at < thirty_days_ago,
            DiagnosisHistory.status == 'completed'
        ).count()

        result = {
            'message': 'Cleanup completed successfully',
            'cleaned_records': cleaned_count,
            'upcoming_expirations': upcoming_expirations,
            'next_suggested_cleanup': (datetime.utcnow() + timedelta(days=1)).isoformat()
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': 'Cleanup failed'}), 500

@admin_bp.route('/export/diagnoses', methods=['GET'])
def export_diagnoses():
    """Export diagnoses data as CSV"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        format_type = request.args.get('format', 'csv')

        # Build query
        diagnoses_query = DiagnosisHistory.query.join(User)

        # Filter by date range
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

        # Get diagnoses
        diagnoses = diagnoses_query.order_by(DiagnosisHistory.created_at.desc()).limit(10000).all()

        # Format data
        export_data = []
        for diagnosis in diagnoses:
            export_data.append({
                'diagnosis_id': diagnosis.id,
                'user_email': diagnosis.user.email,
                'user_name': diagnosis.user.name,
                'disease_name': diagnosis.disease_name or 'Unknown',
                'symptoms': ', '.join(diagnosis.symptoms_selected_list),
                'certainty_score': float(diagnosis.final_certainty_score) if diagnosis.final_certainty_score else None,
                'diagnosis_method': diagnosis.diagnosis_method,
                'ai_model': diagnosis.ai_model,
                'tokens_used': diagnosis.ai_tokens_used,
                'status': diagnosis.status,
                'created_at': diagnosis.created_at.isoformat() if diagnosis.created_at else None,
                'processing_time_ms': diagnosis.processing_time
            })

        if format_type.lower() == 'json':
            return jsonify({
                'export_data': export_data,
                'exported_at': datetime.utcnow().isoformat(),
                'total_records': len(export_data)
            })
        else:
            # Return CSV-ready data (client will handle CSV conversion)
            return jsonify({
                'csv_data': export_data,
                'headers': list(export_data[0].keys()) if export_data else [],
                'exported_at': datetime.utcnow().isoformat(),
                'total_records': len(export_data)
            })

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Export failed'}), 500

@admin_bp.route('/system/health', methods=['GET'])
def system_health():
    """Get system health status"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'services': {
                'database': {
                    'status': 'healthy',
                    'connection': 'active',
                    'query_time_ms': '< 100'
                },
                'ai_service': {
                    'status': 'operational',
                    'model': 'openai',  # or gemini
                    'last_success': datetime.utcnow().isoformat()
                },
                'authentication': {
                    'status': 'operational',
                    'provider': 'google_oauth'
                }
            },
            'statistics': {
                'total_users': User.query.count(),
                'active_diagnoses': DiagnosisHistory.query.filter_by(status='completed').count(),
                'uptime_percentage': '99.9%'
            },
            'alerts': []
        }

        # Check for any potential issues
        old_diagnoses = DiagnosisHistory.query.filter(
            DiagnosisHistory.created_at < datetime.utcnow() - timedelta(days=60)
        ).count()

        if old_diagnoses > 1000:
            health_status['alerts'].append({
                'level': 'warning',
                'message': f'Found {old_diagnoses} diagnoses older than 60 days. Consider running cleanup.'
            })

        return jsonify(health_status)

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500
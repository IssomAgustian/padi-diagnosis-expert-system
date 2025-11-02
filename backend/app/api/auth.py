"""
Authentication API endpoints for Google OAuth
"""

from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import google.auth
import os
import json
from datetime import datetime, timedelta
from app.models.user import User
from app.models.base import db
from app.utils.errors import ValidationError, AuthenticationError

auth_bp = Blueprint('auth', __name__)

# Google OAuth configuration
GOOGLE_CLIENT_SECRETS_FILE = os.getenv('GOOGLE_CLIENT_SECRETS_FILE')
REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/google/callback')
SCOPES = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

@auth_bp.route('/google/url', methods=['GET'])
def get_google_auth_url():
    """Get Google OAuth authorization URL"""
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                    "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=SCOPES
        )
        flow.redirect_uri = REDIRECT_URI

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )

        # Store state in session for security
        session['oauth_state'] = state

        return jsonify({
            'authorization_url': authorization_url,
            'state': state
        })

    except Exception as e:
        return jsonify({'error': f'Failed to generate auth URL: {str(e)}'}), 500


@auth_bp.route('/google/callback', methods=['POST'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')

        # Verify state for security
        if state != session.get('oauth_state'):
            raise AuthenticationError('Invalid OAuth state')

        # Exchange authorization code for tokens
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                    "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=SCOPES
        )
        flow.redirect_uri = REDIRECT_URI

        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Get user info from Google
        from googleapiclient.discovery import build
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()

        # Extract user information
        google_id = user_info['id']
        email = user_info['email']
        name = user_info.get('name', '')
        avatar_url = user_info.get('picture', '')

        # Find or create user
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            # Check if user exists with this email
            user = User.query.filter_by(email=email).first()
            if user:
                user.google_id = google_id
            else:
                user = User(
                    google_id=google_id,
                    email=email,
                    name=name,
                    avatar_url=avatar_url
                )
                db.session.add(user)

        # Update user information
        user.name = name
        user.avatar_url = avatar_url
        user.update_last_login()

        # Create access token
        access_token = create_access_token(identity=user.id)

        # Clear OAuth state
        session.pop('oauth_state', None)

        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        })

    except Exception as e:
        print(f"Google auth error: {str(e)}")
        return jsonify({'error': 'Authentication failed'}), 401


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify JWT token and get current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404

        return jsonify({
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'error': 'Token verification failed'}), 401


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    try:
        # In a stateless JWT setup, logout is primarily client-side
        # We could implement a token blacklist if needed
        return jsonify({'message': 'Logged out successfully'})

    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict())

    except Exception as e:
        return jsonify({'error': 'Failed to get user profile'}), 500


@auth_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Update allowed fields
        if 'name' in data:
            user.name = data['name']

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500


# Error handlers for authentication
@auth_bp.errorhandler(AuthenticationError)
def handle_auth_error(error):
    return jsonify({'error': str(error)}), 401


@auth_bp.errorhandler(ValidationError)
def handle_validation_error(error):
    return jsonify({'error': str(error)}), 400
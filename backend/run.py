"""
Main application runner for Flask backend
"""

import os
from app import create_app
from app.models.base import init_database

# Create Flask app
app = create_app()

# Initialize database
init_database(app)

if __name__ == '__main__':
    # Development server
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
# Flask Backend API for Rice Disease Diagnosis Expert System

A comprehensive Flask backend API that combines forward chaining rule-based diagnosis with certainty factor calculations, integrated with AI-powered treatment recommendations.

## 🚀 Features

- **Hybrid Diagnosis Engine**: Forward chaining + Certainty Factor methods
- **AI Integration**: OpenAI/Gemini for treatment recommendations
- **Google OAuth Authentication**: Secure user authentication
- **RESTful API**: Well-documented endpoints
- **Rate Limiting**: Built-in protection against abuse
- **Database Integration**: PostgreSQL with SQLAlchemy ORM
- **Admin Dashboard**: Complete system administration
- **PDF Export**: Diagnosis report generation
- **Feedback System**: User feedback collection and analysis

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   ├── base.py         # Database configuration
│   │   ├── user.py         # User model
│   │   ├── symptom.py      # Symptom model
│   │   ├── disease.py      # Disease model
│   │   ├── treatment.py    # Treatment & Medication models
│   │   ├── rule.py         # Forward chaining rules
│   │   └── diagnosis.py    # Diagnosis history & tracking
│   ├── api/                # API blueprints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── diagnosis.py    # Diagnosis endpoints
│   │   ├── history.py      # History management
│   │   └── admin.py        # Admin endpoints
│   ├── services/           # Business logic
│   │   ├── ai_service.py   # AI integration (OpenAI/Gemini)
│   │   └── diagnosis_service.py  # Diagnosis engine
│   └── utils/              # Utilities
│       ├── errors.py       # Custom error classes
│       └── validators.py   # Input validation
├── tests/                  # Test files
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── run.py                 # Application runner
└── README.md              # This file
```

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- PostgreSQL database
- Redis (for rate limiting, optional)

### Setup Steps

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb padi_diagnosis

   # The app will create tables automatically on first run
   ```

6. **Run the application**
   ```bash
   python run.py
   ```

## ⚙️ Configuration

### Environment Variables

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=jwt-super-secret-key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/padi_diagnosis

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# AI Services (choose one or both)
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=openai  # 'openai' or 'gemini'

# Frontend
FRONTEND_URL=http://localhost:3000

# Rate Limiting
REDIS_URL=redis://localhost:6379/0
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### AI Services Setup

#### OpenAI
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate API key
3. Add to `.env` as `OPENAI_API_KEY`

#### Google Gemini
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env` as `GEMINI_API_KEY`

## 📚 API Documentation

### Authentication Endpoints

#### Get Google Auth URL
```http
GET /api/auth/google/url
```

#### Google OAuth Callback
```http
POST /api/auth/google/callback
Content-Type: application/json

{
  "code": "authorization_code",
  "state": "state_parameter"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <jwt_token>
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Diagnosis Endpoints

#### Get Symptoms
```http
GET /api/symptoms
Authorization: Bearer <jwt_token>
```

#### Get Diseases
```http
GET /api/diseases?include_treatments=true
Authorization: Bearer <jwt_token>
```

#### Perform Diagnosis
```http
POST /api/diagnose
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "symptoms": ["G01", "G02", "G07"]
}
```

#### Calculate with Certainty Factors
```http
POST /api/calculate-certainty
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "symptoms": ["G01", "G02", "G07"],
  "certainty_factors": {
    "G01": 80,
    "G02": 90,
    "G07": 70
  }
}
```

### History Endpoints

#### Get User History
```http
GET /api/history?page=1&per_page=20
Authorization: Bearer <jwt_token>
```

#### Get Diagnosis Details
```http
GET /api/history/<diagnosis_id>
Authorization: Bearer <jwt_token>
```

#### Export Diagnosis
```http
GET /api/history/<diagnosis_id>/export
Authorization: Bearer <jwt_token>
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/dashboard
Authorization: Bearer <admin_jwt_token>
```

#### Get All Users
```http
GET /api/admin/users?page=1&per_page=20&search=keyword
Authorization: Bearer <admin_jwt_token>
```

#### Get All Diagnoses
```http
GET /api/admin/diagnoses?page=1&per_page=20
Authorization: Bearer <admin_jwt_token>
```

## 🔧 Diagnosis Flow

### 1. Forward Chaining (Exact Match)
```
User selects symptoms → Check against rules → If exact match found → Return diagnosis
```

### 2. Certainty Factor (Partial Match)
```
No exact match → Request certainty factors → Calculate CF scores → Return diagnosis if confident
```

### 3. AI Integration
```
Diagnosis confirmed → Generate AI treatment plan → Include recommendations & medications
```

## 📊 Database Schema

### Core Tables
- **users**: Google OAuth users
- **symptoms**: Plant symptoms with CF values
- **diseases**: Rice plant diseases
- **rules**: Forward chaining rules
- **treatments**: Treatment recommendations
- **medications**: Specific medications
- **diagnosis_history**: User diagnosis records
- **diagnosis_steps**: Diagnosis process tracking
- **diagnosis_feedback**: User feedback

### Data Relationships
- Users → DiagnosisHistory (1:N)
- Diseases → Rules (1:N)
- Diseases → Treatments (1:N)
- Treatments → Medications (1:N)
- Rules → RuleSymptoms (1:N)

## 🚀 Production Deployment

### Using Gunicorn
```bash
# Install production server
pip install gunicorn gevent

# Run with Gunicorn
gunicorn --worker-class gevent --worker-connections 1000 --bind 0.0.0.0:5000 run:app
```

### Docker Deployment
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--worker-class", "gevent", "--bind", "0.0.0.0:5000", "run:app"]
```

### Environment Configuration
```bash
# Production environment variables
export FLASK_ENV=production
export SECRET_KEY=your-production-secret-key
export DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-flask pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/
```

### Test Structure
```
tests/
├── test_auth.py       # Authentication tests
├── test_diagnosis.py  # Diagnosis logic tests
├── test_history.py    # History management tests
└── test_admin.py      # Admin functionality tests
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Google OAuth**: Trusted authentication provider
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin request security
- **SQL Injection Prevention**: ORM-based database access
- **HTTPS Ready**: SSL/TLS support

## 📈 Performance Optimization

- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for rate limiting and session storage
- **Pagination**: Large dataset handling
- **Async Processing**: Background AI processing
- **Compression**: Response compression

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Google OAuth Failures**
   - Verify redirect URI configuration
   - Check client credentials
   - Ensure OAuth state matches

3. **AI Service Errors**
   - Check API key validity
   - Verify rate limits
   - Monitor token usage

4. **Import Errors**
   - Ensure all dependencies installed
   - Check Python version compatibility
   - Verify virtual environment activation

### Debug Mode
```bash
# Enable debug mode
export FLASK_ENV=development
export FLASK_DEBUG=1

# Run with debug output
python run.py
```

## 📝 Logging

### Configure Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)
```

### Log Categories
- **API Requests**: HTTP request logging
- **Diagnosis Process**: Step-by-step diagnosis tracking
- **AI Service**: AI API interaction logging
- **Errors**: Comprehensive error logging
- **Performance**: Request timing and performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Style
```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting guide
- Contact the development team
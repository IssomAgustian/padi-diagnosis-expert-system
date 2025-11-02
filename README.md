# 🌾 Padi Diagnosis Expert System

A comprehensive AI-powered expert system for diagnosing rice plant diseases using hybrid forward chaining and certainty factor methods.

## 🎯 Overview

This web application combines traditional expert system techniques with modern AI to provide accurate rice disease diagnosis and treatment recommendations. It's designed as a thesis project implementing both **Forward Chaining** rule-based analysis and **Certainty Factor** calculations with AI-generated treatment plans.

## ✨ Key Features

- 🧠 **Hybrid Diagnosis Engine**: Combines forward chaining rules with certainty factor calculations
- 🤖 **AI-Powered Treatment Plans**: Integrates OpenAI/Gemini for personalized treatment recommendations
- 🔐 **Google OAuth Authentication**: Secure user authentication with Google accounts
- 📊 **Comprehensive Dashboard**: User statistics, diagnosis history, and insights
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 📄 **PDF Export**: Generate professional diagnosis reports
- 🗂️ **History Management**: Track and manage diagnosis history with search and filtering
- ⏰ **Auto-Cleanup**: 30-day data retention policy for user privacy
- 🛡️ **Admin Panel**: Complete system administration and analytics

## 🏗️ System Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router and Turbopack
- **UI Components**: shadcn/ui with Tailwind CSS
- **Authentication**: Custom Google OAuth integration
- **State Management**: React hooks and context
- **TypeScript**: Full type safety throughout

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: PostgreSQL with comprehensive schema
- **Authentication**: JWT-based with Google OAuth
- **AI Integration**: OpenAI GPT-4 and Google Gemini APIs
- **Rate Limiting**: Redis-based protection
- **API Design**: RESTful with comprehensive error handling

### Database (PostgreSQL)
- **Core Tables**: Users, Symptoms, Diseases, Rules, Treatments, Diagnosis History
- **Relationships**: Foreign key constraints with cascading deletes
- **Indexes**: Optimized for query performance
- **Data Retention**: Automatic cleanup of expired records

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+** and pip
- **Docker** and Docker Compose
- **Google OAuth credentials**
- **AI service API key** (OpenAI or Gemini)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd padi-diagnosis-expert-system
```

### 2. Automated Setup

```bash
# Run the setup script
./scripts/setup.sh
```

### 3. Configure Environment

Edit `.env` with your actual values:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Service (choose one)
OPENAI_API_KEY=your-openai-api-key
# OR
GEMINI_API_KEY=your-gemini-api-key

# Database (Docker handles this automatically)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/padi_diagnosis
```

### 4. Start Development

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up
```

**Option B: Manual Development**
```bash
# Terminal 1: Start database
docker-compose up postgres redis

# Terminal 2: Start backend
cd backend
python run.py

# Terminal 3: Start frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379

## 📋 System Workflow

### 1. Authentication
- Users sign in with Google OAuth
- JWT tokens are generated for session management
- User data is stored securely in the database

### 2. Diagnosis Process

#### Step 1: Symptom Selection
- Users select observed symptoms from a comprehensive list
- Symptoms are categorized (Daun, Batang, Bunga, etc.)
- Each symptom has associated Certainty Factor values (MB/MD)

#### Step 2: Rule Matching
- **Forward Chaining**: System checks for exact rule matches
- If exact match found → Immediate diagnosis
- If no match → Proceed to certainty factors

#### Step 3: Certainty Factors
- Users input confidence levels (0-100%) for selected symptoms
- Certainty factors are calculated using CF = MB - MD
- Combined CF calculated using combination formula

#### Step 4: AI Analysis
- Diagnosis results are sent to AI (OpenAI/Gemini)
- AI generates comprehensive treatment plans
- Includes medications, application methods, and preventive measures

### 3. Results and History
- Results displayed with confidence scores
- AI-generated treatment recommendations
- Option to save to history and export PDF
- 30-day automatic data retention

## 🗄️ Database Schema

### Core Tables

#### `users`
- Google OAuth integration
- Profile management
- Admin role support

#### `symptoms`
- Rice plant symptoms with CF values
- MB (Measure of Belief) and MD (Measure of Disbelief)
- Categories and severity levels

#### `diseases`
- Rice plant diseases information
- Scientific names and descriptions
- Causal agents and economic impact

#### `rules`
- Forward chaining rules
- Symptom conditions and thresholds
- Rule types and confidence levels

#### `treatments` & `medications`
- Treatment recommendations
- Specific medications with dosage information
- Safety precautions and application methods

#### `diagnosis_history`
- User diagnosis records
- Symptom selections and CF calculations
- AI responses and processing metrics
- 30-day expiration with automatic cleanup

## 🔧 Development

### Project Structure

```
padi-diagnosis-expert-system/
├── app/                          # Next.js app directory
│   ├── dashboard/               # Protected dashboard pages
│   │   ├── diagnosis/           # Diagnosis workflow
│   │   └── history/             # History management
│   └── sign-in/                 # Authentication
├── components/                  # React components
│   ├── diagnosis/              # Diagnosis-specific components
│   ├── history/                # History management components
│   └── ui/                     # shadcn/ui components
├── lib/                         # Utility libraries
│   ├── auth-backend.ts         # Backend authentication client
│   └── diagnosis-client.ts     # Diagnosis API client
├── backend/                     # Flask backend
│   ├── app/                    # Flask application
│   │   ├── models/             # Database models
│   │   ├── api/                # API endpoints
│   │   └── services/           # Business logic
│   └── requirements.txt        # Python dependencies
├── db/                         # Database schema and seeding
│   ├── schema/                 # Database table definitions
│   └── seed/                   # Sample data
├── docker/                      # Docker configuration
├── scripts/                     # Setup and utility scripts
└── docs/                        # Documentation
```

### Running Tests

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
pytest

# Integration tests
npm run test:e2e
```

### Code Quality

```bash
# Frontend linting and formatting
npm run lint
npm run format

# Backend linting
cd backend
flake8 app/
black app/
```

## 🐳 Docker Deployment

### Development Environment
```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Environment Variables for Production
- Use strong, randomly generated secrets
- Enable HTTPS and configure SSL certificates
- Set up proper CORS origins
- Configure rate limiting for production
- Set up monitoring and logging

## 🔐 Security Features

- **Authentication**: Google OAuth with JWT tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation on all inputs
- **Rate Limiting**: Redis-based rate limiting
- **CORS Protection**: Configured CORS origins
- **SQL Injection Prevention**: ORM-based database access
- **Data Privacy**: 30-day retention policy with automatic cleanup
- **HTTPS Ready**: SSL/TLS support in production

## 📊 Monitoring and Analytics

### System Health
- Database connection monitoring
- AI service availability checks
- API response time tracking
- Error rate monitoring

### User Analytics
- Diagnosis frequency tracking
- Disease distribution analysis
- User engagement metrics
- Treatment effectiveness feedback

### Performance Metrics
- API response times
- Database query performance
- AI processing latency
- Memory and CPU usage

## 🧪 Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- API endpoint testing
- Database model testing
- Business logic testing

### Integration Tests
- End-to-end user workflows
- Authentication flows
- Diagnosis process testing
- AI service integration

### Performance Tests
- Load testing for API endpoints
- Database performance testing
- Frontend rendering performance
- AI service response times

## 📚 API Documentation

### Authentication Endpoints
- `GET /api/auth/google/url` - Get Google OAuth URL
- `POST /api/auth/google/callback` - OAuth callback
- `GET /api/auth/verify` - Verify JWT token

### Diagnosis Endpoints
- `GET /api/symptoms` - Get available symptoms
- `POST /api/diagnose` - Perform diagnosis
- `POST /api/calculate-certainty` - Calculate with certainty factors

### History Endpoints
- `GET /api/history` - Get user history
- `GET /api/history/:id` - Get diagnosis details
- `POST /api/history/:id/export` - Export PDF

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - User management
- `GET /api/admin/diagnoses` - All diagnoses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow the existing code style
- Add comprehensive tests
- Update documentation
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. **Documentation**: Check the `/docs` directory
2. **Issues**: Create an issue on GitHub
3. **Discussions**: Use GitHub Discussions for questions
4. **Email**: Contact the development team

## 🎓 Academic Use

This system was developed as a thesis project demonstrating:

- **Expert System Implementation**: Forward chaining and certainty factors
- **AI Integration**: Modern AI service integration
- **Full-Stack Development**: Complete web application development
- **Database Design**: Comprehensive relational database schema
- **User Experience**: Modern, responsive web interface

## 🔮 Future Enhancements

- **Mobile App**: React Native mobile application
- **Image Recognition**: Computer vision for symptom identification
- **Multi-Language Support**: Internationalization
- **Advanced Analytics**: Machine learning for pattern recognition
- **Real-time Collaboration**: Expert consultation features
- **IoT Integration**: Sensor data integration for monitoring

---

**Built with ❤️ for rice farmers and agricultural researchers**
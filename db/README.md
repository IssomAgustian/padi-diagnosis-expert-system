# Database Schema for Rice Disease Diagnosis Expert System

This directory contains the complete database schema and utilities for the rice disease diagnosis expert system.

## 📁 Directory Structure

```
db/
├── schema/                 # Database schema files
│   ├── index.ts           # Main schema export
│   ├── auth.ts            # Authentication tables (users, sessions, accounts)
│   ├── symptoms.ts        # Symptoms table with CF values
│   ├── diseases.ts        # Diseases table
│   ├── treatments.ts      # Treatments and medications tables
│   ├── rules.ts           # Forward chaining rules and rule-symptom relationships
│   └── diagnosis.ts       # Diagnosis history and related tables
├── seed/                  # Database seeding scripts
│   └── index.ts           # Main seeding script with sample data
├── utils/                 # Database utilities
│   └── cleanup.ts         # Cleanup utilities for data retention
├── index.ts               # Database connection setup
└── README.md              # This file
```

## 🗄️ Schema Overview

### Core Tables

1. **symptoms** - Stores rice plant symptoms with Certainty Factor (CF) values
   - `id`: Symptom code (e.g., "G01", "G02")
   - `mbValue`: Measure of Belief value (0-1)
   - `mdValue`: Measure of Disbelief value (0-1)
   - `category`: Symptom category (Daun, Batang, Bunga, etc.)

2. **diseases** - Stores rice plant diseases
   - `id`: Disease code (e.g., "P01", "P02")
   - `name`: Disease name (e.g., "Hawar Daun Bakteri")
   - `scientificName`: Scientific name
   - `causalAgent`: What causes the disease

3. **rules** - Forward chaining rules for diagnosis
   - `symptomConditions`: JSON array of required symptoms
   - `certaintyThreshold`: Minimum CF threshold
   - `ruleType`: "exact", "partial", or "weighted"

4. **treatments** - Treatment recommendations
   - `treatmentType`: "chemical", "biological", "cultural", "integrated"
   - `steps`: JSON array of treatment steps
   - `priority`: Treatment priority level

5. **medications** - Specific medication recommendations
   - `activeIngredient`: Active chemical compound
   - `dosage`: Application dosage
   - `preHarvestInterval`: Safety interval before harvest

6. **diagnosisHistory** - Main diagnosis tracking table
   - `symptomsSelected`: JSON array of selected symptom IDs
   - `certaintyFactors`: JSON object with CF calculations
   - `expiresAt`: 30-day retention policy
   - `aiResponse`: AI-generated treatment recommendations

### Supporting Tables

- **ruleSymptoms** - Links rules to symptoms with weights
- **diagnosisSteps** - Tracks intermediate diagnosis steps
- **diagnosisFeedback** - User feedback on diagnosis accuracy
- **Authentication tables** - User management and sessions

## 🌱 Database Seeding

To populate the database with initial rice disease data:

```bash
# Start PostgreSQL
npm run db:up

# Push schema to database
npm run db:push

# Run seeding script
npm run db:seed
```

The seeding script includes:
- 12 common rice plant symptoms
- 3 major rice diseases (Hawar Daun Bakteri, Blast, Tungro)
- Treatment plans and medication recommendations
- Forward chaining rules with symptom relationships

## 🧹 Database Maintenance

### Automatic Cleanup

The system includes automatic cleanup of expired diagnosis records:

```bash
# Manually run cleanup
npm run db:cleanup
```

- Diagnosis history records expire after 30 days
- Cleanup removes expired records to maintain performance
- Admin data is preserved (user-facing data only)

### Data Retention Policy

- **User diagnosis history**: 30 days (auto-cleanup)
- **Admin/analysis data**: Permanent (preserved)
- **Feedback data**: Permanent (for system improvement)

## 🔧 Database Operations

### Development Commands

```bash
# Start PostgreSQL (Docker)
npm run db:up

# Stop PostgreSQL
npm run db:down

# Start development database (port 5433)
npm run db:dev

# Push schema changes
npm run db:push

# Generate migration files
npm run db:generate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Reset database (drop and recreate)
npm run db:reset
```

### Schema Updates

When modifying the schema:

1. Update the schema files in `db/schema/`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` to apply changes
4. Update seed data if necessary
5. Run `npm run db:seed` to refresh sample data

## 📊 Sample Data

The seeding script includes realistic rice disease data:

### Diseases Included:
1. **Hawar Daun Bakteri** (Xanthomonas oryzae pv. oryzae)
2. **Blast** (Pyricularia oryzae)
3. **Tungro** (Rice tungro bacilliform virus)

### Symptom Categories:
- **Daun**: Leaf-related symptoms
- **Batang**: Stem-related symptoms
- **Bunga**: Flower-related symptoms
- **Buah**: Grain-related symptoms
- **Umum**: General symptoms

### Treatment Types:
- **Chemical**: Fungicides, bactericides
- **Biological**: Biological control agents
- **Cultural**: Agricultural practices
- **Integrated**: Combined approaches

## 🔐 Security Considerations

- All user passwords are handled by Better Auth
- Sensitive data is encrypted at rest
- API tokens for AI services are stored in environment variables
- User data follows GDPR-like retention policies

## 🚀 Production Considerations

- Set up regular backups of PostgreSQL database
- Configure connection pooling for performance
- Monitor database size and query performance
- Set up alerts for cleanup job failures
- Consider read replicas for reporting queries

## 📝 Schema Extensibility

The schema is designed to be easily extended:

1. **New Diseases**: Add to `diseases` table and create corresponding rules
2. **New Symptoms**: Add to `symptoms` table with appropriate CF values
3. **AI Models**: Update `aiModel` field in diagnosis history
4. **Treatment Types**: Extend `treatmentType` enum
5. **Additional Data**: Add new tables as needed

## 🐛 Troubleshooting

### Common Issues

1. **Connection Errors**: Check PostgreSQL is running and DATABASE_URL is correct
2. **Migration Failures**: Verify schema syntax and foreign key relationships
3. **Seeding Errors**: Check for duplicate IDs or missing foreign key dependencies
4. **Performance Issues**: Review indexes and query patterns

### Debug Queries

```bash
# Check database connection
npm run db:studio

# Verify schema
npm run db:generate

# Check data
npm run db:seed
```
/**
 * Database Schema Index
 * Central export for all database tables and types
 */

// Authentication schemas
export * from "./auth";

// Core domain schemas
export * from "./symptoms";
export * from "./diseases";
export * from "./treatments";
export * from "./rules";
export * from "./diagnosis";

// Re-export commonly used tables
import { user } from "./auth";
import { symptoms } from "./symptoms";
import { diseases } from "./diseases";
import { treatments, medications } from "./treatments";
import { rules, ruleSymptoms } from "./rules";
import { diagnosisHistory, diagnosisSteps, diagnosisFeedback } from "./diagnosis";

// Tables object for schema operations
export const schema = {
  // Auth tables
  user,
  session,
  account,
  verification,

  // Core domain tables
  symptoms,
  diseases,
  treatments,
  medications,
  rules,
  ruleSymptoms,
  diagnosisHistory,
  diagnosisSteps,
  diagnosisFeedback,
};

// Export types for use throughout the application
export type {
  User,
  Session,
  Account,
  Verification,
  Symptom,
  NewSymptom,
  Disease,
  NewDisease,
  Treatment,
  NewTreatment,
  Medication,
  NewMedication,
  Rule,
  NewRule,
  RuleSymptom,
  NewRuleSymptom,
  DiagnosisHistory,
  NewDiagnosisHistory,
  DiagnosisStep,
  NewDiagnosisStep,
  DiagnosisFeedback,
  NewDiagnosisFeedback,
} from "./auth" and from "./symptoms" and from "./diseases" and from "./treatments" and from "./rules" and from "./diagnosis";
import { pgTable, text, decimal, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Diagnosis History table - stores all diagnosis sessions
 * This is the main table for tracking user diagnosis history
 */
export const diagnosisHistory = pgTable("diagnosis_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(), // Session identifier for grouping
  symptomsSelected: text("symptoms_selected").notNull(), // JSON array of selected symptom IDs
  symptomDetails: text("symptom_details"), // JSON object with symptom names and details
  certaintyFactors: text("certainty_factors"), // JSON object with CF values per symptom
  diseaseId: text("disease_id").references(() => diseases.id, { onDelete: "set null" }), // Final diagnosed disease
  diseaseName: text("disease_name"), // Cached disease name for performance
  finalCertaintyScore: decimal("final_certainty_score", { precision: 3, scale: 2 }), // Final CF calculation
  diagnosisMethod: text("diagnosis_method", { enum: ["forward_chaining", "certainty_factor", "hybrid"] }).notNull(),
  ruleId: text("rule_id").references(() => rules.id, { onDelete: "set null" }), // Rule that matched (if any)
  aiResponse: text("ai_response"), // JSON object with AI-generated treatment plan
  aiModel: text("ai_model"), // AI model used (OpenAI, Gemini, etc.)
  aiTokensUsed: integer("ai_tokens_used"), // AI API tokens consumed
  processingTime: integer("processing_time"), // Processing time in milliseconds
  ipAddress: text("ip_address"), // User IP for analytics
  userAgent: text("user_agent"), // Browser user agent
  status: text("status", { enum: ["completed", "pending", "failed"] }).notNull().default("completed"),
  expiresAt: timestamp("expires_at").notNull(), // 30 days from creation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  userIdx: index("idx_diagnosis_user").on(table.userId),
  sessionIdx: index("idx_diagnosis_session").on(table.sessionId),
  diseaseIdx: index("idx_diagnosis_disease").on(table.diseaseId),
  methodIdx: index("idx_diagnosis_method").on(table.diagnosisMethod),
  statusIdx: index("idx_diagnosis_status").on(table.status),
  expiresIdx: index("idx_diagnosis_expires").on(table.expiresAt),
  createdIdx: index("idx_diagnosis_created").on(table.createdAt),
}));

/**
 * Diagnosis Steps table - stores intermediate steps in diagnosis process
 * Useful for debugging and analysis
 */
export const diagnosisSteps = pgTable("diagnosis_steps", {
  id: text("id").primaryKey(),
  diagnosisId: text("diagnosis_id").notNull().references(() => diagnosisHistory.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  stepType: text("step_type", { enum: ["initial_input", "rule_matching", "cf_calculation", "ai_processing", "final_result"] }).notNull(),
  stepData: text("step_data").notNull(), // JSON object with step data
  description: text("description"), // Human-readable description
  processingTime: integer("processing_time"), // Time for this step in ms
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Composite index for performance
  diagnosisIdx: index("idx_diagnosis_step_diagnosis").on(table.diagnosisId),
  stepIdx: index("idx_diagnosis_step_number").on(table.diagnosisId, table.stepNumber),
  typeIdx: index("idx_diagnosis_step_type").on(table.stepType),
}));

/**
 * Diagnosis Feedback table - stores user feedback on diagnosis accuracy
 */
export const diagnosisFeedback = pgTable("diagnosis_feedback", {
  id: text("id").primaryKey(),
  diagnosisId: text("diagnosis_id").notNull().references(() => diagnosisHistory.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accuracy: integer("accuracy").notNull(), // 1-5 rating of accuracy
  helpfulness: integer("helpfulness").notNull(), // 1-5 rating of helpfulness
  comments: text("comments"), // User comments
  actualDisease: text("actual_disease"), // If user later confirms different disease
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  diagnosisIdx: index("idx_feedback_diagnosis").on(table.diagnosisId),
  userIdx: index("idx_feedback_user").on(table.userId),
}));

// Import for foreign key references
import { user } from "./auth";
import { diseases } from "./diseases";
import { rules } from "./rules";

export type DiagnosisHistory = typeof diagnosisHistory.$inferSelect;
export type NewDiagnosisHistory = typeof diagnosisHistory.$inferInsert;
export type DiagnosisStep = typeof diagnosisSteps.$inferSelect;
export type NewDiagnosisStep = typeof diagnosisSteps.$inferInsert;
export type DiagnosisFeedback = typeof diagnosisFeedback.$inferSelect;
export type NewDiagnosisFeedback = typeof diagnosisFeedback.$inferInsert;
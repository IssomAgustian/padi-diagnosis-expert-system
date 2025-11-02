import { pgTable, text, integer, decimal, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Rules table - stores forward chaining rules for disease diagnosis
 * This is the core rule base for the expert system
 */
export const rules = pgTable("rules", {
  id: text("id").primaryKey(), // e.g., "R001", "R002", etc.
  diseaseId: text("disease_id").notNull().references(() => diseases.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Rule name for identification
  symptomConditions: text("symptom_conditions").notNull(), // JSON array of required symptom codes
  certaintyThreshold: decimal("certainty_threshold", { precision: 3, scale: 2 }).notNull().default("0.8"), // Minimum CF threshold
  ruleType: text("rule_type", { enum: ["exact", "partial", "weighted"] }).notNull().default("exact"), // Rule matching type
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull().default("1.0"), // Rule confidence level
  priority: integer("priority").notNull().default(1), // Rule priority for conflicts
  isActive: text("is_active", { enum: ["yes", "no"] }).notNull().default("yes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  diseaseIdx: index("idx_rule_disease").on(table.diseaseId),
  typeIdx: index("idx_rule_type").on(table.ruleType),
  priorityIdx: index("idx_rule_priority").on(table.priority),
  activeIdx: index("idx_rule_active").on(table.isActive),
  thresholdIdx: index("idx_rule_threshold").on(table.certaintyThreshold),
}));

/**
 * RuleSymptoms table - links rules to symptoms with weights
 * This allows weighted symptom matching for partial rules
 */
export const ruleSymptoms = pgTable("rule_symptoms", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").notNull().references(() => rules.id, { onDelete: "cascade" }),
  symptomId: text("symptom_id").notNull().references(() => symptoms.id, { onDelete: "cascade" }),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull().default("1.0"), // Symptom weight in rule (0-1)
  isRequired: text("is_required", { enum: ["yes", "no"] }).notNull().default("yes"), // Whether symptom is required
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  // Composite index for performance
  ruleSymptomIdx: index("idx_rule_symptom").on(table.ruleId, table.symptomId),
  symptomIdx: index("idx_symptom_rule").on(table.symptomId),
}));

// Import for foreign key references
import { diseases } from "./diseases";
import { symptoms } from "./symptoms";

export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;
export type RuleSymptom = typeof ruleSymptoms.$inferSelect;
export type NewRuleSymptom = typeof ruleSymptoms.$inferInsert;
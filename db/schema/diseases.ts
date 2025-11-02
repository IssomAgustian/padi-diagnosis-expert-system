import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Diseases table - stores all possible rice plant diseases
 */
export const diseases = pgTable("diseases", {
  id: text("id").primaryKey(), // e.g., "P01", "P02", etc.
  name: text("name").notNull(), // e.g., "Hawar Daun Bakteri", "Blast"
  scientificName: text("scientific_name"), // e.g., "Xanthomonas oryzae pv. oryzae"
  description: text("description").notNull(), // Detailed description of the disease
  overview: text("overview"), // General overview for users
  causalAgent: text("causal_agent"), // What causes the disease (bacteria, fungi, virus, etc.)
  favorableConditions: text("favorable_conditions"), // Conditions that favor disease development
  economicImpact: text("economic_impact"), // Economic impact on rice production
  isActive: text("is_active", { enum: ["yes", "no"] }).notNull().default("yes"), // Soft delete flag
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  diseaseCodeIdx: index("idx_disease_code").on(table.id),
  diseaseNameIdx: index("idx_disease_name").on(table.name),
  activeIdx: index("idx_disease_active").on(table.isActive),
}));

export type Disease = typeof diseases.$inferSelect;
export type NewDisease = typeof diseases.$inferInsert;
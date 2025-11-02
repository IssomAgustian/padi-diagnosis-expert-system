import { pgTable, text, decimal, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Symptoms table - stores all possible rice plant symptoms
 * Each symptom has associated certainty factor values (MB/MD) for calculations
 */
export const symptoms = pgTable("symptoms", {
  id: text("id").primaryKey(), // e.g., "G01", "G02", etc.
  name: text("name").notNull(), // e.g., "Daun menguning", "Bintik coklat pada daun"
  description: text("description"), // Detailed description of the symptom
  mbValue: decimal("mb_value", { precision: 3, scale: 2 }).notNull().default("0.5"), // Measure of Belief value (0-1)
  mdValue: decimal("md_value", { precision: 3, scale: 2 }).notNull().default("0.5"), // Measure of Disbelief value (0-1)
  category: text("category").notNull(), // e.g., "Daun", "Batang", "Bunga", "Akar"
  severity: text("severity").notNull(), // "ringan", "sedang", "berat"
  isActive: text("is_active", { enum: ["yes", "no"] }).notNull().default("yes"), // Soft delete flag
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  symptomCodeIdx: index("idx_symptom_code").on(table.id),
  categoryIdx: index("idx_symptom_category").on(table.category),
  activeIdx: index("idx_symptom_active").on(table.isActive),
}));

export type Symptom = typeof symptoms.$inferSelect;
export type NewSymptom = typeof symptoms.$inferInsert;
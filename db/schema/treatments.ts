import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Treatments table - stores treatment recommendations for diseases
 */
export const treatments = pgTable("treatments", {
  id: text("id").primaryKey(), // Unique treatment ID
  diseaseId: text("disease_id").notNull().references(() => diseases.id, { onDelete: "cascade" }),
  treatmentType: text("treatment_type", { enum: ["chemical", "biological", "cultural", "integrated"] }).notNull(),
  title: text("title").notNull(), // e.g., "Penggunaan Fungisida", "Pengendalian Hayati"
  description: text("description").notNull(), // Detailed treatment description
  steps: text("steps").notNull(), // JSON array of treatment steps
  recommendation: text("recommendation"), // General recommendation
  preventiveMeasures: text("preventive_measures"), // Preventive measures
  isActive: text("is_active", { enum: ["yes", "no"] }).notNull().default("yes"),
  priority: integer("priority").notNull().default(1), // 1=high, 2=medium, 3=low
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  diseaseIdx: index("idx_treatment_disease").on(table.diseaseId),
  typeIdx: index("idx_treatment_type").on(table.treatmentType),
  priorityIdx: index("idx_treatment_priority").on(table.priority),
  activeIdx: index("idx_treatment_active").on(table.isActive),
}));

/**
 * Medications table - stores recommended medications for treatments
 */
export const medications = pgTable("medications", {
  id: text("id").primaryKey(),
  treatmentId: text("treatment_id").notNull().references(() => treatments.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Mancozeb 80% WP", "Propiconazole 250 EC"
  activeIngredient: text("active_ingredient").notNull(), // e.g., "Mancozeb", "Propiconazole"
  dosage: text("dosage").notNull(), // e.g., "2-3 g/liter air"
  applicationMethod: text("application_method").notNull(), // e.g., "Spray daun", "Penyemprotan merata"
  frequency: text("frequency").notNull(), // e.g., "7-10 hari sekali"
  preHarvestInterval: text("pre_harvest_interval"), // Days before harvest
  safetyPrecautions: text("safety_precautions"), // Safety precautions
  manufacturer: text("manufacturer"), // Manufacturer information
  isActive: text("is_active", { enum: ["yes", "no"] }).notNull().default("yes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  treatmentIdx: index("idx_medication_treatment").on(table.treatmentId),
  nameIdx: index("idx_medication_name").on(table.name),
  activeIdx: index("idx_medication_active").on(table.isActive),
}));

// Import diseases for foreign key reference
import { diseases } from "./diseases";

export type Treatment = typeof treatments.$inferSelect;
export type NewTreatment = typeof treatments.$inferInsert;
export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;
/**
 * Database seeding script for Rice Disease Diagnosis Expert System
 * This script populates the database with initial rice disease data
 */

import { db } from '../index';
import {
  symptoms,
  diseases,
  treatments,
  medications,
  rules,
  ruleSymptoms
} from '../schema';
import { eq } from 'drizzle-orm';

// Sample rice disease symptoms data
const sampleSymptoms = [
  {
    id: 'G01',
    name: 'Daun menguning',
    description: 'Daun tanaman padi menunjukkan warna kuning yang tidak normal',
    mbValue: 0.7,
    mdValue: 0.2,
    category: 'Daun',
    severity: 'sedang'
  },
  {
    id: 'G02',
    name: 'Bintik coklat pada daun',
    description: 'Muncul bintik-bintik berwarna coklat pada permukaan daun',
    mbValue: 0.8,
    mdValue: 0.1,
    category: 'Daun',
    severity: 'berat'
  },
  {
    id: 'G03',
    name: 'Lekukan pada daun',
    description: 'Daun mengalami lekukan atau kerutan yang tidak normal',
    mbValue: 0.6,
    mdValue: 0.3,
    category: 'Daun',
    severity: 'ringan'
  },
  {
    id: 'G04',
    name: 'Kehilangan warna hijau',
    description: 'Daun kehilangan pigmen hijau secara bertahap',
    mbValue: 0.5,
    mdValue: 0.4,
    category: 'Daun',
    severity: 'sedang'
  },
  {
    id: 'G05',
    name: 'Nekrosis pada ujung daun',
    description: 'Ujung daun mengering dan mati (nekrosis)',
    mbValue: 0.7,
    mdValue: 0.2,
    category: 'Daun',
    severity: 'berat'
  },
  {
    id: 'G06',
    name: 'Batang membusuk',
    description: 'Batang tanaman menunjukkan tanda-tanda pembusukan',
    mbValue: 0.8,
    mdValue: 0.1,
    category: 'Batang',
    severity: 'berat'
  },
  {
    id: 'G07',
    name: 'Bercak elips pada daun',
    description: 'Muncul bercak berbentuk elips dengan pusat abu-abu',
    mbValue: 0.9,
    mdValue: 0.05,
    category: 'Daun',
    severity: 'berat'
  },
  {
    id: 'G08',
    name: 'Bulu halus pada bercak',
    description: 'Bercak daun ditumbuhi bulu halus berwarna abu-abu',
    mbValue: 0.8,
    mdValue: 0.1,
    category: 'Daun',
    severity: 'berat'
  },
  {
    id: 'G09',
    name: 'Kuntum bunga menghitam',
    description: 'Kuntum bunga menunjukkan warna hitam',
    mbValue: 0.7,
    mdValue: 0.2,
    category: 'Bunga',
    severity: 'berat'
  },
  {
    id: 'G10',
    name: 'Buah tidak terisi penuh',
    description: 'Buah padi tidak terisi penuh (hampa)',
    mbValue: 0.6,
    mdValue: 0.3,
    category: 'Buah',
    severity: 'sedang'
  },
  {
    id: 'G11',
    name: 'Pertumbuhan terhambat',
    description: 'Pertumbuhan tanaman lebih lambat dari normal',
    mbValue: 0.5,
    mdValue: 0.4,
    category: 'Umum',
    severity: 'ringan'
  },
  {
    id: 'G12',
    name: 'Daun menggulung',
    description: 'Daun menggulung ke arah dalam atau luar',
    mbValue: 0.6,
    mdValue: 0.3,
    category: 'Daun',
    severity: 'sedang'
  }
];

// Sample rice diseases data
const sampleDiseases = [
  {
    id: 'P01',
    name: 'Hawar Daun Bakteri',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    description: 'Penyakit bakteri yang menyerang daun padi, menyebabkan bercak kuning hingga putih yang dapat menyebabkan kematian jaringan daun',
    overview: 'Hawar daun bakteri adalah salah satu penyakit paling merusak pada tanaman padi, dapat mengurangi hasil panen hingga 30-50%',
    causalAgent: 'Bakteri Xanthomonas oryzae pv. oryzae',
    favorableConditions: 'Kelembaban tinggi (>90%), suhu 25-30°C, hujan yang sering',
    economicImpact: 'Kerugian ekonomi besar akibat penurunan hasil panen dan kualitas beras'
  },
  {
    id: 'P02',
    name: 'Blast',
    scientificName: 'Pyricularia oryzae',
    description: 'Penyakit jamur yang menyebabkan bercak berlian (rhomboid) pada daun, leher malai, atau gabah',
    overview: 'Blast adalah penyakit padi paling penting di dunia, menyebabkan kerugian besar pada produksi padi global',
    causalAgent: 'Jamur Pyricularia oryzae (Magnaporthe oryzae)',
    favorableConditions: 'Suhu 25-28°C, kelembaban tinggi, kelembaban relatif >90%',
    economicImpact: 'Dapat menyebabkan kehilangan hasil hingga 70% dalam kondisi epidemi'
  },
  {
    id: 'P03',
    name: 'Tungro',
    scientificName: 'Rice tungro bacilliform virus',
    description: 'Penyakit virus yang disebarkan oleh wereng hijau, menyebabkan daun menguning dan pertumbuhan terhambat',
    overview: 'Tungro adalah penyakit virus kompleks yang menyebabkan kerugian signifikan pada produksi padi di Asia',
    causalAgent: 'Virus Tungro (Rice tungro bacilliform virus dan Rice tungro spherical virus)',
    favorableConditions: 'Populasi wereng hijau tinggi, musim tanam tertentu',
    economicImpact: 'Kerugian bisa mencapai 100% pada serangan berat di ladang yang rentan'
  }
];

// Sample treatment data
const sampleTreatments = [
  {
    id: 'T001',
    diseaseId: 'P01',
    treatmentType: 'chemical',
    title: 'Penggunaan Bakterisida',
    description: 'Aplikasi bakterisida untuk mengendalikan perkembangan bakteri penyebab hawar daun',
    steps: JSON.stringify([
      'Siapkan bakterisida yang direkomendasikan',
      'Campur dengan air sesuai dosis yang ditentukan',
      'Aplikasikan secara merata pada seluruh permukaan daun',
      'Ulangi aplikasi setiap 7-10 hari sekali',
      'Hentikan aplikasi 2 minggu sebelum panen'
    ]),
    recommendation: 'Gunakan secara preventif saat kondisi lingkungan mendukung perkembangan penyakit',
    preventiveMeasures: 'Gunakan varietas tahan, jaga kebersihan lahan, dan kelola irigasi dengan baik',
    priority: 1
  },
  {
    id: 'T002',
    diseaseId: 'P02',
    treatmentType: 'chemical',
    title: 'Aplikasi Fungisida',
    description: 'Penggunaan fungisida sistemik untuk mengendalikan infeksi jamur blast',
    steps: JSON.stringify([
      'Identifikasi gejala sedini mungkin',
      'Aplikasikan fungisida saat gejala pertama muncul',
      'Gunakan fungisida dengan bahan aktif yang tepat',
      'Semprotkan secara merata terutama bagian daun yang terinfeksi',
      'Lakukan aplikasi berulang sesuai anjuran'
    ]),
    recommendation: 'Preventif application during rainy season and high humidity periods',
    preventiveMeasures: 'Use resistant varieties, maintain proper plant spacing, avoid excessive nitrogen',
    priority: 1
  }
];

// Sample medication data
const sampleMedications = [
  {
    id: 'M001',
    treatmentId: 'T001',
    name: 'Streptomisin Sulfat',
    activeIngredient: 'Streptomycin sulfate',
    dosage: '1-2 g per 100 liter air',
    applicationMethod: 'Spray daun hingga merata',
    frequency: '7-10 hari sekali',
    preHarvestInterval: '14 hari',
    safetyPrecautions: 'Gunakan APD, hindari kontak langsung dengan kulit, cuci tangan setelah aplikasi',
    manufacturer: 'Berbagai produsen pertanian'
  },
  {
    id: 'M002',
    treatmentId: 'T002',
    name: 'Propikonazol 250 EC',
    activeIngredient: 'Propiconazole',
    dosage: '1-2 ml per liter air',
    applicationMethod: 'Spray daun hingga basah merata',
    frequency: '10-14 hari sekali',
    preHarvestInterval: '21 hari',
    safetyPrecautions: 'Gunakan masker dan sarung tangan, hindari inhalasi semprotan',
    manufacturer: 'Syngenta, Bayer, dll'
  }
];

// Sample rules for forward chaining
const sampleRules = [
  {
    id: 'R001',
    diseaseId: 'P01',
    name: 'Hawar Daun Bakteri - Gejala Khas',
    symptomConditions: JSON.stringify(['G01', 'G02', 'G07']),
    certaintyThreshold: 0.85,
    ruleType: 'exact' as const,
    confidence: 0.95,
    priority: 1
  },
  {
    id: 'R002',
    diseaseId: 'P02',
    name: 'Blast - Gejala Khas',
    symptomConditions: JSON.stringify(['G02', 'G05', 'G08']),
    certaintyThreshold: 0.90,
    ruleType: 'exact' as const,
    confidence: 0.90,
    priority: 1
  },
  {
    id: 'R003',
    diseaseId: 'P03',
    name: 'Tungro - Gejala Khas',
    symptomConditions: JSON.stringify(['G01', 'G10', 'G11']),
    certaintyThreshold: 0.80,
    ruleType: 'exact' as const,
    confidence: 0.85,
    priority: 1
  }
];

// Sample rule-symptom relationships
const sampleRuleSymptoms = [
  { id: 'RS001', ruleId: 'R001', symptomId: 'G01', weight: 0.9, isRequired: 'yes' as const },
  { id: 'RS002', ruleId: 'R001', symptomId: 'G02', weight: 0.8, isRequired: 'yes' as const },
  { id: 'RS003', ruleId: 'R001', symptomId: 'G07', weight: 1.0, isRequired: 'yes' as const },
  { id: 'RS004', ruleId: 'R002', symptomId: 'G02', weight: 0.8, isRequired: 'yes' as const },
  { id: 'RS005', ruleId: 'R002', symptomId: 'G05', weight: 0.9, isRequired: 'yes' as const },
  { id: 'RS006', ruleId: 'R002', symptomId: 'G08', weight: 1.0, isRequired: 'yes' as const },
  { id: 'RS007', ruleId: 'R003', symptomId: 'G01', weight: 0.8, isRequired: 'yes' as const },
  { id: 'RS008', ruleId: 'R003', symptomId: 'G10', weight: 0.9, isRequired: 'yes' as const },
  { id: 'RS009', ruleId: 'R003', symptomId: 'G11', weight: 0.7, isRequired: 'yes' as const }
];

export async function seedDatabase() {
  console.log('🌱 Starting database seeding for Rice Disease Diagnosis System...');

  try {
    // Clear existing data
    await db.delete(diagnosisFeedback);
    await db.delete(diagnosisSteps);
    await db.delete(diagnosisHistory);
    await db.delete(ruleSymptoms);
    await db.delete(rules);
    await db.delete(medications);
    await db.delete(treatments);
    await db.delete(diseases);
    await db.delete(symptoms);
    console.log('✅ Cleared existing data');

    // Insert symptoms
    console.log('🌿 Inserting symptoms...');
    await db.insert(symptoms).values(sampleSymptoms);
    console.log(`✅ Inserted ${sampleSymptoms.length} symptoms`);

    // Insert diseases
    console.log('🦠 Inserting diseases...');
    await db.insert(diseases).values(sampleDiseases);
    console.log(`✅ Inserted ${sampleDiseases.length} diseases`);

    // Insert treatments
    console.log('💊 Inserting treatments...');
    await db.insert(treatments).values(sampleTreatments);
    console.log(`✅ Inserted ${sampleTreatments.length} treatments`);

    // Insert medications
    console.log('🏥 Inserting medications...');
    await db.insert(medications).values(sampleMedications);
    console.log(`✅ Inserted ${sampleMedications.length} medications`);

    // Insert rules
    console.log('⚖️ Inserting rules...');
    await db.insert(rules).values(sampleRules);
    console.log(`✅ Inserted ${sampleRules.length} rules`);

    // Insert rule-symptom relationships
    console.log('🔗 Inserting rule-symptom relationships...');
    await db.insert(ruleSymptoms).values(sampleRuleSymptoms);
    console.log(`✅ Inserted ${sampleRuleSymptoms.length} rule-symptom relationships`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Symptoms: ${sampleSymptoms.length}`);
    console.log(`   • Diseases: ${sampleDiseases.length}`);
    console.log(`   • Treatments: ${sampleTreatments.length}`);
    console.log(`   • Medications: ${sampleMedications.length}`);
    console.log(`   • Rules: ${sampleRules.length}`);
    console.log(`   • Rule-Symptom relationships: ${sampleRuleSymptoms.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
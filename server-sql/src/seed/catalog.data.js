'use strict';

/**
 * Built-in reference catalogs (same data as the MongoDB server). The case
 * study referred to an external Excel file that was not provided, so these
 * sensible defaults are seeded instead.
 */

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Obstetrics and Gynecology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Gastroenterology',
  'Endocrinology',
  'Pulmonology',
  'Nephrology',
  'Urology',
  'Dentistry',
];

const MEDICINES = [
  { name: 'Paracetamol', strength: '500mg' },
  { name: 'Paracetamol', strength: '650mg' },
  { name: 'Amoxicillin', strength: '250mg' },
  { name: 'Amoxicillin', strength: '500mg' },
  { name: 'Azithromycin', strength: '500mg' },
  { name: 'Pantoprazole', strength: '40mg' },
  { name: 'Omeprazole', strength: '20mg' },
  { name: 'Cetirizine', strength: '10mg' },
  { name: 'Metformin', strength: '500mg' },
  { name: 'Amlodipine', strength: '5mg' },
  { name: 'Atorvastatin', strength: '10mg' },
  { name: 'Ibuprofen', strength: '400mg' },
  { name: 'Diclofenac', strength: '50mg' },
  { name: 'Montelukast', strength: '10mg' },
  { name: 'Levothyroxine', strength: '50mcg' },
  { name: 'Aspirin', strength: '75mg' },
  { name: 'Ranitidine', strength: '150mg' },
  { name: 'Ciprofloxacin', strength: '500mg' },
  { name: 'Doxycycline', strength: '100mg' },
  { name: 'Prednisolone', strength: '5mg' },
  { name: 'Salbutamol', strength: '2mg' },
  { name: 'Vitamin D3', strength: '60000 IU' },
  { name: 'Vitamin B Complex', strength: '-' },
  { name: 'Calcium Carbonate', strength: '500mg' },
];

const MEDICAL_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Fasting Blood Sugar (FBS)',
  'Postprandial Blood Sugar (PPBS)',
  'HbA1c',
  'Thyroid Profile (T3, T4, TSH)',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Urine Routine',
  'X-Ray Chest',
  'ECG',
  'Echocardiogram',
  'Ultrasound Abdomen',
  'CT Scan',
  'MRI',
  'Vitamin D Test',
  'Vitamin B12 Test',
  'Serum Electrolytes',
  'C-Reactive Protein (CRP)',
  'COVID-19 RT-PCR',
];

module.exports = { SPECIALIZATIONS, MEDICINES, MEDICAL_TESTS };

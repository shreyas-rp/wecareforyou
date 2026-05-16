/** Shared API/domain types. */

export type Role = 'admin' | 'doctor' | 'patient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  profileId: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  details?: string[];
}

export interface Specialization {
  _id: string;
  name: string;
}
export interface Medicine {
  _id: string;
  name: string;
  strength?: string;
}
export interface MedicalTest {
  _id: string;
  name: string;
}

export interface Doctor {
  _id: string;
  userId?: { _id: string; email: string; phone?: string; isActive?: boolean };
  name: string;
  specialty: string;
  experienceYears: number;
  qualification?: string;
  designation?: string;
  availability?: { day: string; from: string; to: string }[];
}

export interface Patient {
  _id: string;
  userId?: { _id: string; email: string; phone?: string };
  fullName: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  contactNumber?: string;
  medicalHistory?: string;
}

export interface Prescription {
  medicineName: string;
  dosage: string; // e.g. "0-0-1"
  timing: 'AF' | 'BF';
  notes?: string;
}

export interface Consultation {
  currentSymptoms?: string;
  physicalExamination?: string;
  treatmentPlan?: string;
  recommendedTests?: string[];
  prescriptions?: Prescription[];
  diagnosis?: string;
  completedAt?: string;
}

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface Appointment {
  _id: string;
  patientId: string | Patient;
  doctorId: string | Doctor;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber: string;
  symptomsDescription: string;
  natureOfVisit: string;
  preferredDate: string;
  preferredTime: string;
  status: AppointmentStatus;
  consultation?: Consultation;
  rescheduleHistory?: unknown[];
  createdAt?: string;
}

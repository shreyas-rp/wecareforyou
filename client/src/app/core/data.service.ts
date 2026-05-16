import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import {
  ApiResponse,
  Appointment,
  Doctor,
  MedicalTest,
  Medicine,
  Patient,
  Specialization,
} from './models';

/**
 * Single typed gateway to the WeCareForYou API, grouped by domain.
 * Auth/error headers are handled by the HTTP interceptors.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  /* -------------------- Catalog -------------------- */
  specializations() {
    return this.http.get<ApiResponse<Specialization[]>>(
      `${API_BASE}/catalog/specializations`
    );
  }
  medicines() {
    return this.http.get<ApiResponse<Medicine[]>>(
      `${API_BASE}/catalog/medicines`
    );
  }
  tests() {
    return this.http.get<ApiResponse<MedicalTest[]>>(
      `${API_BASE}/catalog/tests`
    );
  }

  /* -------------------- Doctor search (patient) -------------------- */
  searchDoctors(specialization?: string, search?: string) {
    let params = new HttpParams();
    if (specialization) params = params.set('specialization', specialization);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Doctor[]>>(`${API_BASE}/doctors`, {
      params,
    });
  }
  getDoctor(id: string) {
    return this.http.get<ApiResponse<Doctor>>(`${API_BASE}/doctors/${id}`);
  }

  /* -------------------- Patient self -------------------- */
  myPatientProfile() {
    return this.http.get<ApiResponse<Patient>>(`${API_BASE}/patient/me`);
  }
  updatePatientProfile(body: Record<string, unknown>) {
    return this.http.put<ApiResponse<Patient>>(`${API_BASE}/patient/me`, body);
  }
  bookAppointment(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<Appointment>>(
      `${API_BASE}/appointments`,
      body
    );
  }
  myAppointments(status: 'upcoming' | 'completed') {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${API_BASE}/appointments/mine`,
      { params: new HttpParams().set('status', status) }
    );
  }
  patientReschedule(id: string, preferredDate: string, preferredTime: string) {
    return this.http.put<ApiResponse<Appointment>>(
      `${API_BASE}/appointments/${id}/reschedule`,
      { preferredDate, preferredTime }
    );
  }

  /* -------------------- Doctor self -------------------- */
  myDoctorProfile() {
    return this.http.get<ApiResponse<Doctor>>(`${API_BASE}/doctor/me`);
  }
  updateDoctorProfile(body: Record<string, unknown>) {
    return this.http.put<ApiResponse<Doctor>>(`${API_BASE}/doctor/me`, body);
  }
  doctorAppointments(status: 'upcoming' | 'completed') {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${API_BASE}/doctor/appointments`,
      { params: new HttpParams().set('status', status) }
    );
  }
  doctorSetStatus(id: string, action: 'confirm' | 'reject' | 'cancel') {
    return this.http.put<ApiResponse<Appointment>>(
      `${API_BASE}/doctor/appointments/${id}/status`,
      { action }
    );
  }
  saveConsultation(id: string, body: Record<string, unknown>) {
    return this.http.put<ApiResponse<Appointment>>(
      `${API_BASE}/doctor/appointments/${id}/consultation`,
      body
    );
  }

  /* -------------------- Admin -------------------- */
  adminDoctors() {
    return this.http.get<ApiResponse<Doctor[]>>(`${API_BASE}/admin/doctors`);
  }
  adminCreateDoctor(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<Doctor>>(
      `${API_BASE}/admin/doctors`,
      body
    );
  }
  adminUpdateDoctor(id: string, body: Record<string, unknown>) {
    return this.http.put<ApiResponse<Doctor>>(
      `${API_BASE}/admin/doctors/${id}`,
      body
    );
  }
  adminDeleteDoctor(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${API_BASE}/admin/doctors/${id}`);
  }

  adminPatients() {
    return this.http.get<ApiResponse<Patient[]>>(`${API_BASE}/admin/patients`);
  }
  adminCreatePatient(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<Patient>>(
      `${API_BASE}/admin/patients`,
      body
    );
  }
  adminUpdatePatient(id: string, body: Record<string, unknown>) {
    return this.http.put<ApiResponse<Patient>>(
      `${API_BASE}/admin/patients/${id}`,
      body
    );
  }
  adminDeletePatient(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${API_BASE}/admin/patients/${id}`);
  }

  adminAppointments() {
    return this.http.get<ApiResponse<Appointment[]>>(
      `${API_BASE}/admin/appointments`
    );
  }
  adminGetAppointment(id: string) {
    return this.http.get<ApiResponse<Appointment>>(
      `${API_BASE}/admin/appointments/${id}`
    );
  }
  adminReschedule(id: string, preferredDate: string, preferredTime: string) {
    return this.http.put<ApiResponse<Appointment>>(
      `${API_BASE}/admin/appointments/${id}/reschedule`,
      { preferredDate, preferredTime }
    );
  }
}

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Doctor } from '../../core/models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './patient-dashboard.component.html',
})
export class PatientDashboardComponent implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  upcoming = signal<Appointment[]>([]);
  completed = signal<Appointment[]>([]);

  // Reschedule modal state
  rescheduleTarget = signal<Appointment | null>(null);
  newDate = '';
  newTime = '';

  // Prescription view modal state
  viewTarget = signal<Appointment | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.data.myAppointments('upcoming').subscribe({
      next: (r) => this.upcoming.set(r.data ?? []),
      error: () => {},
    });
    this.data.myAppointments('completed').subscribe({
      next: (r) => {
        this.completed.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  doctorName(a: Appointment): string {
    return typeof a.doctorId === 'object'
      ? (a.doctorId as Doctor).name
      : 'Doctor';
  }
  doctorSpecialty(a: Appointment): string {
    return typeof a.doctorId === 'object'
      ? (a.doctorId as Doctor).specialty
      : '';
  }

  openReschedule(a: Appointment) {
    this.rescheduleTarget.set(a);
    this.newDate = a.preferredDate?.substring(0, 10) ?? '';
    this.newTime = a.preferredTime ?? '';
  }
  closeReschedule() {
    this.rescheduleTarget.set(null);
  }
  confirmReschedule() {
    const a = this.rescheduleTarget();
    if (!a || !this.newDate || !this.newTime) {
      this.toast.error('Please pick a new date and time.');
      return;
    }
    this.data.patientReschedule(a._id, this.newDate, this.newTime).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Appointment rescheduled.');
        this.closeReschedule();
        this.load();
      },
    });
  }

  openView(a: Appointment) {
    this.viewTarget.set(a);
  }
  closeView() {
    this.viewTarget.set(null);
  }
}

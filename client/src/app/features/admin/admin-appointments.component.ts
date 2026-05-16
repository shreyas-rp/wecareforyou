import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Doctor, Patient } from '../../core/models';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-appointments.component.html',
})
export class AdminAppointmentsComponent implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);
  statusFilter = '';

  rescheduleTarget = signal<Appointment | null>(null);
  viewTarget = signal<Appointment | null>(null);
  newDate = '';
  newTime = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.data.adminAppointments().subscribe({
      next: (r) => {
        this.appointments.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get filtered(): Appointment[] {
    const list = this.appointments();
    return this.statusFilter
      ? list.filter((a) => a.status === this.statusFilter)
      : list;
  }

  doctorName(a: Appointment): string {
    return typeof a.doctorId === 'object'
      ? (a.doctorId as Doctor).name
      : 'Doctor';
  }
  patientName(a: Appointment): string {
    return typeof a.patientId === 'object'
      ? (a.patientId as Patient).fullName
      : a.fullName;
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
    this.data.adminReschedule(a._id, this.newDate, this.newTime).subscribe({
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

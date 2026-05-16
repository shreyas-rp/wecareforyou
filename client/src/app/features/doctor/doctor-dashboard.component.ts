import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Appointment, Patient } from '../../core/models';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctor-dashboard.component.html',
})
export class DoctorDashboardComponent implements OnInit {
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  upcoming = signal<Appointment[]>([]);
  completed = signal<Appointment[]>([]);
  viewTarget = signal<Appointment | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.data.doctorAppointments('upcoming').subscribe({
      next: (r) => this.upcoming.set(r.data ?? []),
    });
    this.data.doctorAppointments('completed').subscribe({
      next: (r) => {
        this.completed.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  patientName(a: Appointment): string {
    return typeof a.patientId === 'object'
      ? (a.patientId as Patient).fullName
      : a.fullName;
  }

  act(a: Appointment, action: 'confirm' | 'reject' | 'cancel') {
    const verb =
      action === 'confirm' ? 'confirm' : action === 'reject' ? 'reject' : 'cancel';
    if (!confirm(`Are you sure you want to ${verb} this appointment?`)) return;
    this.data.doctorSetStatus(a._id, action).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Updated.');
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

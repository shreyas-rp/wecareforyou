import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent implements OnInit {
  private data = inject(DataService);

  loading = signal(true);
  doctors = signal(0);
  patients = signal(0);
  appointments = signal(0);
  pending = signal(0);
  completed = signal(0);

  ngOnInit() {
    forkJoin({
      d: this.data.adminDoctors(),
      p: this.data.adminPatients(),
      a: this.data.adminAppointments(),
    }).subscribe({
      next: ({ d, p, a }) => {
        this.doctors.set(d.data?.length ?? 0);
        this.patients.set(p.data?.length ?? 0);
        const appts = a.data ?? [];
        this.appointments.set(appts.length);
        this.pending.set(
          appts.filter((x) => x.status === 'requested').length
        );
        this.completed.set(
          appts.filter((x) => x.status === 'completed').length
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

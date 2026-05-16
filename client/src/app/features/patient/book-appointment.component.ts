import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Doctor, Specialization } from '../../core/models';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './book-appointment.component.html',
})
export class BookAppointmentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);
  private router = inject(Router);

  specializations = signal<Specialization[]>([]);
  doctors = signal<Doctor[]>([]);
  loadingDoctors = signal(false);
  submitting = signal(false);

  filterSpecialization = '';
  filterSearch = '';
  selectedDoctor = signal<Doctor | null>(null);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    dateOfBirth: [''],
    gender: ['', [Validators.required]],
    contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    symptomsDescription: ['', [Validators.required]],
    natureOfVisit: ['', [Validators.required]],
    preferredDate: ['', [Validators.required]],
    preferredTime: ['', [Validators.required]],
  });

  ngOnInit() {
    this.data.specializations().subscribe({
      next: (r) => this.specializations.set(r.data ?? []),
    });
    this.search();
  }

  search() {
    this.loadingDoctors.set(true);
    this.data
      .searchDoctors(this.filterSpecialization, this.filterSearch)
      .subscribe({
        next: (r) => {
          this.doctors.set(r.data ?? []);
          this.loadingDoctors.set(false);
        },
        error: () => this.loadingDoctors.set(false),
      });
  }

  pickDoctor(d: Doctor) {
    this.selectedDoctor.set(d);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit() {
    const doctor = this.selectedDoctor();
    if (!doctor) {
      this.toast.error('Please select a doctor first.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please complete the required fields.');
      return;
    }
    this.submitting.set(true);
    this.data
      .bookAppointment({ doctorId: doctor._id, ...this.form.getRawValue() })
      .subscribe({
        next: (r) => {
          this.toast.success(r.message || 'Appointment requested.');
          this.router.navigate(['/patient']);
        },
        error: () => this.submitting.set(false),
      });
  }
}

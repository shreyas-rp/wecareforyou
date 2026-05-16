import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-profile.component.html',
})
export class PatientProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    dateOfBirth: [''],
    gender: [''],
    contactNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    medicalHistory: [''],
  });

  ngOnInit() {
    this.data.myPatientProfile().subscribe({
      next: (r) => {
        const p = r.data;
        if (p) {
          this.form.patchValue({
            fullName: p.fullName ?? '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : '',
            gender: p.gender ?? '',
            contactNumber: p.contactNumber ?? '',
            medicalHistory: p.medicalHistory ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.data.updatePatientProfile(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Profile updated.');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}

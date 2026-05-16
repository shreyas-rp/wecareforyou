import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Doctor } from '../../core/models';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-profile.component.html',
})
export class DoctorProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  availability = signal<Doctor['availability']>([]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    specialty: ['', [Validators.required]],
    experienceYears: [0, [Validators.required, Validators.min(0)]],
    qualification: [''],
    designation: [''],
  });

  ngOnInit() {
    this.data.myDoctorProfile().subscribe({
      next: (r) => {
        const d = r.data;
        if (d) {
          this.form.patchValue({
            name: d.name,
            specialty: d.specialty,
            experienceYears: d.experienceYears,
            qualification: d.qualification ?? '',
            designation: d.designation ?? '',
          });
          this.availability.set(d.availability ?? []);
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
    this.data.updateDoctorProfile(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Profile updated.');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}

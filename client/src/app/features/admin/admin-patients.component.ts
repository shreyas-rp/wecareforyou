import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Patient } from '../../core/models';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-patients.component.html',
})
export class AdminPatientsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  patients = signal<Patient[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    contactNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
    dateOfBirth: [''],
    gender: [''],
    medicalHistory: [''],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.data.adminPatients().subscribe({
      next: (r) => {
        this.patients.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  openAdd() {
    this.editingId.set(null);
    this.form.reset();
    this.form.get('password')?.addValidators(Validators.required);
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEdit(p: Patient) {
    this.editingId.set(p._id);
    this.form.reset({
      fullName: p.fullName,
      email: p.userId?.email ?? '',
      password: '',
      contactNumber: p.contactNumber ?? '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : '',
      gender: p.gender ?? '',
      medicalHistory: p.medicalHistory ?? '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  close() {
    this.showForm.set(false);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please complete the required fields.');
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.editingId();
    const req = id
      ? this.data.adminUpdatePatient(id, v)
      : this.data.adminCreatePatient(v);
    req.subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Saved.');
        this.saving.set(false);
        this.close();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(p: Patient) {
    if (!confirm(`Delete patient "${p.fullName}"? This also removes their login.`))
      return;
    this.data.adminDeletePatient(p._id).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Patient deleted.');
        this.load();
      },
    });
  }
}

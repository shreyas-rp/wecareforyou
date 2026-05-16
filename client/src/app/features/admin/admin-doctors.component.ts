import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import { Doctor, Specialization } from '../../core/models';

@Component({
  selector: 'app-admin-doctors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-doctors.component.html',
})
export class AdminDoctorsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  doctors = signal<Doctor[]>([]);
  specializations = signal<Specialization[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    phone: [''],
    specialty: ['', [Validators.required]],
    experienceYears: [0, [Validators.min(0)]],
    qualification: [''],
    designation: [''],
  });

  ngOnInit() {
    this.data.specializations().subscribe({
      next: (r) => this.specializations.set(r.data ?? []),
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.data.adminDoctors().subscribe({
      next: (r) => {
        this.doctors.set(r.data ?? []);
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
    this.form.reset({ experienceYears: 0 });
    this.form.get('password')?.addValidators(Validators.required);
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEdit(d: Doctor) {
    this.editingId.set(d._id);
    this.form.reset({
      name: d.name,
      email: d.userId?.email ?? '',
      password: '',
      phone: d.userId?.phone ?? '',
      specialty: d.specialty,
      experienceYears: d.experienceYears,
      qualification: d.qualification ?? '',
      designation: d.designation ?? '',
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
      ? this.data.adminUpdateDoctor(id, v)
      : this.data.adminCreateDoctor(v);
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

  remove(d: Doctor) {
    if (!confirm(`Delete doctor "${d.name}"? This also removes their login.`))
      return;
    this.data.adminDeleteDoctor(d._id).subscribe({
      next: (r) => {
        this.toast.success(r.message || 'Doctor deleted.');
        this.load();
      },
    });
  }
}

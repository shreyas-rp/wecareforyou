import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataService } from '../../core/data.service';
import { ToastService } from '../../core/toast.service';
import {
  Appointment,
  MedicalTest,
  Medicine,
  Patient,
} from '../../core/models';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './consultation.component.html',
})
export class ConsultationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  appointment = signal<Appointment | null>(null);
  medicines = signal<Medicine[]>([]);
  tests = signal<MedicalTest[]>([]);

  form = this.fb.group({
    currentSymptoms: ['', [Validators.required]],
    physicalExamination: ['', [Validators.required]],
    treatmentPlan: ['', [Validators.required]],
    diagnosis: ['', [Validators.required]],
    recommendedTests: this.fb.control<string[]>([]),
    prescriptions: this.fb.array([] as FormGroup[]),
  });

  get prescriptions(): FormArray {
    return this.form.get('prescriptions') as FormArray;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.data.medicines().subscribe({
      next: (r) => this.medicines.set(r.data ?? []),
    });
    this.data.tests().subscribe({ next: (r) => this.tests.set(r.data ?? []) });

    // Locate the appointment in the doctor's lists.
    this.data.doctorAppointments('upcoming').subscribe({
      next: (up) => {
        let found = (up.data ?? []).find((a) => a._id === id);
        if (found) {
          this.bind(found);
        } else {
          this.data.doctorAppointments('completed').subscribe({
            next: (cp) => {
              found = (cp.data ?? []).find((a) => a._id === id);
              if (found) this.bind(found);
              else this.toast.error('Appointment not found.');
              this.loading.set(false);
            },
          });
          return;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.addPrescription();
  }

  private bind(a: Appointment) {
    this.appointment.set(a);
    const c = a.consultation;
    if (c && (c.diagnosis || c.currentSymptoms)) {
      this.form.patchValue({
        currentSymptoms: c.currentSymptoms ?? '',
        physicalExamination: c.physicalExamination ?? '',
        treatmentPlan: c.treatmentPlan ?? '',
        diagnosis: c.diagnosis ?? '',
        recommendedTests: c.recommendedTests ?? [],
      });
      this.prescriptions.clear();
      (c.prescriptions ?? []).forEach((p) =>
        this.prescriptions.push(
          this.fb.group({
            medicineName: [p.medicineName, Validators.required],
            dosage: [p.dosage, Validators.required],
            timing: [p.timing, Validators.required],
            notes: [p.notes ?? ''],
          })
        )
      );
      if (this.prescriptions.length === 0) this.addPrescription();
    }
  }

  patientName(): string {
    const a = this.appointment();
    if (!a) return '';
    return typeof a.patientId === 'object'
      ? (a.patientId as Patient).fullName
      : a.fullName;
  }

  addPrescription() {
    this.prescriptions.push(
      this.fb.group({
        medicineName: ['', Validators.required],
        dosage: ['0-0-1', Validators.required],
        timing: ['AF', Validators.required],
        notes: [''],
      })
    );
  }
  removePrescription(i: number) {
    this.prescriptions.removeAt(i);
  }

  toggleTest(name: string, checked: boolean) {
    const ctrl = this.form.get('recommendedTests')!;
    const list = new Set<string>(ctrl.value ?? []);
    checked ? list.add(name) : list.delete(name);
    ctrl.setValue([...list]);
  }
  isTestSelected(name: string): boolean {
    return (this.form.get('recommendedTests')!.value ?? []).includes(name);
  }

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please complete the required consultation fields.');
      return;
    }
    const a = this.appointment();
    if (!a) return;

    // Drop empty prescription rows.
    const prescriptions = this.prescriptions.value.filter(
      (p: { medicineName: string }) => p.medicineName
    );

    this.saving.set(true);
    this.data
      .saveConsultation(a._id, { ...this.form.value, prescriptions })
      .subscribe({
        next: (r) => {
          this.toast.success(r.message || 'Consultation saved.');
          this.router.navigate(['/doctor']);
        },
        error: () => this.saving.set(false),
      });
  }
}

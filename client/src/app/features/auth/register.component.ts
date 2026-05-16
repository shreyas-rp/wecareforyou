import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { PasswordStrengthComponent } from '../../shared/password-strength.component';

/** Passwords-match cross-field validator. */
function passwordsMatch(group: AbstractControl) {
  const p = group.get('password')?.value;
  const c = group.get('confirmPassword')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PasswordStrengthComponent,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      contactNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      dateOfBirth: [''],
      gender: [''],
      medicalHistory: [''],
    },
    { validators: passwordsMatch }
  );

  invalid(ctrl: string): boolean {
    const c = this.form.get(ctrl);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  get passwordValue(): string {
    return this.form.get('password')?.value ?? '';
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please correct the highlighted fields.');
      return;
    }
    this.loading.set(true);
    const v = this.form.getRawValue();
    this.auth
      .register({
        name: v.name,
        email: v.email,
        password: v.password,
        contactNumber: v.contactNumber || undefined,
        dateOfBirth: v.dateOfBirth || undefined,
        gender: v.gender || undefined,
        medicalHistory: v.medicalHistory || undefined,
      })
      .subscribe({
        next: (res) => {
          this.toast.success(
            res.message || 'Registration successful. Please sign in.'
          );
          this.router.navigate(['/login']);
        },
        error: () => this.loading.set(false),
      });
  }
}

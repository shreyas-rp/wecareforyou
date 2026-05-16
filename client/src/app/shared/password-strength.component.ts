import { Component, Input } from '@angular/core';

interface Rule {
  label: string;
  ok: (p: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'At least 8 characters', ok: (p) => p.length >= 8 },
  { label: 'An uppercase letter', ok: (p) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', ok: (p) => /[a-z]/.test(p) },
  { label: 'A number', ok: (p) => /[0-9]/.test(p) },
  { label: 'A special character', ok: (p) => /[^A-Za-z0-9]/.test(p) },
];

/**
 * Real-time password strength meter + requirement checklist.
 * Used on Registration and Forgot Password.
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  template: `
    @if (password) {
    <div class="mt-2">
      <div class="password-meter">
        <span [style.width.%]="score * 20" [style.background]="color"></span>
      </div>
      <small class="d-block mt-1" [style.color]="color">{{ label }}</small>
      <ul class="list-unstyled small mt-2 mb-0">
        @for (r of rules; track r.label) {
        <li [class.text-success]="r.ok(password)" class="text-muted-2">
          <i
            class="bi"
            [class.bi-check-circle-fill]="r.ok(password)"
            [class.bi-circle]="!r.ok(password)"
          ></i>
          {{ r.label }}
        </li>
        }
      </ul>
    </div>
    }
  `,
})
export class PasswordStrengthComponent {
  @Input() password = '';
  rules = RULES;

  get score(): number {
    return RULES.filter((r) => r.ok(this.password)).length;
  }
  get label(): string {
    return ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][
      this.score
    ];
  }
  get color(): string {
    return ['#dc2626', '#dc2626', '#d97706', '#d97706', '#16a34a', '#16a34a'][
      this.score
    ];
  }
}

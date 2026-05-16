import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

/** Top navigation. Links adapt to the signed-in user's role. */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="wc-navbar navbar navbar-expand-lg sticky-top">
      <div class="container">
        <a class="wc-logo lg navbar-brand" [routerLink]="auth.homeForRole(auth.role())">
          <i class="bi bi-heart-pulse-fill"></i> WeCareForYou
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#wcNav"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="wcNav">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            @if (auth.role() === 'patient') {
            <li class="nav-item">
              <a class="nav-link" routerLink="/patient" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/patient/book" routerLinkActive="active">Book Appointment</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/patient/profile" routerLinkActive="active">My Profile</a>
            </li>
            } @if (auth.role() === 'doctor') {
            <li class="nav-item">
              <a class="nav-link" routerLink="/doctor" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Appointments</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/doctor/profile" routerLinkActive="active">My Profile</a>
            </li>
            } @if (auth.role() === 'admin') {
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Overview</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/doctors" routerLinkActive="active">Doctors</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/patients" routerLinkActive="active">Patients</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/appointments" routerLinkActive="active">Appointments</a>
            </li>
            }
            <li class="nav-item ms-lg-3 d-flex align-items-center gap-2">
              <span class="text-muted-2 small d-none d-lg-inline">
                <i class="bi bi-person-circle"></i> {{ auth.user()?.name }}
                <span class="badge text-bg-light text-capitalize">{{ auth.role() }}</span>
              </span>
              <button class="btn btn-sm btn-outline-primary" (click)="logout()">
                <i class="bi bi-box-arrow-right"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

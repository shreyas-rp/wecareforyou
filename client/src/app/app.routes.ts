import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },

  /* ----------------------------- Patient ----------------------------- */
  {
    path: 'patient',
    canActivate: [authGuard, roleGuard(['patient'])],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/patient/patient-dashboard.component').then(
            (m) => m.PatientDashboardComponent
          ),
      },
      {
        path: 'book',
        loadComponent: () =>
          import('./features/patient/book-appointment.component').then(
            (m) => m.BookAppointmentComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/patient/patient-profile.component').then(
            (m) => m.PatientProfileComponent
          ),
      },
    ],
  },

  /* ----------------------------- Doctor ------------------------------ */
  {
    path: 'doctor',
    canActivate: [authGuard, roleGuard(['doctor'])],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/doctor/doctor-dashboard.component').then(
            (m) => m.DoctorDashboardComponent
          ),
      },
      {
        path: 'consult/:id',
        loadComponent: () =>
          import('./features/doctor/consultation.component').then(
            (m) => m.ConsultationComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/doctor/doctor-profile.component').then(
            (m) => m.DoctorProfileComponent
          ),
      },
    ],
  },

  /* ------------------------------ Admin ------------------------------ */
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/admin-overview.component').then(
            (m) => m.AdminOverviewComponent
          ),
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./features/admin/admin-doctors.component').then(
            (m) => m.AdminDoctorsComponent
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/admin/admin-patients.component').then(
            (m) => m.AdminPatientsComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/admin/admin-appointments.component').then(
            (m) => m.AdminAppointmentsComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];

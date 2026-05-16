import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/** Attaches the Bearer token to every API request. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};

/**
 * Converts any HTTP error into a single user-readable toast and never lets
 * raw/technical detail reach the UI. Signs the user out on 401.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Something went wrong. Please try again.';

      if (err.status === 0) {
        message =
          'Cannot reach the server. Please check your connection and try again.';
      } else if (err.error?.message) {
        message = err.error.message;
      }

      // Append first field-level detail when present (still user-readable).
      const details: string[] | undefined = err.error?.details;
      if (details?.length) {
        message = details[0];
      }

      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }

      toast.error(message);
      return throwError(() => err);
    })
  );
};

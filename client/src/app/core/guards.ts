import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { Role } from './models';

/** Blocks routes for unauthenticated users. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

/**
 * Factory guard that restricts a route to specific roles.
 *   canActivate: [roleGuard(['admin'])]
 */
export function roleGuard(roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }
    if (roles.includes(auth.role() as Role)) return true;

    toast.error('You do not have permission to view that page.');
    router.navigate([auth.homeForRole(auth.role())]);
    return false;
  };
}

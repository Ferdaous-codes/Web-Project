import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService, Role } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;
  router.navigateByUrl('/login');
  return false;
};

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigateByUrl('/login');
    return false;
  }
  const role = auth.role();
  if (role && allowedRoles.includes(role)) return true;
  router.navigateByUrl('/');
  return false;
};

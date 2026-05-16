import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE } from './api.config';
import { ApiResponse, AuthUser, Role } from './models';

const TOKEN_KEY = 'wc_token';
const USER_KEY = 'wc_user';

interface LoginResponse extends ApiResponse {
  token: string;
  user: AuthUser;
}

/**
 * Holds the authenticated session. Token + user are persisted to
 * localStorage so a refresh keeps the user signed in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.readUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    // Trim stray whitespace (a very common copy/paste / autofill issue that
    // otherwise produces a confusing "Invalid email or password").
    email = email.trim();
    password = password.trim();
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this._user.set(res.user);
        })
      );
  }

  register(payload: Record<string, unknown>): Observable<ApiResponse> {
    // Keep trimming consistent with login() so a stray space at signup time
    // can never lock a user out of their own account.
    if (typeof payload['email'] === 'string') {
      payload = { ...payload, email: (payload['email'] as string).trim() };
    }
    if (typeof payload['password'] === 'string') {
      payload = { ...payload, password: (payload['password'] as string).trim() };
    }
    return this.http.post<ApiResponse>(`${API_BASE}/auth/register`, payload);
  }

  forgotPassword(email: string, newPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${API_BASE}/auth/forgot-password`, {
      email: email.trim(),
      newPassword: newPassword.trim(),
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  /** Default landing route for the current role. */
  homeForRole(role: Role | null): string {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'doctor':
        return '/doctor';
      case 'patient':
        return '/patient';
      default:
        return '/login';
    }
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { NavbarComponent } from './shared/navbar.component';
import { ToastContainerComponent } from './shared/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent],
  template: `
    @if (auth.isLoggedIn()) {
    <app-navbar />
    }
    <main [class.container]="auth.isLoggedIn()" [class.section-pad]="auth.isLoggedIn()">
      <router-outlet />
    </main>
    <app-toast-container />
  `,
})
export class AppComponent {
  auth = inject(AuthService);
}

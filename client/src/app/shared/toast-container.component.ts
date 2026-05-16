import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

/** Fixed, stacked, auto-dismissing notifications (top-right). */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="wc-toasts">
      @for (t of toast.toasts(); track t.id) {
      <div class="wc-toast" [class]="t.type" role="alert">
        <i
          class="bi"
          [class.bi-check-circle-fill]="t.type === 'success'"
          [class.bi-exclamation-triangle-fill]="t.type === 'error'"
          [class.bi-info-circle-fill]="t.type === 'info'"
        ></i>
        <span>{{ t.message }}</span>
        <button
          type="button"
          class="btn-close btn-close-sm ms-auto"
          aria-label="Dismiss"
          (click)="toast.dismiss(t.id)"
        ></button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .wc-toasts {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1080;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-width: 360px;
      }
      .wc-toast {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.8rem 1rem;
        border-radius: 12px;
        color: #fff;
        box-shadow: 0 10px 28px rgba(2, 6, 23, 0.25);
        animation: slidein 0.22s ease;
        font-size: 0.9rem;
      }
      .wc-toast.success { background: #16a34a; }
      .wc-toast.error { background: #dc2626; }
      .wc-toast.info { background: #2563eb; }
      .wc-toast .btn-close { filter: invert(1) grayscale(1); }
      @keyframes slidein {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `,
  ],
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}

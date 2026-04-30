import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastContainerComponent } from './shared/ui/toast-container.component';
import { ConfirmModalComponent } from './shared/ui/confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, ConfirmModalComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-confirm-modal />
  `
})
export class App {}

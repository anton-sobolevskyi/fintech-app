import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthActions } from './core/store/auth/auth.actions';
import { selectSessionChecking } from './core/store/auth/auth.selectors';

@Component({
  imports: [RouterOutlet, ProgressSpinnerModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  store = inject(Store);
  sessionChecking = this.store.selectSignal(selectSessionChecking);

  constructor() {
    this.store.dispatch(AuthActions.loadUser());
  }
}

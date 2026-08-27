import { AuthState } from './auth/auth.models';
import { UiState } from './ui/ui.models';

export interface CoreState {
  auth: AuthState;
  ui: UiState;
}

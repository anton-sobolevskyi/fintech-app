import { authReducer } from './auth/auth.reducer';
import { uiReducer } from './ui/ui.reducer';

export const coreReducer = {
  auth: authReducer,
  ui: uiReducer,
};

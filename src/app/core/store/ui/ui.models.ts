import { Language, Theme } from '../../models';

export interface UiState {
  theme: Theme;
  language: Language;
  sidebarOpened: boolean;
  globalLoading: boolean;
}

export const initialUiState: UiState = {
  theme: 'system',
  language: 'en',
  sidebarOpened: true,
  globalLoading: false,
};

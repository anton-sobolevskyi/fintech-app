import { Language, Theme } from '../../models';

export interface UiState {
  theme: Theme;
  language: Language;
  globalLoading: boolean;
}

export const initialUiState: UiState = {
  theme: 'system',
  language: 'en',
  globalLoading: false,
};

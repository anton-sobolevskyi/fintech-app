import { Locale, Theme } from "@core/models";

export interface UiState {
  theme: Theme;
  language: Locale;
  globalLoading: boolean;
}

export const initialUiState: UiState = {
  theme: 'system',
  language: 'en',
  globalLoading: false,
};

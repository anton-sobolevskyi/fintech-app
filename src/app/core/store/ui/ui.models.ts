export interface UiState {
  theme: 'light' | 'dark';
  sidebarOpened: boolean;
  globalLoading: boolean;
}

export const initialUiState: UiState = {
  theme: 'light',
  sidebarOpened: true,
  globalLoading: false,
};

import { createReducer, on } from '@ngrx/store';
import { UiActions } from './ui.actions';
import { initialUiState } from './ui.models';

export const uiReducer = createReducer(
  initialUiState,

  on(UiActions.setTheme, (state, { theme }) => ({
    ...state,
    theme,
  })),

  on(UiActions.setLanguage, (state, { language }) => ({
    ...state,
    language,
  })),

  on(UiActions.toggleSidebar, (state) => ({
    ...state,
    sidebarOpened: !state.sidebarOpened,
  })),

  on(UiActions.setSidebarOpened, (state, { opened }) => ({
    ...state,
    sidebarOpened: opened,
  })),

  on(UiActions.setGlobalLoading, (state, { loading }) => ({
    ...state,
    globalLoading: loading,
  })),
);

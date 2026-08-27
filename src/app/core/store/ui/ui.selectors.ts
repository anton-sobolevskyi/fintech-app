import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from './ui.models';

export const selectUiState = createFeatureSelector<UiState>('ui');

export const selectTheme = createSelector(selectUiState, (state) => state.theme);
export const selectSidebarOpened = createSelector(selectUiState, (state) => state.sidebarOpened);
export const selectGlobalLoading = createSelector(selectUiState, (state) => state.globalLoading);

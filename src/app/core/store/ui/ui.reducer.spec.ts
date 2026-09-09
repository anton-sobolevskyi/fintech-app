import { describe, expect, it } from 'vitest';
import { UiActions } from './ui.actions';
import { initialUiState } from './ui.models';
import { uiReducer } from './ui.reducer';

describe('uiReducer', () => {
  it('should return the initial state by default', () => {
    const state = uiReducer(undefined as never, { type: '@@INIT' } as never);
    expect(state).toEqual(initialUiState);
  });

  it('should handle setTheme', () => {
    const state = uiReducer(initialUiState, UiActions.setTheme({ theme: 'dark' }));
    expect(state.theme).toBe('dark');
  });

  it('should handle setLanguage', () => {
    const state = uiReducer(initialUiState, UiActions.setLanguage({ language: 'uk' }));
    expect(state.language).toBe('uk');
  });

  it('should handle preferencesLoaded', () => {
    const state = uiReducer(
      initialUiState,
      UiActions.preferencesLoaded({ theme: 'light', language: 'uk' }),
    );
    expect(state.theme).toBe('light');
    expect(state.language).toBe('uk');
  });

  it('should handle setGlobalLoading', () => {
    const state = uiReducer(initialUiState, UiActions.setGlobalLoading({ loading: true }));
    expect(state.globalLoading).toBe(true);
  });
});
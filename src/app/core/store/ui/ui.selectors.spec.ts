import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UiState, initialUiState } from './ui.models';
import { selectGlobalLoading, selectLanguage, selectTheme } from './ui.selectors';

function configureStore(ui: UiState) {
  TestBed.configureTestingModule({
    providers: [provideMockStore({ initialState: { ui } })],
  });
  return TestBed.inject(Store);
}

describe('ui.selectors', () => {
  it('should select the theme', async () => {
    const store = configureStore({ ...initialUiState, theme: 'dark' });
    expect(await firstValueFrom(store.select(selectTheme))).toBe('dark');
  });

  it('should select the language', async () => {
    const store = configureStore({ ...initialUiState, language: 'uk' });
    expect(await firstValueFrom(store.select(selectLanguage))).toBe('uk');
  });

  it('should select the global loading flag', async () => {
    const store = configureStore({ ...initialUiState, globalLoading: true });
    expect(await firstValueFrom(store.select(selectGlobalLoading))).toBe(true);
  });
});
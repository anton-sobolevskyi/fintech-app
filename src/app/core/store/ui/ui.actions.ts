import { createActionGroup, props } from '@ngrx/store';
import { Locale, Theme } from '../../models';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Theme': props<{ theme: Theme }>(),
    'Set Language': props<{ language: Locale }>(),
    'Set Global Loading': props<{ loading: boolean }>(),
  },
});

import { createActionGroup, props } from '@ngrx/store';
import { Language, Theme } from '../../models';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Theme': props<{ theme: Theme }>(),
    'Set Language': props<{ language: Language }>(),
    'Set Global Loading': props<{ loading: boolean }>(),
  },
});

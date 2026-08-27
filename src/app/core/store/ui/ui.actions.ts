import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Language, Theme } from '../../models';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Set Theme': props<{ theme: Theme }>(),
    'Set Language': props<{ language: Language }>(),
    'Toggle Sidebar': emptyProps(),
    'Set Sidebar Opened': props<{ opened: boolean }>(),
    'Set Global Loading': props<{ loading: boolean }>(),
  },
});

import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Toggle Theme': emptyProps(),
    'Set Theme': props<{ theme: 'light' | 'dark' }>(),
    'Toggle Sidebar': emptyProps(),
    'Set Sidebar Opened': props<{ opened: boolean }>(),
    'Set Global Loading': props<{ loading: boolean }>(),
  },
});

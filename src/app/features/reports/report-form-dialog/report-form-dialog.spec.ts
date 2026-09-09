import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportFormDialog } from './report-form-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { AccountService } from '@core/services/account.service';
import { of } from 'rxjs';

describe('ReportFormDialog', () => {
  let component: ReportFormDialog;
  let fixture: ComponentFixture<ReportFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFormDialog],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        { provide: AccountService, useValue: { getByUserId: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute account options after init loads accounts', () => {
    (
      component as unknown as { accounts: { set: (v: unknown[]) => void } }
    ).accounts.set([{ id: 'a1', name: 'Main', currency: 'USD' }]);
    expect(component.accountOptions()).toEqual([{ label: 'Main (USD)', value: 'a1' }]);
  });

  it('should emit visibleChange on hide', () => {
    const spy = vi.spyOn(component.visibleChange, 'emit');
    component.onHide();
    expect(spy).toHaveBeenCalledWith(false);
  });
});

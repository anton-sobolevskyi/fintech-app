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
});

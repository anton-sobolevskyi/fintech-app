import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountFormDialog } from './account-form-dialog';

describe('AccountFormDialog', () => {
  let component: AccountFormDialog;
  let fixture: ComponentFixture<AccountFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

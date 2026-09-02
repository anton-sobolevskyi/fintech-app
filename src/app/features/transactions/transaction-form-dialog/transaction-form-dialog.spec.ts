import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFormDialog } from './transaction-form-dialog';

describe('TransactionFormDialog', () => {
  let component: TransactionFormDialog;
  let fixture: ComponentFixture<TransactionFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

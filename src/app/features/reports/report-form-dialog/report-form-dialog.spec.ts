import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportFormDialog } from './report-form-dialog';

describe('ReportFormDialog', () => {
  let component: ReportFormDialog;
  let fixture: ComponentFixture<ReportFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

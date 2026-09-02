import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataSourceFormDialog } from './data-source-form-dialog';

describe('DataSourceFormDialog', () => {
  let component: DataSourceFormDialog;
  let fixture: ComponentFixture<DataSourceFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSourceFormDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(DataSourceFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reports } from './reports';
import { provideMockStore } from '@ngrx/store/testing';
import { initialAuthState } from '@core/store/auth/auth.models';
import { ReportService } from '@core/services/report.service';
import { of } from 'rxjs';

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideMockStore({ initialState: { auth: initialAuthState } }),
        {
          provide: ReportService,
          useValue: {
            queryByUser: () => of([]),
            create: () => of('id'),
            delete: () => of('id'),
            downloadReport: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

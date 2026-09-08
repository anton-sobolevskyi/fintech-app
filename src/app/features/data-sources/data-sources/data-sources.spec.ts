import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataSources } from './data-sources';
import { DataSourceService } from '@core/services/data-source.service';
import { of } from 'rxjs';

describe('DataSources', () => {
  let component: DataSources;
  let fixture: ComponentFixture<DataSources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataSources],
      providers: [
        {
          provide: DataSourceService,
          useValue: {
            querySources: () => of([]),
            create: () => of('id'),
            update: () => of(null),
            delete: () => of('id'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataSources);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

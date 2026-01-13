import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodoWidget } from './periodo-widget';

describe('PeriodoWidget', () => {
  let component: PeriodoWidget;
  let fixture: ComponentFixture<PeriodoWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodoWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PeriodoWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MateriaAlertsWidget } from './materia-alerts-widget';

describe('MateriaAlertsWidget', () => {
  let component: MateriaAlertsWidget;
  let fixture: ComponentFixture<MateriaAlertsWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriaAlertsWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MateriaAlertsWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

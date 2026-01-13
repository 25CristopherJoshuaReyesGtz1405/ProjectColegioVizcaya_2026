import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelLateralDocente } from './panel-lateral-docente';

describe('PanelLateralDocente', () => {
  let component: PanelLateralDocente;
  let fixture: ComponentFixture<PanelLateralDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelLateralDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelLateralDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

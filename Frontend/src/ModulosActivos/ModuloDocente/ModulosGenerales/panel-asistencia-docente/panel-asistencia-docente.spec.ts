import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelAsistenciaDocente } from './panel-asistencia-docente';

describe('PanelAsistenciaDocente', () => {
  let component: PanelAsistenciaDocente;
  let fixture: ComponentFixture<PanelAsistenciaDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelAsistenciaDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelAsistenciaDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

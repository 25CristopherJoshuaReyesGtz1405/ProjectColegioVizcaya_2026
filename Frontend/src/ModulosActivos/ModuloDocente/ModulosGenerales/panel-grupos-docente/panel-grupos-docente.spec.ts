import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelGruposDocente } from './panel-grupos-docente';

describe('PanelGruposDocente', () => {
  let component: PanelGruposDocente;
  let fixture: ComponentFixture<PanelGruposDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelGruposDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelGruposDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

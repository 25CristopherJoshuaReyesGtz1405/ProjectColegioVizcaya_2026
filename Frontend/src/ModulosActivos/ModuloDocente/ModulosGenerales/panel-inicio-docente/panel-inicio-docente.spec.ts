import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelInicioDocente } from './panel-inicio-docente';

describe('PanelInicioDocente', () => {
  let component: PanelInicioDocente;
  let fixture: ComponentFixture<PanelInicioDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelInicioDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelInicioDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEstudianteNuevo } from './modal-estudiante-nuevo';

describe('ModalEstudianteNuevo', () => {
  let component: ModalEstudianteNuevo;
  let fixture: ComponentFixture<ModalEstudianteNuevo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEstudianteNuevo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEstudianteNuevo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEstudianteActualizar } from './modal-estudiante-actualizar';

describe('ModalEstudianteActualizar', () => {
  let component: ModalEstudianteActualizar;
  let fixture: ComponentFixture<ModalEstudianteActualizar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEstudianteActualizar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEstudianteActualizar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

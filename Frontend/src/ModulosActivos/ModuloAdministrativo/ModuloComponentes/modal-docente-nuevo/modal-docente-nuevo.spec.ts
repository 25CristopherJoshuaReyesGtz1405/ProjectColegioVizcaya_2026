import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDocenteNuevo } from './modal-docente-nuevo';

describe('ModalDocenteNuevo', () => {
  let component: ModalDocenteNuevo;
  let fixture: ComponentFixture<ModalDocenteNuevo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDocenteNuevo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDocenteNuevo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

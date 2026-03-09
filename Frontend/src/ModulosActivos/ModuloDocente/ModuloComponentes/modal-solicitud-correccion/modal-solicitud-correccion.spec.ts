import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSolicitudCorreccion } from './modal-solicitud-correccion';

describe('ModalSolicitudCorreccion', () => {
  let component: ModalSolicitudCorreccion;
  let fixture: ComponentFixture<ModalSolicitudCorreccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSolicitudCorreccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalSolicitudCorreccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

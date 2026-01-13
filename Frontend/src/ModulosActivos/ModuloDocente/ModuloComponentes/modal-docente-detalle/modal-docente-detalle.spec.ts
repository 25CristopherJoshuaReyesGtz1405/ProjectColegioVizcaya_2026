import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDocenteDetalle } from './modal-docente-detalle';

describe('ModalDocenteDetalle', () => {
  let component: ModalDocenteDetalle;
  let fixture: ComponentFixture<ModalDocenteDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDocenteDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDocenteDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

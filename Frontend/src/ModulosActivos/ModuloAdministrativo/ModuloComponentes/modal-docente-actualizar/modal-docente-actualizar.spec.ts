import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDocenteActualizar } from './modal-docente-actualizar';

describe('ModalDocenteActualizar', () => {
  let component: ModalDocenteActualizar;
  let fixture: ComponentFixture<ModalDocenteActualizar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDocenteActualizar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDocenteActualizar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

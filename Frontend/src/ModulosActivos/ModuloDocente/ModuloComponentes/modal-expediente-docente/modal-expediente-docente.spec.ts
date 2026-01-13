import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalExpedienteDocente } from './modal-expediente-docente';

describe('ModalExpedienteDocente', () => {
  let component: ModalExpedienteDocente;
  let fixture: ComponentFixture<ModalExpedienteDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalExpedienteDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalExpedienteDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

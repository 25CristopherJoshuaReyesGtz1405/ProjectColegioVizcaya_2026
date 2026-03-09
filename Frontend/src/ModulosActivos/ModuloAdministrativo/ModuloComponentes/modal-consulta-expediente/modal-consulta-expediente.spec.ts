import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConsultaExpediente } from './modal-consulta-expediente';

describe('ModalConsultaExpediente', () => {
  let component: ModalConsultaExpediente;
  let fixture: ComponentFixture<ModalConsultaExpediente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConsultaExpediente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConsultaExpediente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

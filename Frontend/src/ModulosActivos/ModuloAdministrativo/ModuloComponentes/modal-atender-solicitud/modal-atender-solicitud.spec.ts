import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAtenderSolicitud } from './modal-atender-solicitud';

describe('ModalAtenderSolicitud', () => {
  let component: ModalAtenderSolicitud;
  let fixture: ComponentFixture<ModalAtenderSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAtenderSolicitud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAtenderSolicitud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

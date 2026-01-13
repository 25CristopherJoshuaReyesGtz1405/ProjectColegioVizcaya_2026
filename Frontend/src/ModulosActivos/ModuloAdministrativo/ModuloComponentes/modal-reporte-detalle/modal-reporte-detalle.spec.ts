import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalReporteDetalle } from './modal-reporte-detalle';

describe('ModalReporteDetalle', () => {
  let component: ModalReporteDetalle;
  let fixture: ComponentFixture<ModalReporteDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalReporteDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalReporteDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

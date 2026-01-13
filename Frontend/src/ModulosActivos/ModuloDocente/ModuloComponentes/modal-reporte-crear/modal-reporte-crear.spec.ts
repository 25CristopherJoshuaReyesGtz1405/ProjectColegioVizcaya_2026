import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalReporteCrear } from './modal-reporte-crear';

describe('ModalReporteCrear', () => {
  let component: ModalReporteCrear;
  let fixture: ComponentFixture<ModalReporteCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalReporteCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalReporteCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

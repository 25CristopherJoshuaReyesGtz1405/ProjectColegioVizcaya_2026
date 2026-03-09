import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfiguracion } from './modal-configuracion';

describe('ModalConfiguracion', () => {
  let component: ModalConfiguracion;
  let fixture: ComponentFixture<ModalConfiguracion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfiguracion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConfiguracion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEvaluacionCrear } from './modal-evaluacion-crear';

describe('ModalEvaluacionCrear', () => {
  let component: ModalEvaluacionCrear;
  let fixture: ComponentFixture<ModalEvaluacionCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEvaluacionCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalEvaluacionCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGestionRublos } from './modal-gestion-rublos';

describe('ModalGestionRublos', () => {
  let component: ModalGestionRublos;
  let fixture: ComponentFixture<ModalGestionRublos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionRublos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGestionRublos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGestionPeriodos } from './modal-gestion-periodos';

describe('ModalGestionPeriodos', () => {
  let component: ModalGestionPeriodos;
  let fixture: ComponentFixture<ModalGestionPeriodos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGestionPeriodos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGestionPeriodos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

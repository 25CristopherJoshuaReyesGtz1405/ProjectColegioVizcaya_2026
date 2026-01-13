import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMateria } from './modal-materia';

describe('ModalMateria', () => {
  let component: ModalMateria;
  let fixture: ComponentFixture<ModalMateria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalMateria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalMateria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

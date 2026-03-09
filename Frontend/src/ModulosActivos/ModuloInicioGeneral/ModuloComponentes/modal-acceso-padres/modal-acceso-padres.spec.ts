import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAccesoPadres } from './modal-acceso-padres';

describe('ModalAccesoPadres', () => {
  let component: ModalAccesoPadres;
  let fixture: ComponentFixture<ModalAccesoPadres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAccesoPadres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAccesoPadres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

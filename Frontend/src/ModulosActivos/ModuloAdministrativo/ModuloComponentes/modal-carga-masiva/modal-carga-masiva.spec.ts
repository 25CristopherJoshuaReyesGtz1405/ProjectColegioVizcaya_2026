import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCargaMasiva } from './modal-carga-masiva';

describe('ModalCargaMasiva', () => {
  let component: ModalCargaMasiva;
  let fixture: ComponentFixture<ModalCargaMasiva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCargaMasiva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCargaMasiva);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

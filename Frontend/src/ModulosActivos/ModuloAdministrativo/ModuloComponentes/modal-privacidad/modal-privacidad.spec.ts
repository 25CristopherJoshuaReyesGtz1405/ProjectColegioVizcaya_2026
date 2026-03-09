import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPrivacidad } from './modal-privacidad';

describe('ModalPrivacidad', () => {
  let component: ModalPrivacidad;
  let fixture: ComponentFixture<ModalPrivacidad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPrivacidad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPrivacidad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

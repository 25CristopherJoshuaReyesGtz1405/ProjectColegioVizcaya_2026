import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalKardex } from './modal-kardex';

describe('ModalKardex', () => {
  let component: ModalKardex;
  let fixture: ComponentFixture<ModalKardex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalKardex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalKardex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

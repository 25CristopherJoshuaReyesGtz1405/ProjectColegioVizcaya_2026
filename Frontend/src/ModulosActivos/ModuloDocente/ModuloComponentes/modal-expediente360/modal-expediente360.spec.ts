import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalExpediente360 } from './modal-expediente360';

describe('ModalExpediente360', () => {
  let component: ModalExpediente360;
  let fixture: ComponentFixture<ModalExpediente360>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalExpediente360]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalExpediente360);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

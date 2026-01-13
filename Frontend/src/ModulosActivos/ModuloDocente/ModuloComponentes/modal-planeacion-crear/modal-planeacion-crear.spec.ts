import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPlaneacionCrear } from './modal-planeacion-crear';

describe('ModalPlaneacionCrear', () => {
  let component: ModalPlaneacionCrear;
  let fixture: ComponentFixture<ModalPlaneacionCrear>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPlaneacionCrear]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalPlaneacionCrear);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

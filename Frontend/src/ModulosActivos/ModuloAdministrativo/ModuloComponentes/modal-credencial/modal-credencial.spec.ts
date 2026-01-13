import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCredencial } from './modal-credencial';

describe('ModalCredencial', () => {
  let component: ModalCredencial;
  let fixture: ComponentFixture<ModalCredencial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCredencial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCredencial);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

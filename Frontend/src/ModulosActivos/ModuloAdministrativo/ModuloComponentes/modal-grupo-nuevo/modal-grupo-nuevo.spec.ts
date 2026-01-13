import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGrupoNuevo } from './modal-grupo-nuevo';

describe('ModalGrupoNuevo', () => {
  let component: ModalGrupoNuevo;
  let fixture: ComponentFixture<ModalGrupoNuevo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGrupoNuevo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGrupoNuevo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

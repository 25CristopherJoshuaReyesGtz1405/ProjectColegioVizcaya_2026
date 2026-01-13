import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalGrupoGestion } from './modal-grupo-gestion';

describe('ModalGrupoGestion', () => {
  let component: ModalGrupoGestion;
  let fixture: ComponentFixture<ModalGrupoGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalGrupoGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalGrupoGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

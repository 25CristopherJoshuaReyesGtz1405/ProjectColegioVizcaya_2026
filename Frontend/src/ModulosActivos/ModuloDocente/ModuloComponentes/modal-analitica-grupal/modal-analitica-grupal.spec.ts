import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAnaliticaGrupal } from './modal-analitica-grupal';

describe('ModalAnaliticaGrupal', () => {
  let component: ModalAnaliticaGrupal;
  let fixture: ComponentFixture<ModalAnaliticaGrupal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAnaliticaGrupal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAnaliticaGrupal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

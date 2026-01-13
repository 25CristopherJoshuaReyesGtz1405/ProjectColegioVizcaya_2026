import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelSuperiorDocente } from './panel-superior-docente';

describe('PanelSuperiorDocente', () => {
  let component: PanelSuperiorDocente;
  let fixture: ComponentFixture<PanelSuperiorDocente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelSuperiorDocente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelSuperiorDocente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

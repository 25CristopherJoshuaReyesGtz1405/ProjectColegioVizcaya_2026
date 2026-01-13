import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelMaterias } from './panel-materias';

describe('PanelMaterias', () => {
  let component: PanelMaterias;
  let fixture: ComponentFixture<PanelMaterias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelMaterias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelMaterias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

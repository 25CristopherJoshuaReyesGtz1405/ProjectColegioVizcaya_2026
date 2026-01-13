import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelGrupos } from './panel-grupos';

describe('PanelGrupos', () => {
  let component: PanelGrupos;
  let fixture: ComponentFixture<PanelGrupos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelGrupos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelGrupos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

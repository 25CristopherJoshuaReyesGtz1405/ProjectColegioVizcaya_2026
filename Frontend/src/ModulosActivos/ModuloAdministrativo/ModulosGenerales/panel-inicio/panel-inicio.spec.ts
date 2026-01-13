import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelInicio } from './panel-inicio';

describe('PanelInicio', () => {
  let component: PanelInicio;
  let fixture: ComponentFixture<PanelInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelInicio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelInicio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

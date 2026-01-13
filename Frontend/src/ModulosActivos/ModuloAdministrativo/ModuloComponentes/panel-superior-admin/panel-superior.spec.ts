import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelSuperior } from './panel-superior';

describe('PanelSuperior', () => {
  let component: PanelSuperior;
  let fixture: ComponentFixture<PanelSuperior>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelSuperior]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelSuperior);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

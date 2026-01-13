import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelCalifcaciones } from './panel-califcaciones';

describe('PanelCalifcaciones', () => {
  let component: PanelCalifcaciones;
  let fixture: ComponentFixture<PanelCalifcaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelCalifcaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelCalifcaciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

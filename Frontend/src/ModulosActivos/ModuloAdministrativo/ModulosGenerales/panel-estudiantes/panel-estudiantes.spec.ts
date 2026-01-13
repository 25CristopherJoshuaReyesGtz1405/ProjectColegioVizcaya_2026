import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelEstudiantes } from './panel-estudiantes';

describe('PanelEstudiantes', () => {
  let component: PanelEstudiantes;
  let fixture: ComponentFixture<PanelEstudiantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelEstudiantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelEstudiantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

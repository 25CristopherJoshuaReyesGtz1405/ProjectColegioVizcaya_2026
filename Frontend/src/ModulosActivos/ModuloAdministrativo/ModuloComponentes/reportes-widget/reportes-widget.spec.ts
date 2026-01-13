import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesWidget } from './reportes-widget';

describe('ReportesWidget', () => {
  let component: ReportesWidget;
  let fixture: ComponentFixture<ReportesWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

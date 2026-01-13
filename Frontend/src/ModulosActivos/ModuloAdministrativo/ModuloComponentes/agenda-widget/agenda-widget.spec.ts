import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaWidget } from './agenda-widget';

describe('AgendaWidget', () => {
  let component: AgendaWidget;
  let fixture: ComponentFixture<AgendaWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

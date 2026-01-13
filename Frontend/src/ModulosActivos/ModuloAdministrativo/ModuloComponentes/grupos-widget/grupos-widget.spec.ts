import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GruposWidget } from './grupos-widget';

describe('GruposWidget', () => {
  let component: GruposWidget;
  let fixture: ComponentFixture<GruposWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GruposWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MateriasWidget } from './materias-widget';

describe('MateriasWidget', () => {
  let component: MateriasWidget;
  let fixture: ComponentFixture<MateriasWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriasWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MateriasWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudianteCard } from './estudiante-card';

describe('EstudianteCard', () => {
  let component: EstudianteCard;
  let fixture: ComponentFixture<EstudianteCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudianteCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudianteCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

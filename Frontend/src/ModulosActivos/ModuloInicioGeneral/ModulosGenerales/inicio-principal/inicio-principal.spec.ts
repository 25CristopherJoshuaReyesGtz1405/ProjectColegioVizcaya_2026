import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioPrincipal } from './inicio-principal';

describe('InicioPrincipal', () => {
  let component: InicioPrincipal;
  let fixture: ComponentFixture<InicioPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioPrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

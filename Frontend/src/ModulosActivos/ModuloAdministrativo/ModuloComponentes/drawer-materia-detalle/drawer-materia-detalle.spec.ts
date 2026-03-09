import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawerMateriaDetalle } from './drawer-materia-detalle';

describe('DrawerMateriaDetalle', () => {
  let component: DrawerMateriaDetalle;
  let fixture: ComponentFixture<DrawerMateriaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerMateriaDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawerMateriaDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

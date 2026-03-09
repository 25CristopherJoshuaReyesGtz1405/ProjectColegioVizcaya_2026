import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawerGrupoDetalle } from './drawer-grupo-detalle';

describe('DrawerGrupoDetalle', () => {
  let component: DrawerGrupoDetalle;
  let fixture: ComponentFixture<DrawerGrupoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerGrupoDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawerGrupoDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaOscuro {
    private renderer: Renderer2;
  private currentTheme: 'light' | 'dark' = 'light';

  constructor(rendererFactory: RendererFactory2) 
  {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Carga el tema guardado en localStorage o usa el tema claro por defecto.
   * Se debe llamar al iniciar la aplicación.
   */
  initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light');
    }
  }

  /**
   * Cambia entre el tema claro y oscuro.
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Aplica el tema seleccionado al body y lo guarda en localStorage.
   * @param theme El tema a aplicar ('light' o 'dark')
   */
  private setTheme(theme: 'light' | 'dark'): void {
    const oldTheme = this.currentTheme;
    this.currentTheme = theme;

    // Guarda la elección del usuario para futuras visitas
    localStorage.setItem('theme', theme);

    // Añade la nueva clase de tema al body y elimina la anterior
    this.renderer.removeClass(document.body, `${oldTheme}-theme`);
    this.renderer.addClass(document.body, `${theme}-theme`);
  }

  /**
  * Devuelve el tema actual para que los componentes puedan reaccionar a él.
  */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
}
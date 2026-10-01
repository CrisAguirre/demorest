import { Component } from '@angular/core';

@Component({
  selector: 'app-documentacion',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">📚 Documentación</h1>
          <p class="page-subtitle">Manuales, procesos y documentos del restaurante</p>
        </div>
      </div>
      <div class="card">
        <div class="empty-state">
          <span style="font-size:2.5rem">🚧</span>
          <p><strong>En proceso de desarrollo</strong></p>
          <p>Aquí vivirá la documentación operativa de La Soupe.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .empty-state p { margin: 0.5rem 0; }
  `]
})
export class DocumentacionComponent {}

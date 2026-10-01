import { Component } from '@angular/core';

@Component({
  selector: 'app-sg-sst',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">🦺 SG-SST</h1>
          <p class="page-subtitle">Sistema de Gestión de Seguridad y Salud en el Trabajo</p>
        </div>
      </div>
      <div class="card">
        <div class="empty-state">
          <span style="font-size:2.5rem">🚧</span>
          <p><strong>En proceso de desarrollo</strong></p>
          <p>Aquí vivirá la gestión de seguridad y salud en el trabajo.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 4rem 1rem; color: var(--text-muted); }
    .empty-state p { margin: 0.5rem 0; }
  `]
})
export class SgSstComponent {}

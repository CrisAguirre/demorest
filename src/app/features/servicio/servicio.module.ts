import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ServicioComponent } from './servicio.component';

@NgModule({
  declarations: [ServicioComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: ServicioComponent }])]
})
export class ServicioModule {}

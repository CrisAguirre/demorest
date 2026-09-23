import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BarraComponent } from './barra.component';

@NgModule({
  declarations: [BarraComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: BarraComponent }])]
})
export class BarraModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MesasComponent } from './mesas.component';

@NgModule({
  declarations: [MesasComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: MesasComponent }])]
})
export class MesasModule {}

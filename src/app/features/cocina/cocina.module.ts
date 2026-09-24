import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CocinaComponent } from './cocina.component';

@NgModule({
  declarations: [CocinaComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild([{ path: '', component: CocinaComponent }])]
})
export class CocinaModule {}

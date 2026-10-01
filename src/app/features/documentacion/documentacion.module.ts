import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentacionComponent } from './documentacion.component';

@NgModule({
  declarations: [DocumentacionComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: DocumentacionComponent }])]
})
export class DocumentacionModule {}

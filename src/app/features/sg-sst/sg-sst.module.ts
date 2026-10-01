import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SgSstComponent } from './sg-sst.component';

@NgModule({
  declarations: [SgSstComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: SgSstComponent }])]
})
export class SgSstModule {}

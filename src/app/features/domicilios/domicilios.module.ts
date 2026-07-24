import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomiciliosRoutingModule } from './domicilios-routing.module';
import { DomiciliosComponent } from './domicilios.component';

@NgModule({
  declarations: [DomiciliosComponent],
  imports: [CommonModule, FormsModule, DomiciliosRoutingModule]
})
export class DomiciliosModule { }
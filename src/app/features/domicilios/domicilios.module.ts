import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomiciliosRoutingModule } from './domicilios-routing.module';
import { DomiciliosComponent } from './domicilios.component';

@NgModule({
  declarations: [DomiciliosComponent],
  imports: [CommonModule, DomiciliosRoutingModule]
})
export class DomiciliosModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DishesRoutingModule } from './dishes-routing.module';
import { DishesComponent } from './dishes.component';

@NgModule({
  declarations: [
    DishesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DishesRoutingModule
  ]
})
export class DishesModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DishesRoutingModule } from './dishes-routing.module';
import { DishesComponent } from './dishes.component';


@NgModule({
  declarations: [
    DishesComponent
  ],
  imports: [
    CommonModule,
    DishesRoutingModule
  ]
})
export class DishesModule { }

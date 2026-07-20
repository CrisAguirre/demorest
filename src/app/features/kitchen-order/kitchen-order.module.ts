import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KitchenOrderComponent } from './kitchen-order.component';

@NgModule({
  declarations: [KitchenOrderComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: KitchenOrderComponent }])
  ]
})
export class KitchenOrderModule {}

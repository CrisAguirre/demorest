import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StaffRoutingModule } from './staff-routing.module';
import { StaffComponent } from './staff.component';

@NgModule({
  declarations: [
    StaffComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    StaffRoutingModule
  ]
})
export class StaffModule { }

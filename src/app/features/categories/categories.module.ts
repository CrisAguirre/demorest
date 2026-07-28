import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoriesComponent } from './categories.component';

@NgModule({
  declarations: [CategoriesComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: CategoriesComponent }])
  ]
})
export class CategoriesModule { }

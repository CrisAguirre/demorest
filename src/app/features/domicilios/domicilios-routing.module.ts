import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DomiciliosComponent } from './domicilios.component';

const routes: Routes = [{ path: '', component: DomiciliosComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DomiciliosRoutingModule { }

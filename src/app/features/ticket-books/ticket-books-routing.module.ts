import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TicketBooksComponent } from './ticket-books.component';

const routes: Routes = [{ path: '', component: TicketBooksComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TicketBooksRoutingModule { }

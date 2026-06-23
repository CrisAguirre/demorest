import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TicketBooksRoutingModule } from './ticket-books-routing.module';
import { TicketBooksComponent } from './ticket-books.component';


@NgModule({
  declarations: [
    TicketBooksComponent
  ],
  imports: [
    CommonModule,
    TicketBooksRoutingModule
  ]
})
export class TicketBooksModule { }

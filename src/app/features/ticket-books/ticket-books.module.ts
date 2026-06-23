import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TicketBooksRoutingModule } from './ticket-books-routing.module';
import { TicketBooksComponent } from './ticket-books.component';

@NgModule({
  declarations: [
    TicketBooksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TicketBooksRoutingModule
  ]
})
export class TicketBooksModule { }

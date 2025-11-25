import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessagesComponent } from './components/messages/messages.component';
import { FormsModule } from '@angular/forms';
import { MessageRoutingModule } from '../routing/message-routing.module';



@NgModule({
  declarations: [
    MessagesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MessageRoutingModule
  ]
})
export class MessagesModule { }

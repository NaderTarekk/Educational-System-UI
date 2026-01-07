import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentsComponent } from './components/payments/payments.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaymentRoutingModule } from '../routing/payment-routing.module';



@NgModule({
  declarations: [
    PaymentsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PaymentRoutingModule,
    ReactiveFormsModule
  ]
})
export class PaymentsModule { }

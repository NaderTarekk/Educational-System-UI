import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { ExpenseRoutingModule } from '../routing/expense-routing.module';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    ExpensesComponent
  ],
  imports: [
    CommonModule,
    ExpenseRoutingModule,
    FormsModule
  ]
})
export class ExpensesModule { }

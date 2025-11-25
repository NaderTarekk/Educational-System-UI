import { Component, OnInit } from '@angular/core';
import { map, of } from 'rxjs';
import { SharedService } from '../../../shared/services/shared';

@Component({
  selector: 'app-main-component',
  standalone: false,
  templateUrl: './main-component.html',
  styleUrl: './main-component.scss',
})
export class MainComponent  {

  isDialogOpen = false;

  openDialog() {
    this.isDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDialog() {
    this.isDialogOpen = false;
    document.body.style.overflow = 'auto';
  }

  saveStudent() {
    console.log('Student saved!');
    this.closeDialog();
  }

  // For floating labels
  checkValue(event: Event) {
    const input = event.target as HTMLInputElement;
    const wrapper = input.closest('.input-wrapper');
    if (input.value.trim() !== '') {
      wrapper?.classList.add('has-value');
    } else {
      wrapper?.classList.remove('has-value');
    }
  }

  // Close on outside click
  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.closeDialog();
    }
  }
}
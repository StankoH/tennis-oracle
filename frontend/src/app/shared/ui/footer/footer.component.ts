import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  showAbout = false;
  showContact = false;

  openAboutModal() {
    this.showAbout = true;
  }

  openContactModal() {
    this.showContact = true;
  }

  closeModal() {
    this.showAbout = false;
    this.showContact = false;
  }
}

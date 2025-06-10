import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { User } from './core/models/user.model';
import { AuthService } from './core/services/auth.service';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { HeaderComponent } from './shared/ui/header/header.component';
import { UserModalComponent } from "./user/user-modal/user-modal.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, RouterOutlet, RouterModule, UserModalComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router, private modalService: NgbModal) {
    console.log("✅ AppComponent je aktivan!");
    this.router.events.subscribe(event => {
      console.log('📦 Router event:', event);
    });
  }
  @ViewChild('aboutUsModal') aboutUsModal!: TemplateRef<unknown>;
  @ViewChild('contactUsModal') contactUsModal!: TemplateRef<unknown>;
  showUserModal = false;
  showMatchFilterModal = false;
  user: User | null = null;

  ngOnInit(): void {
    this.authService.initAuth();
  }

  onOpenUserModal() {
    this.showUserModal = true;
  }

  onUserUpdated(updatedUser: User) {
    this.user = updatedUser;
  }

  openMatchFilterModal(): void {
    this.showMatchFilterModal = true;
  }

  closeMatchFilterModal(): void {
    this.showMatchFilterModal = false;
  }

  openAboutModal() {
    this.modalService.open(this.aboutUsModal);
  }

  openContactModal() {
    this.modalService.open(this.contactUsModal, { centered: true });
  }
}
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoginComponent } from '../../../auth/login/login.component';
import { RegisterComponent } from '../../../auth/register/register.component';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserModalComponent } from '../../../user/user-modal/user-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  imports: [CommonModule, RegisterComponent, LoginComponent, UserModalComponent, RouterModule, RouterLink, NgbModalModule, TranslateModule],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();
  @Output() userModalOpened = new EventEmitter<void>();
  
  isLoggedIn = false;
  authSub!: Subscription;
  showRegisterModal = false;
  showLoginModal = false;
  user: User | null = null;
  showUserModal = false;
  userNickname = '';
  userDisplayName = '';

  private switchToRegisterHandler = () => {
    this.closeLoginModal();
    this.openRegisterModal();
    this.openUserModal();
  };

  constructor(private authService: AuthService, private router: Router, private modalService: NgbModal) {
  }

  ngOnInit(): void {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      if (event.url === '/login') this.openLoginModal();
      if (event.url === '/register') this.openRegisterModal();
    });
    this.authSub = this.authService.authStatus$.subscribe(status => {
      console.log('🔥 authStatus$ iz modala:', status);
      this.isLoggedIn = status;
      if (status) {
        this.user = this.authService.getUser();
        this.userNickname = this.user?.nickname || '';
        this.userDisplayName = this.user?.nickname || this.user?.name || 'User';
      } else {
        this.user = null;
      }
      if (status) {
        this.user = this.authService.getUser();
      } else {
        this.user = null;
      }
    });
    this.authService.user$.subscribe(user => {
        this.user = user;
        this.userDisplayName = user?.nickname || user?.name || 'User';
    });

    window.addEventListener('switchToRegister', this.switchToRegisterHandler);
  }

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
    window.addEventListener('switchToRegister', this.switchToRegisterHandler);
  }

  openLoginModal(): void {
    console.log('🟢 Login modal otvoren');
    this.showLoginModal = true;
  }

  closeLoginModal(): void {
    this.showLoginModal = false;
  }

  openRegisterModal(): void {
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
  }

  logout(): void {
    this.authService.logout();
  }

  openUserModal() {
    this.userModalOpened.emit();
  }

  closeUserModal() {
    this.showUserModal = false;
  }
}
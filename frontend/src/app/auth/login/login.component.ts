import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AccessibleClickDirective } from '../../shared/directives/accessible-click.directive';
import { TrapFocusDirective } from '../../shared/directives/trap-focus.directive';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule, ResetPasswordComponent, TrapFocusDirective, AccessibleClickDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', Validators.required], // samo required, bez email validacije
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    console.log("✅ LoginComponent inicijaliziran!");
  }

  submitted = false;
  showPassword = false;
  successMessage = '';
  errorMessage = '';
  showResend = false;
  unverifiedUserId = '';
  showRegisterSuggestion = false;
  loginFailed = false;
  hide = true;
  showResetPasswordModal = false;

  onLogin() {
    this.submitted = true;

    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login response:', res); 
        localStorage.setItem('token', res.token);
        this.snackBar.open('Successful login', '', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
        });
        this.loginFailed = false;
        this.router.navigate(['/']);
        this.authService.setAuthState(true);
        this.authService.setUser(res.user);
        this.close();
      },
      error: (err) => {
        if (err.status === 403) {
          this.errorMessage = `Your account (${this.loginForm.value.email}) is not confirmed`;
          this.unverifiedUserId = err.error.userId;
          this.showResend = true;
          this.snackBar.open(`Your account (${this.loginForm.value.email}) is not confirmed`, '', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: 'error-snackbar'
          });
        } else if (err.status === 401) {
          this.loginFailed = true;
          this.showRegisterSuggestion = true;
          this.snackBar.open('Incorrect password', '', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: 'error-snackbar'
          });
        } else if (err.status === 404) {
          this.errorMessage = 'The user does not exist';
          this.showRegisterSuggestion = true;
          this.snackBar.open('The user does not exist', '', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
            panelClass: 'error-snackbar'
          });
        } else {
          this.errorMessage = 'Incorrect data';
          this.showResend = false;
          this.showRegisterSuggestion = false;
        }
      }
    });
  }

  get identifier() {
    return this.loginForm.get('identifier');
  }

  get password() {
    return this.loginForm.get('password');
  }

  close() {
    console.log('🔥 zatvaram modal');
    this.closed.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  loginWithFacebook() {
    this.authService.loginWithFacebook();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  get f() {
    return this.loginForm.controls;
  }

  switchToRegister(): void {
    this.close(); // zatvori login modal
    // sad javi roditelju da treba otvoriti register modal
    const event = new CustomEvent('switchToRegister');
    window.dispatchEvent(event); // globalni event
  }

  resendVerification() {
    //console.log("slanje verifikacijskog linka sa frontenda");
    const email = this.loginForm.value.identifier;
    if (!email) {
      this.snackBar.open('Email not entered', '', { duration: 3000 });
      return;
    }

    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.snackBar.open('Verification email sent', '', { 
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
         });
        this.showResend = false;
        this.close();
      },
      error: () => {
        this.snackBar.open(this.errorMessage, '', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  onCloseResetModal() {
    this.showResetPasswordModal = false;
  }

  openForgotPasswordModal() {
    const email = this.loginForm.value.identifier;
    alert(email);
    if (!email) {
      this.snackBar.open('Enter your email to reset your password', '', { duration: 3000 });
      return;
    }
  
    this.authService.sendResetPasswordEmail(email).subscribe({
      next: () => {
        this.snackBar.open('Reset link sent to your email', '', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
        });
      },
      error: () => {
        this.snackBar.open('Error sending reset link', '', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'error-snackbar'
        });
      }
    });
  }
}
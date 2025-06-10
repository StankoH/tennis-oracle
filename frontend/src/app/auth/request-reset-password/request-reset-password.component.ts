import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AccessibleClickDirective } from '../../shared/directives/accessible-click.directive';
import { TrapFocusDirective } from '../../shared/directives/trap-focus.directive';

@Component({
  selector: 'app-request-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, AccessibleClickDirective, TrapFocusDirective],
  templateUrl: './request-reset-password.component.html',
  styleUrls: ['./request-reset-password.component.scss']
})
export class RequestResetPasswordComponent {
  emailForm: FormGroup;
  submitted = false;

  close() {
    this.router.navigate(['/login']); // ili samo [''] ili gdje želiš
  }
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  requestReset() {
    this.submitted = true;

    if (this.emailForm.invalid) return;

    const { email } = this.emailForm.value;

    this.http.post('/request-password-reset', { email }).subscribe({
      next: () => {
        this.snackBar.open('Link za reset lozinke je poslan na email!', '', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
        });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Nešto je pošlo po zlu.', '', {
          duration: 4000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }
}
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExtractErrorMessage } from '../../core/utils/error.utils';
import { AccessibleClickDirective } from '../../shared/directives/accessible-click.directive';
import { TrapFocusDirective } from '../../shared/directives/trap-focus.directive';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  imports: [ReactiveFormsModule, CommonModule, TrapFocusDirective, AccessibleClickDirective],
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  resetForm!: FormGroup;
  token!: string;
  email!: string;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    this.resetForm = this.fb.group({
      email: [this.email || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;
  
    const { email, password, confirmPassword } = this.resetForm.value;
  
    if (password !== confirmPassword) {
      this.errorMessage = 'The passwords do not match';
      return;
    }
  
    this.authService.resetPassword(this.token, email, password).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: unknown) => {
        this.errorMessage = ExtractErrorMessage(error);
      }
    });
  }  

  close() {
    this.closed.emit();
  }
}

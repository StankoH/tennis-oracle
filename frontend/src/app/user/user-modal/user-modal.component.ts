import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { AccessibleClickDirective } from '../../shared/directives/accessible-click.directive';
import { TrapFocusDirective } from '../../shared/directives/trap-focus.directive';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, TrapFocusDirective, AccessibleClickDirective],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserModalComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  userForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  successMessage = '';
  errorMessage = '';
  submitted = false;

  currentUser!: User;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser()!;

    this.userForm = this.fb.group({
      email: [{ value: this.currentUser.email || '', disabled: true }],
      nickname: [this.currentUser.nickname || '']
    });

    // Opcionalno: set default avatar preview ako postoji
    if (this.currentUser.avatarUrl) {
      this.previewUrl = this.currentUser.avatarUrl;
    }

    this.userForm.get('nickname')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(nickname => {
        if (nickname && nickname !== this.currentUser.nickname) {
          this.authService.checkNicknameExists(nickname).subscribe(exists => {
            if (exists) {
              this.userForm.get('nickname')?.setErrors({ nicknameTaken: true });
            } else {
              const control = this.userForm.get('nickname');
              if (control?.hasError('nicknameTaken')) {
                control.setErrors(null); // očisti grešku ako više nije zauzet
              }
            }
          });
        }
      });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.userForm.invalid) return;

    this.userForm.get('nickname')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value) {
          this.authService.checkNicknameExists(value).subscribe(exists => {
            if (exists && value !== this.currentUser.nickname) {
              this.userForm.get('nickname')?.setErrors({ nicknameTaken: true });
            }
          });
        }
      });

    const formData = new FormData();
    formData.append('nickname', this.userForm.value.nickname);
    formData.append('email', this.userForm.get('email')?.value);
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.authService.updateUser(formData).subscribe({
      next: (response: { user: User }) => {
        const updatedUser = response.user;
        this.successMessage = 'Profil je uspješno ažuriran!';
        this.errorMessage = '';
        this.authService.setUser(updatedUser);
        this.updated.emit(updatedUser);
        this.currentUser = updatedUser; // << refresha avatar odmah

        this.snackBar.open(this.successMessage, '', {
          duration: 2000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar',
        });

        // ⏳ Pričekaj 1.5 sekundi pa zatvori modal
        setTimeout(() => {
          this.close();
        }, 1500);
      },
      error: (err) => {
        console.error('Greška pri ažuriranju profila:', err);
        this.errorMessage = err?.error?.message || 'Greška pri ažuriranju profila.';
        this.successMessage = '';

        this.snackBar.open(this.errorMessage, '', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      if (this.selectedFile.size > 2 * 1024 * 1024) {
        this.errorMessage = 'Datoteka je prevelika (max 2MB)';
        this.selectedFile = null;
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(this.selectedFile.type)) {
        this.errorMessage = 'Samo JPG i PNG formati su dozvoljeni';
        this.selectedFile = null;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  changePassword(): void {
    const email = this.userForm.get('email')?.value;
    this.authService.sendResetPasswordEmail(email).subscribe({
      next: () => {
        this.snackBar.open('Reset link poslan na vaš email.', '', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'success-snackbar'
        });
      },
      error: () => {
        this.snackBar.open('Greška prilikom slanja linka za reset.', '', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  close(): void {
    this.closed.emit();
  }

  get nickname() {
    return this.userForm.get('nickname');
  }

  get email() {
    return this.userForm.get('email');
  }

  onAvatarError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/defaultUser.png';
  }
}
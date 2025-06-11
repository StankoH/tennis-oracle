import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-success',
  standalone: true,
  template: '<p>Prijava uspješna! Preusmjeravam...</p>'
})
export class OauthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      localStorage.setItem('token', token);

      // ⛑ Dodano: ručni header jer interceptor još ne reagira
      this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).subscribe({
        next: (res) => {
          this.authService.setUser(res.user);
          this.authService.setAuthState(true);
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Greška kod /me:', err);
          this.authService.logout();
          this.router.navigate(['/login']);
        },
      });
    } else {
      this.router.navigate(['/login']);
    }
  }
}
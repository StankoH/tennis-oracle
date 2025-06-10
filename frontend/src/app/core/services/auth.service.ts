import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { ResetPasswordResponse } from '../types/auth.types';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) { }

  // Emitira status svima koji se pretplate
  authStatus$ = this.loggedIn.asObservable();

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  setAuthState(isLoggedIn: boolean): void {
    console.log('✅ setAuthState pozvan s:', isLoggedIn);
    this.loggedIn.next(isLoggedIn);
  }

  login(credentials: { identifier: string; password: string }) {
    const payload = { 
      identifier: credentials.identifier,  // <-- pretvori identifier u email
      password: credentials.password 
    };
    return this.http.post<{ token: string; user: User }>('/api/auth/login', payload);
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:5000/api/auth/google';
  }

  loginWithFacebook(): void {
    window.location.href = 'http://localhost:5000/api/auth/facebook';
  }

  resendVerification(email: string): Observable<unknown> {
    return this.http.post('/api/auth/resend-verification', { email });
  }

  contactUs(data: { name: string; email: string; message: string }) {
    return this.http.post('/api/auth/contact', data);
  }

  private currentUser = new BehaviorSubject<User | null>(this.getUserFromStorage());
  user$ = this.currentUser.asObservable(); 

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: User | null): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.next(user);
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.loggedIn.next(false);
    this.currentUser.next(null);
  }

  updateUser(data: FormData): Observable<{ user: User }> {
    const token = localStorage.getItem('token');
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this.http.post<{ user: User }>(`${this.apiUrl}/update`, data, { headers });
  }

  initAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
  
    if (token && !user) {
      localStorage.removeItem('token');
      this.loggedIn.next(false);
    }
    const isLoggedIn = !!token;
    this.loggedIn.next(isLoggedIn);
    this.currentUser.next(user ? JSON.parse(user) : null);
  
    console.log('🔄 initAuth:', isLoggedIn);
  }

  resendVerificationEmail(email: string) {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }

  verifyEmail(token: string) {
    return this.http.post(`${this.apiUrl}/verify-email`, { token });
  }

  sendResetPasswordEmail(email: string) {
    alert(`${this.apiUrl}/request-reset-password`);
    return this.http.post(`${this.apiUrl}/request-reset-password`, { email });
  }

  resetPassword(token: string, email: string, password: string): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, {
      token,
      email,
      password
    });
  }

  checkNicknameExists(nickname: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/nickname-exists/${nickname}`);
  }
}
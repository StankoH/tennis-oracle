import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, NgbModalModule],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'] // <-- ispravno
})
export class VerifyComponent implements OnInit {
  @ViewChild('verifyModal') verifyModalRef!: TemplateRef<unknown>;

  modalMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.authService.verifyEmail(token).subscribe({
        next: () => {
          this.modalMessage = 'Tvoj email je uspješno potvrđen! 🎉';
          setTimeout(() => this.modalService.open(this.verifyModalRef, { centered: true }), 200);
        },
        error: (err) => {
          this.modalMessage = err.error.message || 'Došlo je do pogreške.';
          this.showModal = true;
        }
      });
    } else {
      this.modalMessage = 'Token nije pronađen u URL-u.';
      this.showModal = true;
    }
  }

  showModal = false;

  goHome() {
    this.modalService.dismissAll();
    this.router.navigate(['/']);
  }
}
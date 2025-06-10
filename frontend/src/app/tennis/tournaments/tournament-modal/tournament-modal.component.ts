import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tournament-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tournament-modal.component.html',
  styleUrls: ['./tournament-modal.component.scss']
})
export class TournamentModalComponent {
  @Input() tournamentEventTPId!: number;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}

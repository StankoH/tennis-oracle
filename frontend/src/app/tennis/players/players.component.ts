import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { Player, PlayerApiResponse } from '../tennis.model';
import { PlayerFilterModalComponent } from './player-filter-modal/player-filter-modal.component';
import { PlayerModalComponent } from './player-modal/player-modal.component';
import { PlayerService } from './player.service';


@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    PlayerModalComponent,
    PlayerFilterModalComponent
  ],
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  currentPage = 1;
  pageSize = 100;
  totalPages = 0;
  selectedPlayer: number | null = null;
  sortField: 'playerName' | 'playerBirthDate' | 'trueSkillMean' | 'careerTrueSkillMean' = 'playerName';
  sortDirection: 'asc' | 'desc' = 'asc';
  isFiltered = false;
  showFilterModal = false;
  activeTournamentTypeIds: number[] = [2, 4];

  constructor(private playerService: PlayerService) { }

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.playerService.getPaginatedPlayers(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.activeTournamentTypeIds
    ).subscribe((response: PlayerApiResponse) => {
      this.players = response.players;
      this.totalPages = response.pagination.totalPages;
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPlayers();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPlayers();
      this.scrollToTop();
    }
  }

  openPlayerModal(player: number) {
    this.selectedPlayer = player;
    console.log(player);
  }

  closePlayerModal() {
    this.selectedPlayer = null;
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  onPageInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = Number(input.value);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPlayers();
      this.scrollToTop();
    }
  }

  scrollToTop(): void {
    const container = document.querySelector('.player-table-wrapper');
    if (container) {
      container.scrollTop = 0;
    }
  }

  decodeHtmlEntities(value: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  sortPlayers(): void {
    this.players.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (this.sortField) {
        case 'playerName':
          valA = a.playerName?.toLowerCase() || '';
          valB = b.playerName?.toLowerCase() || '';
          break;
        case 'playerBirthDate':
          valA = a.playerBirthDate ? new Date(a.playerBirthDate).getTime() : 0;
          valB = b.playerBirthDate ? new Date(b.playerBirthDate).getTime() : 0;
          break;
        case 'trueSkillMean':
          valA = a.trueSkillMean ?? 0;
          valB = b.trueSkillMean ?? 0;
          break;
        case 'careerTrueSkillMean':
          valA = a.careerTrueSkillMean ?? 0;
          valB = b.careerTrueSkillMean ?? 0;
          break;
      }

      const compare = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.sortDirection === 'asc' ? compare : -compare;
    });
  }

  toggleSort(field: 'playerName' | 'playerBirthDate' | 'trueSkillMean' | 'careerTrueSkillMean'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadPlayers();
  }

  onFilterApplied(selectedIds: number[]): void {
    this.activeTournamentTypeIds = selectedIds;
    this.isFiltered = !(selectedIds.length === 2); // ako su oba selektirana, nije filtrirano
    this.currentPage = 1;
    this.loadPlayers();
    this.closeFilterModal();
  }

  resetFilter(): void {
    this.activeTournamentTypeIds = [2, 4]; // reset na sve
    this.isFiltered = false;
    this.currentPage = 1;
    this.loadPlayers();
    this.closeFilterModal();
  }
}
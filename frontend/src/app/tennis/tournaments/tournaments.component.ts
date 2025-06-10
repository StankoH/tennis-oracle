import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from '../../app.component';
import { TournamentEvent } from '../tennis.model';
import { TournamentEventService } from './tournament-event.service';
import { TournamentFilterModalComponent } from './tournament-filter-modal/tournament-filter-modal.component';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  templateUrl: './tournaments.component.html',
  styleUrls: ['./tournaments.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    NgbDatepickerModule,
    TournamentFilterModalComponent,
  ],
  encapsulation: ViewEncapsulation.None
})

export class TournamentEventsComponent implements OnInit, OnDestroy {
  Math = Math;
  tournaments: TournamentEvent[] = [];
  filteredMatches: TournamentEvent[] = [];
  isFiltered = false;
  filteredPage = 1;
  currentDate: Date = new Date('2022-01-01');//currentDate: Date = new Date();
  isNextDisabled = false;
  isPrevDisabled = false;
  loading = false;
  selectedDate: NgbDateStruct | null = null;
  showDatepicker = false;
  showFilterModal = false;
  selectedPlayer: number | null = null;
  selectedTournament: number | null = null;
  sortField: 'tournament' | 'date' | 'prize' = 'tournament';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterApplied = false;
  activeDateFilter = 'all'; // 'year', 'month', 'week', 'custom'
  activeFromDate: string | null = null;
  activeToDate: string | null = null;
  activeSurfaceIds: number[] = [1, 2, 3, 4];
  activeTournamentTypeIds: number[] = [2, 4];
  activeTournamentLevelIds: number[] = [1, 2, 3, 4];
  filteredAvailableDates: string[] = [];
  showDateWarning = false;
  currentDateString: string = this.formatDate(this.currentDate);
  noTournamentsForFilter = false;
  showOutOfRangeModal = false;
  @Input() minDate!: Date;
  @Input() maxDate!: Date;
  private inputDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  availableDates: string[] = [];

  @ViewChild('dateInput') dateInputRef!: ElementRef<HTMLInputElement>
  @HostListener('document:click', ['$event'])

  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isDatePicker = target.closest('.datepicker-wrapper');
    const isIcon = target.closest('.datepicker-toggle');

    if (!isDatePicker && !isIcon) {
      this.showDatepicker = false;
    }
  }
  constructor(private tournamentEventService: TournamentEventService, private translate: TranslateService, private appComponent: AppComponent) { }

  ngOnInit(): void {
    this.tournamentEventService.getDateRange().subscribe({
      next: ({ minDate, maxDate }) => {
        this.minDate = new Date(minDate);
        this.maxDate = new Date(maxDate);
        this.currentDate = this.maxDate; // zadnji dan s podacima
        this.currentDateString = this.formatDateForInput(this.currentDate);

        // ⏳ Nakon što znamo raspon, dohvatimo sve dostupne datume
        this.tournamentEventService.getAvailableDates().subscribe({
          next: (dates) => {
            this.availableDates = dates;

            // ✅ Sada kad znamo koji dani imaju turnire — učitaj
            this.loadTournamentsForDate(this.currentDate);
          },
          error: (err) => {
            console.error('❌ Failed to load availableDates:', err);
          }
        });
      },
      error: (err) => {
        console.error('❌ Failed to load match date range:', err);
      }
    });

    // 🎹 Listener za ESC
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  }

  scrollToTop(): void {
    const container = document.querySelector('.table-wrapper');
    if (container) {
      container.scrollTop = 0;
    }
  }

  handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDateWarningModal();
    }
  }

  loadTournamentsForDate(date: Date): void {
    this.loading = true;

    const correctedDate = this.correctDateIfOutOfBounds(date);
    this.currentDate = correctedDate;
    this.currentDateString = this.formatDateForInput(correctedDate);
    this.noTournamentsForFilter = false;

    if (correctedDate.getTime() !== date.getTime()) {
      this.showDateOutOfRangeModal();
    }

    const formattedDate = this.formatDate(correctedDate); // YYYYMMDD

    this.tournamentEventService.getTournamentEventsByDay(formattedDate).subscribe({
      next: (tournaments: TournamentEvent[]) => {

        if (this.isFiltered) {
          // ✅ Filter by surface
          if (this.activeSurfaceIds?.length && this.activeSurfaceIds.length < 4) {
            tournaments = tournaments.filter(m =>
              m.surfaceId !== undefined &&
              this.activeSurfaceIds.includes(m.surfaceId)
            );
          }

          // ✅ Filter by tournament type
          if (this.activeTournamentTypeIds?.length && this.activeTournamentTypeIds.length < 2) {
            tournaments = tournaments.filter(m =>
              m.tournamentTypeId !== undefined &&
              this.activeTournamentTypeIds.includes(m.tournamentTypeId)
            );
          }

          // ✅ Filter by tournament level
          if (this.activeTournamentLevelIds?.length && this.activeTournamentLevelIds.length < 4) {
            tournaments = tournaments.filter(m =>
              m.tournamentLevelId !== undefined &&
              this.activeTournamentLevelIds.includes(m.tournamentLevelId)
            );
          }

        }

        this.tournaments = tournaments;
        this.sortTournaments();

        this.checkAdjacentDaysAvailability(correctedDate);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading matches:', err);
        this.tournaments = [];
        this.loading = false;
        this.isPrevDisabled = true;
        this.isNextDisabled = true;
      }
    });
  }

  sortTournaments(): void {
    this.tournaments.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (this.sortField === 'tournament') {
        valA = this.removeRomanSuffix(a.tournamentEventName || '').toLowerCase();
        valB = this.removeRomanSuffix(b.tournamentEventName || '').toLowerCase();
      } else if (this.sortField === 'date') {
        valA = new Date(a.matchDate).getTime();
        valB = new Date(b.matchDate).getTime();
      }

      const compare = valA < valB ? -1 : valA > valB ? 1 : 0;
      return this.sortDirection === 'asc' ? compare : -compare;
    });
  }

  toggleSort(field: 'tournament' | 'date' | 'prize'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortTournaments();
  }

  onNativeDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawDate = new Date(input.value);

    if (isNaN(rawDate.getTime())) return;

    const formatted = rawDate.toISOString().split('T')[0];

    if (this.isFiltered && this.filteredAvailableDates.length > 0) {
      const isInsideFilter = this.filteredAvailableDates.includes(formatted);
      if (!isInsideFilter) {
        this.showOutOfFilterRangeModal();

        // Resetiraj Angular property koji se bind-a
        const currentDateFormatted = this.currentDate
          ? this.formatDateForInput(this.currentDate)
          : '';
        console.log('Resetting input to last valid date:', this.currentDate, currentDateFormatted);
        this.currentDateString = currentDateFormatted;

        // I ručno postavi value DOM elementa
        if (this.dateInputRef?.nativeElement) {
          this.dateInputRef.nativeElement.value = this.currentDateString;
        }

        return;
      }
    }

    // Ako je sve ok, nastavi normalno
    this.loadTournamentsForDate(rawDate);
  }

  onDateInputChanged(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (this.inputDebounceTimeout) {
      clearTimeout(this.inputDebounceTimeout);
    }

    this.inputDebounceTimeout = setTimeout(() => {
      const rawDate = new Date(input.value);

      if (isNaN(rawDate.getTime())) return;

      const formatted = rawDate.toISOString().split('T')[0];

      if (this.isFiltered && this.filteredAvailableDates.length > 0) {
        const isInsideFilter = this.filteredAvailableDates.includes(formatted);
        if (!isInsideFilter) {
          this.showOutOfFilterRangeModal();

          const currentDateFormatted = this.formatDateForInput(this.currentDate);
          this.currentDateString = currentDateFormatted;

          if (this.dateInputRef?.nativeElement) {
            this.dateInputRef.nativeElement.value = currentDateFormatted;
          }

          return;
        }
      }

      // Ako nije filtrirano, ali korisnik upisao datum izvan min/max — korigiraj
      if (!this.isFiltered) {
        const corrected = this.correctDateIfOutOfBounds(rawDate);

        if (corrected.getTime() !== rawDate.getTime()) {
          this.showDateOutOfRangeModal();

          const correctedStr = this.formatDateForInput(corrected);
          this.currentDate = corrected;
          this.currentDateString = correctedStr;

          if (this.dateInputRef?.nativeElement) {
            this.dateInputRef.nativeElement.value = correctedStr;
          }

          this.loadTournamentsForDate(corrected); // već ažurira .tournaments

          this.checkAdjacentDaysAvailability(corrected);

          return;
        }
      }

      this.loadTournamentsForDate(rawDate);
    }, 500); // ⏳ debounce 500ms
  }

  previousDay(): void {
    if (this.isFiltered && this.filteredAvailableDates.length > 0) {
      const currentStr = this.formatDateForInput(this.currentDate);
      const index = this.filteredAvailableDates.findIndex(d => d.trim() === currentStr);
      console.log('📍 Filtered Dates:', this.filteredAvailableDates);
      console.log('📍 Current Date string:', currentStr);
      console.log('📍 Index found:', index);
      if (index > 0) {
        const prevDate = new Date(this.filteredAvailableDates[index - 1].trim());
        this.currentDate = prevDate;
        this.filteredPage = 1;
        this.loadTournamentsForDate(prevDate);
      }
    } else {
      const prev = new Date(this.currentDate);
      prev.setDate(prev.getDate() - 1);
      this.loadTournamentsForDate(prev);
    }

    this.scrollToTop();
  }

  nextDay(): void {
    if (this.isFiltered && this.filteredAvailableDates.length > 0) {
      const currentStr = this.formatDateForInput(this.currentDate);
      const index = this.filteredAvailableDates.findIndex(d => d.trim() === currentStr);
      console.log('📍 Filtered Dates:', this.filteredAvailableDates);
      console.log('📍 Current Date string:', currentStr);
      console.log('📍 Index found:', index);
      if (index >= 0 && index < this.filteredAvailableDates.length - 1) {
        const nextDate = new Date(this.filteredAvailableDates[index + 1].trim());
        this.currentDate = nextDate;
        this.filteredPage = 1;
        this.loadTournamentsForDate(nextDate);
      }
    } else {
      const next = new Date(this.currentDate);
      next.setDate(next.getDate() + 1);
      this.loadTournamentsForDate(next);
    }

    this.scrollToTop();
  }

  getLocalizedDateTime(date: string | Date): string {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(parsedDate.getTime())) return '';

    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(parsedDate.getDate());
    const month = pad(parsedDate.getMonth() + 1); // Mjeseci su 0-indeksirani
    const year = parsedDate.getFullYear();
    const hours = pad(parsedDate.getHours());
    const minutes = pad(parsedDate.getMinutes());

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  formatOdds(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';
    return value.toFixed(2);
  }

  formatPercent(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '';
    return (value * 100).toFixed(0) + '%';
  }

  selectedTournamentEvent: TournamentEvent | null = null;

  openMatchModal(tournament: TournamentEvent): void {
    this.selectedTournamentEvent = tournament;
  }

  closeMatchModal(): void {
    this.selectedTournamentEvent = null;
  }

  openFilterModal(): void {
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  openTournamentModal(tournament: number) {
    this.selectedTournament = tournament;
  }

  closeTournamentModal() {
    this.selectedTournament = null;
  }

  formatResult(raw: string | null | undefined): string {
    if (!raw || raw.length !== 2) return '';
    const left = raw[0];
    const right = raw[1];
    return `${left} : ${right}`;
  }

  removeRomanSuffix(name: string): string {
    return name.replace(/\s*(\([IVXLCDM]{1,4}\)|[IVXLCDM]{1,4})\s*$/, '').trim();
  }

  decodeHtmlEntities(value: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  onFilterApplied(filter: {
    startDate: string | null;
    endDate: string | null;
    option: string;
    surfaceIds: number[];
    tournamentTypeIds: number[];
    tournamentLevelIds: number[];
  }): void {
    console.log('🧪 onFilterApplied (incoming):', filter);

    // 1️⃣ Ako je "all" bez datuma — koristi min/max iz baze
    if (filter.option === 'all' && (!filter.startDate || !filter.endDate)) {
      filter.startDate = this.minDate.toISOString().split('T')[0];
      filter.endDate = this.maxDate.toISOString().split('T')[0];
    }

    // 2️⃣ Pretvori datume u Date objekte i stringove
    const fromDate = new Date(filter.startDate!);
    const toDate = new Date(filter.endDate!);
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];

    // 3️⃣ Ažuriraj lokalni state
    this.activeDateFilter = filter.option;
    this.activeFromDate = fromStr;
    this.activeToDate = toStr;
    this.activeSurfaceIds = filter.surfaceIds?.length ? filter.surfaceIds : [1, 2, 3, 4];
    this.activeTournamentTypeIds = filter.tournamentTypeIds?.length ? filter.tournamentTypeIds : [2, 4];
    this.activeTournamentLevelIds = filter.tournamentLevelIds?.length ? filter.tournamentLevelIds : [1, 2, 3, 4];

    const allSurfacesSelected = this.activeSurfaceIds.length === 4 &&
      [1, 2, 3, 4].every(id => this.activeSurfaceIds.includes(id));

    const allTournamentTypeSelected = this.activeTournamentTypeIds.length === 2 &&
      [2, 4].every(id => this.activeTournamentTypeIds.includes(id));

    const allTournamentLevelSelected = this.activeTournamentLevelIds.length === 4 &&
      [1, 2, 3, 4].every(id => this.activeTournamentLevelIds.includes(id));

    const isDefaultDate = filter.option === 'all';

    this.isFiltered = !(isDefaultDate && allSurfacesSelected && allTournamentTypeSelected && allTournamentLevelSelected);
    this.filterApplied = this.isFiltered;

    // 4️⃣ Ako nije filtrirano — vrati prikaz za trenutni dan
    if (!this.isFiltered) {
      this.filteredAvailableDates = [];
      this.filteredPage = 1;
      this.noTournamentsForFilter = false;
      this.currentDateString = this.formatDateForInput(this.currentDate);
      this.showFilterModal = false;
      this.loadTournamentsForDate(this.currentDate);
      return;
    }

    // 5️⃣ Dohvati sve dostupne datume i filtriraj unutar raspona
    this.tournamentEventService.getAvailableDates().subscribe({
      next: (availableDates) => {
        const validDates = availableDates.filter(d => d >= fromStr && d <= toStr);

        // console.log('🔍 Available dates:', availableDates);
        // console.log('🔍 Valid range:', fromStr, '→', toStr);

        if (validDates.length === 0) {
          console.warn('⚠️ No tournaments found for selected range:', fromStr, 'to', toStr);
          this.tournaments = [];
          this.filteredAvailableDates = [];
          this.noTournamentsForFilter = true;
          this.loading = false;
          this.showFilterModal = false;
          return;
        }

        // 6️⃣ Postavi zadnji validan dan kao aktivan
        this.filteredAvailableDates = validDates;
        const lastValidDateStr = validDates[validDates.length - 1];
        this.currentDate = new Date(lastValidDateStr);
        this.filteredPage = 1;
        this.noTournamentsForFilter = false;
        this.showFilterModal = false;
        this.loading = true;

        this.loadTournamentsForDate(this.currentDate);
      },
      error: (err) => {
        console.error('❌ Error fetching available dates:', err);
        this.tournaments = [];
        this.filteredAvailableDates = [];
        this.noTournamentsForFilter = true;
        this.loading = false;
        this.showFilterModal = false;
      }
    });
  }

  generateDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      if (this.availableDates.includes(dateStr)) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  clearFilter(): void {
    this.isFiltered = false;
    this.filteredPage = 1;
    this.loadTournamentsForDate(this.currentDate);
  }

  onFilterReset(): void {
    this.filterApplied = false;
    this.activeDateFilter = 'all';
    this.activeFromDate = null;
    this.activeToDate = null;
    this.clearFilter();
  }

  isFilterDefault(): boolean {
    const allSurfacesSelected = this.activeSurfaceIds.length === 4 && [1, 2, 3, 4].every(id => this.activeSurfaceIds.includes(id));
    const allTournamentTypeIds = this.activeTournamentTypeIds.length === 2 && [2, 4].every(id => this.activeTournamentTypeIds.includes(id));
    const allTournamentLevelIds = this.activeTournamentLevelIds.length === 4 && [1, 2, 3, 4].every(id => this.activeTournamentLevelIds.includes(id));
    const dateIsAll = this.activeDateFilter === 'all';
    return allSurfacesSelected && allTournamentTypeIds && allTournamentLevelIds && dateIsAll;
  }

  correctDateIfOutOfBounds(date: Date): Date {
    if (date < this.minDate) return this.minDate;
    if (date > this.maxDate) return this.maxDate;
    return date;
  }

  showDateOutOfRangeModal(): void {
    this.showDateWarning = true;
    setTimeout(() => this.closeDateWarningModal(), 5000);
  }

  closeDateWarningModal(): void {
    this.showDateWarning = false;
  }

  checkAdjacentDaysAvailability(baseDate: Date): void {
    const currentStr = this.formatDateForInput(baseDate); // već ispravno 'yyyy-MM-dd'

    if (this.isFiltered && this.filteredAvailableDates.length > 0) {
      const index = this.filteredAvailableDates.findIndex(date => date === currentStr);

      // console.log('📍 Filtered Dates:', this.filteredAvailableDates);
      console.log('📍 Current Date string:', currentStr);
      console.log('📍 Index found:', index);

      this.isPrevDisabled = index <= 0;
      this.isNextDisabled = index === -1 || index >= this.filteredAvailableDates.length - 1;

      if (index === -1) {
        // Ako je izvan raspona, ručno provjeri najbliže datume
        const baseTime = new Date(currentStr).getTime();

        const prev = this.filteredAvailableDates.find(d => new Date(d).getTime() < baseTime);
        const next = this.filteredAvailableDates.find(d => new Date(d).getTime() > baseTime);

        this.isPrevDisabled = !prev;
        this.isNextDisabled = !next;
      }
      return;
    }

    // Ako nije filter aktivan (klasičan način)
    const prevDate = new Date(baseDate);
    prevDate.setDate(baseDate.getDate() - 1);

    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + 1);

    this.tournamentEventService.getTournamentEventsByDay(this.formatDate(prevDate)).subscribe({
      next: (prevRes) => {
        this.isPrevDisabled = !(prevRes?.length);
      },
      error: () => {
        this.isPrevDisabled = true;
      }
    });

    this.tournamentEventService.getTournamentEventsByDay(this.formatDate(nextDate)).subscribe({
      next: (nextRes) => {
        this.isNextDisabled = !(nextRes?.length);
      },
      error: () => {
        this.isNextDisabled = true;
      }
    });
  }

  showOutOfFilterRangeModal(): void {
    this.showOutOfRangeModal = true;
    setTimeout(() => this.showOutOfRangeModal = false, 5000); // automatsko zatvaranje
  }

  formatDateForInput(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      console.error('❌ Invalid date passed to formatDateForInput:', date);
      return 'Invalid-Date';
    }
    return date.toISOString().split('T')[0];
  }
}
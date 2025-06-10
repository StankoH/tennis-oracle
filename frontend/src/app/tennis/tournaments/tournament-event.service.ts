import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TournamentEvent, TournamentEventApiResponse, TournamentEventDayApiResponse } from '../../tennis/tennis.model';

@Injectable({ providedIn: 'root' })
export class TournamentEventService {
  private apiUrl = '/api/tournamentevents';

  constructor(private http: HttpClient) { }

  // ✅ Dohvat turnira za točno određeni dan (YYYYMMDD)
  getTournamentsByDate(dateStr: string): Observable<TournamentEventApiResponse> {
    console.log('📡 Calling' + `${this.apiUrl}/summaries/by-date/${dateStr}` + ' with:', dateStr);
    return this.http.get<TournamentEventApiResponse>(`${this.apiUrl}/summaries/by-date/${dateStr}`);
  }

  // ✅ NOVO: Dohvat turnira unutar vremenskog okvira (YYYY-MM-DD)
  getTournamentsByDateRange(from: string, to: string): Observable<TournamentEvent[]> {
    const url = `${this.apiUrl}/filter-by-date-range?from=${from}&to=${to}`;
    console.log('📡 Calling getTournamentsByDateRange with:', url);
    return this.http.get<TournamentEvent[]>(url);
  }

  // ✅ Dohvat prvog i zadnjeg datuma u kolekciji
  getDateRange(): Observable<{ minDate: string; maxDate: string }> {
    return this.http.get<{ minDate: string; maxDate: string }>(`${this.apiUrl}/daterange`);
  }

  // ✅ Dohvat svih dostupnih datuma (koristi se kod paginacije po danima)
  getAvailableDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/available-dates`);
  }

  getTournamentEventsByDay(date: string): Observable<TournamentEvent[]> {
    return this.http.get<TournamentEventDayApiResponse>(
      `/api/tournamenteventdays/by-date/${date}`
    ).pipe(map(res => res.tournaments));
  }
  
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DetailedMatch, Match, MatchApiResponse, MergedTrueSkillEntry, TrueSkillHistoryResponse } from '../tennis.model';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  // ✅ Dohvat mečeva za točno određeni dan (YYYYMMDD)
  getMatchesByDate(dateStr: string): Observable<MatchApiResponse> {
    // console.log('📡 Calling getMatchesByDate with:', dateStr);
    return this.http.get<MatchApiResponse>(`${this.apiUrl}/matches/summaries/by-date/${dateStr}`);
  }

  // ✅ NOVO: Dohvat mečeva unutar vremenskog okvira (YYYY-MM-DD)
  getMatchesByDateRange(from: string, to: string): Observable<Match[]> {
    const url = `${this.apiUrl}/matches/filter-by-date-range?from=${from}&to=${to}`;
    // console.log('📡 Calling getMatchesByDateRange with:', url);
    return this.http.get<Match[]>(url);
  }

  // ✅ Dohvat prvog i zadnjeg datuma u kolekciji
  getDateRange(): Observable<{ minDate: string; maxDate: string }> {
    return this.http.get<{ minDate: string; maxDate: string }>(`${this.apiUrl}/matches/daterange`);
  }

  // ✅ Dohvat svih dostupnih datuma (koristi se kod paginacije po danima)
  getAvailableDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/matches/available-dates`);
  }

  getMatchDetails(matchTPId: number) {
    // return this.http.get<Match>(`http://localhost:5000/api/match-details/${matchTPId}`);
    return this.http.get<DetailedMatch>(`/api/match-details/${matchTPId}`);
  }

  getTrueSkillHistory(player1TPId: number, player2TPId: number) {
    const url = `${this.apiUrl}/trueskill/history?player1TPId=${player1TPId}&player2TPId=${player2TPId}`;
    return this.http.get<TrueSkillHistoryResponse>(url);
  }

  getMergedTrueSkillHistory(player1TPId: number, player2TPId: number): Observable<MergedTrueSkillEntry[]> {
    const url = `${this.apiUrl}/trueskill/history/merged?player1TPId=${player1TPId}&player2TPId=${player2TPId}`;
    return this.http.get<MergedTrueSkillEntry[]>(url);
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DetailedMatch, Match, MatchApiResponse, MergedTrueSkillEntry, TrueSkillHistoryResponse } from '../tennis.model';

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMatchesByDate(dateStr: string): Observable<MatchApiResponse> {
    return this.http.get<MatchApiResponse>(`${this.apiUrl}/matches/summaries/by-date/${dateStr}`);
  }

  getMatchesByDateRange(from: string, to: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/matches/filter-by-date-range?from=${from}&to=${to}`);
  }

  getDateRange(): Observable<{ minDate: string; maxDate: string }> {
    return this.http.get<{ minDate: string; maxDate: string }>(`${this.apiUrl}/matches/daterange`);
  }

  getAvailableDates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/matches/available-dates`);
  }

  getMatchDetails(matchTPId: number) {
    return this.http.get<DetailedMatch>(`${this.apiUrl}/match-details/${matchTPId}`);
  }

  getTrueSkillHistory(player1TPId: number, player2TPId: number) {
    return this.http.get<TrueSkillHistoryResponse>(`${this.apiUrl}/trueskill/history?player1TPId=${player1TPId}&player2TPId=${player2TPId}`);
  }

  getMergedTrueSkillHistory(player1TPId: number, player2TPId: number): Observable<MergedTrueSkillEntry[]> {
    return this.http.get<MergedTrueSkillEntry[]>(`${this.apiUrl}/trueskill/history/merged?player1TPId=${player1TPId}&player2TPId=${player2TPId}`);
  }
}
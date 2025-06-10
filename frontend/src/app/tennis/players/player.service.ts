import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayerApiResponse } from '../../tennis/tennis.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private apiUrl = '/api/players';

  constructor(private http: HttpClient) {}

  getPaginatedPlayers(
    page: number,
    pageSize: number,
    sortField: string,
    sortDirection: string,
    tournamentTypeIds: number[] = []
  ): Observable<PlayerApiResponse> {
    const params: Record<string, string> = {
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortField,
      sortDirection
    };

    // Ako nije selektirano sve (npr. samo ATP ili samo WTA), šaljemo filter
    if (tournamentTypeIds.length > 0 && tournamentTypeIds.length < 2) {
      params['tournamentTypeIds'] = tournamentTypeIds.join(',');
    }

    return this.http.get<PlayerApiResponse>(`${this.apiUrl}/paginated`, { params });
  }
}

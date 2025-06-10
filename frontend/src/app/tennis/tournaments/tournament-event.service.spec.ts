import { TestBed } from '@angular/core/testing';

import { TournamentEventService } from './tournament-event.service';

describe('TournamentEventService', () => {
  let service: TournamentEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TournamentEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

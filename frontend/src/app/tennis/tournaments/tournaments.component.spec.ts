import { ComponentFixture, TestBed } from '@angular/core/testing';

import { tournamentEventsComponent } from './tournaments.component';

describe('TournamentsComponent', () => {
  let component: tournamentEventsComponent;
  let fixture: ComponentFixture<tournamentEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [tournamentEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(tournamentEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

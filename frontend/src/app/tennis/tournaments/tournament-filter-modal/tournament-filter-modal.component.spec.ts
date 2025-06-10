import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentFilterModalComponent } from './tournament-filter-modal.component';

describe('TournamentFilterModalComponent', () => {
  let component: TournamentFilterModalComponent;
  let fixture: ComponentFixture<TournamentFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TournamentFilterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

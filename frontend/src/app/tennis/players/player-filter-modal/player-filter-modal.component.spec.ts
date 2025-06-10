import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerFilterModalComponent } from './player-filter-modal.component';

describe('PlayerFilterModalComponent', () => {
  let component: PlayerFilterModalComponent;
  let fixture: ComponentFixture<PlayerFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFilterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

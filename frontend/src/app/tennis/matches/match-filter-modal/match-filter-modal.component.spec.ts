import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchFilterModalComponent } from './match-filter-modal.component';

describe('MatchFilterModalComponent', () => {
  let component: MatchFilterModalComponent;
  let fixture: ComponentFixture<MatchFilterModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchFilterModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchFilterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

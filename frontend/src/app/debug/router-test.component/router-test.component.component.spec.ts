import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterTestComponentComponent } from './router-test.component.component';

describe('RouterTestComponentComponent', () => {
  let component: RouterTestComponentComponent;
  let fixture: ComponentFixture<RouterTestComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouterTestComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

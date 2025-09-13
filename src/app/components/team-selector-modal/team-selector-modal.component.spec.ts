import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamSelectorModalComponent } from './team-selector-modal.component';

describe('TeamSelectorModalComponent', () => {
  let component: TeamSelectorModalComponent;
  let fixture: ComponentFixture<TeamSelectorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamSelectorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamSelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

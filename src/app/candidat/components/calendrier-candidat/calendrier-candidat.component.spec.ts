import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendrierCandidatComponent } from './calendrier-candidat.component';

describe('CalendrierCandidatComponent', () => {
  let component: CalendrierCandidatComponent;
  let fixture: ComponentFixture<CalendrierCandidatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendrierCandidatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendrierCandidatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

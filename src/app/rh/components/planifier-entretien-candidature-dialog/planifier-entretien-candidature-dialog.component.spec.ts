import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanifierEntretienCandidatureDialogComponent } from './planifier-entretien-candidature-dialog.component';

describe('PlanifierEntretienCandidatureDialogComponent', () => {
  let component: PlanifierEntretienCandidatureDialogComponent;
  let fixture: ComponentFixture<PlanifierEntretienCandidatureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanifierEntretienCandidatureDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanifierEntretienCandidatureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

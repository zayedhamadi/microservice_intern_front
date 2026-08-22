import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent } from './planifier-entretient-technique-candidature-dialog-with-employee.component';

describe('PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent', () => {
  let component: PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent;
  let fixture: ComponentFixture<PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanifierEntretientTechniqueCandidatureDialogWithEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

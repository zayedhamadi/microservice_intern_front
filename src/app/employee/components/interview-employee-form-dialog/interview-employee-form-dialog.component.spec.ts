import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewEmployeeFormDialogComponent } from './interview-employee-form-dialog.component';

describe('InterviewEmployeeFormDialogComponent', () => {
  let component: InterviewEmployeeFormDialogComponent;
  let fixture: ComponentFixture<InterviewEmployeeFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterviewEmployeeFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewEmployeeFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

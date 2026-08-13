import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewFormDialogComponent } from './interview-form-dialog.component';

describe('InterviewFormDialogComponent', () => {
  let component: InterviewFormDialogComponent;
  let fixture: ComponentFixture<InterviewFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterviewFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

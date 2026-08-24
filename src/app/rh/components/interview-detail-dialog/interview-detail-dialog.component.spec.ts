import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewDetailDialogComponent } from './interview-detail-dialog.component';

describe('InterviewDetailDialogComponent', () => {
  let component: InterviewDetailDialogComponent;
  let fixture: ComponentFixture<InterviewDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InterviewDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

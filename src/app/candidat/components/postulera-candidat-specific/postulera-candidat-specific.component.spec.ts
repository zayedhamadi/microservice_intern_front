import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostuleraCandidatSpecificComponent } from './postulera-candidat-specific.component';

describe('PostuleraCandidatSpecificComponent', () => {
  let component: PostuleraCandidatSpecificComponent;
  let fixture: ComponentFixture<PostuleraCandidatSpecificComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostuleraCandidatSpecificComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostuleraCandidatSpecificComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

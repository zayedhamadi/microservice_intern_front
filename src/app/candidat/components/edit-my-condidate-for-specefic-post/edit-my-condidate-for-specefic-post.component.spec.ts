import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMyCondidateForSpeceficPostComponent } from './edit-my-condidate-for-specefic-post.component';

describe('EditMyCondidateForSpeceficPostComponent', () => {
  let component: EditMyCondidateForSpeceficPostComponent;
  let fixture: ComponentFixture<EditMyCondidateForSpeceficPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditMyCondidateForSpeceficPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditMyCondidateForSpeceficPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

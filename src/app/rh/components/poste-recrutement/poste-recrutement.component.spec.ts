import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PosteRecrutementComponent } from './poste-recrutement.component';

describe('PosteRecrutementComponent', () => {
  let component: PosteRecrutementComponent;
  let fixture: ComponentFixture<PosteRecrutementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PosteRecrutementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PosteRecrutementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

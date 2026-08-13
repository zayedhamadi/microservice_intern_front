import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostesRecommandesComponent } from './postes-recommandes.component';

describe('PostesRecommandesComponent', () => {
  let component: PostesRecommandesComponent;
  let fixture: ComponentFixture<PostesRecommandesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PostesRecommandesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostesRecommandesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

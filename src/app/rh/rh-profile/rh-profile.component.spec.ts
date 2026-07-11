import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RhProfileComponent } from './rh-profile.component';

describe('RhProfileComponent', () => {
  let component: RhProfileComponent;
  let fixture: ComponentFixture<RhProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RhProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

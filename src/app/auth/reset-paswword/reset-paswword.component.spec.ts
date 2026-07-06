import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPaswwordComponent } from './reset-paswword.component';

describe('ResetPaswwordComponent', () => {
  let component: ResetPaswwordComponent;
  let fixture: ComponentFixture<ResetPaswwordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResetPaswwordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPaswwordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

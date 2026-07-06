import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgetPaswwordComponent } from './forget-paswword.component';

describe('ForgetPaswwordComponent', () => {
  let component: ForgetPaswwordComponent;
  let fixture: ComponentFixture<ForgetPaswwordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ForgetPaswwordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgetPaswwordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

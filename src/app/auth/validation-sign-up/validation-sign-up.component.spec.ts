import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationSignUpComponent } from './validation-sign-up.component';

describe('ValidationSignUpComponent', () => {
  let component: ValidationSignUpComponent;
  let fixture: ComponentFixture<ValidationSignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ValidationSignUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidationSignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

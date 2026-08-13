import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendrierEmployeeComponent } from './calendrier-employee.component';

describe('CalendrierEmployeeComponent', () => {
  let component: CalendrierEmployeeComponent;
  let fixture: ComponentFixture<CalendrierEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendrierEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendrierEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

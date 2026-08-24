import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReprogrammerEntretienComponent } from './reprogrammer-entretien.component';

describe('ReprogrammerEntretienComponent', () => {
  let component: ReprogrammerEntretienComponent;
  let fixture: ComponentFixture<ReprogrammerEntretienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReprogrammerEntretienComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReprogrammerEntretienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

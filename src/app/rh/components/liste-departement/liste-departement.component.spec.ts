import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDepartementComponent } from './liste-departement.component';

describe('ListeDepartementComponent', () => {
  let component: ListeDepartementComponent;
  let fixture: ComponentFixture<ListeDepartementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListeDepartementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeDepartementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

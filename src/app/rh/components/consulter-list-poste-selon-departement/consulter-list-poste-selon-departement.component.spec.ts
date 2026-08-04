import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterListPosteSelonDepartementComponent } from './consulter-list-poste-selon-departement.component';

describe('ConsulterListPosteSelonDepartementComponent', () => {
  let component: ConsulterListPosteSelonDepartementComponent;
  let fixture: ComponentFixture<ConsulterListPosteSelonDepartementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterListPosteSelonDepartementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterListPosteSelonDepartementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

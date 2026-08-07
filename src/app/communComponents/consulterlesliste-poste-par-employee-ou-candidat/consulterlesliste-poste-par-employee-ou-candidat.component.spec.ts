import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterleslistePosteParEmployeeOuCandidatComponent } from './consulterlesliste-poste-par-employee-ou-candidat.component';

describe('ConsulterleslistePosteParEmployeeOuCandidatComponent', () => {
  let component: ConsulterleslistePosteParEmployeeOuCandidatComponent;
  let fixture: ComponentFixture<ConsulterleslistePosteParEmployeeOuCandidatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterleslistePosteParEmployeeOuCandidatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterleslistePosteParEmployeeOuCandidatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

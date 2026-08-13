import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulteLesPosteQuiLesCandidatsPostulentComponent } from './consulte-les-poste-qui-les-candidats-postulent.component';

describe('ConsulteLesPosteQuiLesCandidatsPostulentComponent', () => {
  let component: ConsulteLesPosteQuiLesCandidatsPostulentComponent;
  let fixture: ComponentFixture<ConsulteLesPosteQuiLesCandidatsPostulentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulteLesPosteQuiLesCandidatsPostulentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulteLesPosteQuiLesCandidatsPostulentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

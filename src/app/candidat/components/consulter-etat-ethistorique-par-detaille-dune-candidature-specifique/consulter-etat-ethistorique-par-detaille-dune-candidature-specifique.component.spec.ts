import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent } from './consulter-etat-ethistorique-par-detaille-dune-candidature-specifique.component';

describe('ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent', () => {
  let component: ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent;
  let fixture: ComponentFixture<ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterEtatEthistoriqueParDetailleDuneCandidatureSpecifiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

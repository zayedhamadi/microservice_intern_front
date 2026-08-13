import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent } from './consulte-liste-candidats-qui-postules-aune-poste-specifique.component';

describe('ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent', () => {
  let component: ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent;
  let fixture: ComponentFixture<ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulteListeCandidatsQuiPostulesAUnePosteSpecifiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

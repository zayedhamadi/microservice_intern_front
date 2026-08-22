import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeUsersPourFaireEntretientTechniqueComponent } from './liste-users-pour-faire-entretient-technique.component';

describe('ListeUsersPourFaireEntretientTechniqueComponent', () => {
  let component: ListeUsersPourFaireEntretientTechniqueComponent;
  let fixture: ComponentFixture<ListeUsersPourFaireEntretientTechniqueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListeUsersPourFaireEntretientTechniqueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeUsersPourFaireEntretientTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

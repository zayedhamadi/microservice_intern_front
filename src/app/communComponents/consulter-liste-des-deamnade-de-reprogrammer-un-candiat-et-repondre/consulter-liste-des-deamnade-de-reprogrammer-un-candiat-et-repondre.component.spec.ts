import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent } from './consulter-liste-des-deamnade-de-reprogrammer-un-candiat-et-repondre.component';

describe('ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent', () => {
  let component: ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent;
  let fixture: ComponentFixture<ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterListeDesDeamnadeDeReprogrammerUnCandiatEtRepondreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

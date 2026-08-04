import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListePosteRecrutementComponent } from './liste-poste-recrutement.component';

describe('ListePosteRecrutementComponent', () => {
  let component: ListePosteRecrutementComponent;
  let fixture: ComponentFixture<ListePosteRecrutementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListePosteRecrutementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListePosteRecrutementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

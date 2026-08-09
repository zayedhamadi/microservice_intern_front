import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterSpecificPosteRecrutementComponent } from './consulter-specific-poste-recrutement.component';

describe('ConsulterSpecificPosteRecrutementComponent', () => {
  let component: ConsulterSpecificPosteRecrutementComponent;
  let fixture: ComponentFixture<ConsulterSpecificPosteRecrutementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterSpecificPosteRecrutementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterSpecificPosteRecrutementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

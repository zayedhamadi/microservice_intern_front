import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterSpecificPosteRecrutementDetailleComponent } from './consulter-specific-poste-recrutement-detaille.component';

describe('ConsulterSpecificPosteRecrutementDetailleComponent', () => {
  let component: ConsulterSpecificPosteRecrutementDetailleComponent;
  let fixture: ComponentFixture<ConsulterSpecificPosteRecrutementDetailleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterSpecificPosteRecrutementDetailleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterSpecificPosteRecrutementDetailleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

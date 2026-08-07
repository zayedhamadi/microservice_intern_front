import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPosteRecrutementDetailleComponent } from './edit-poste-recrutement-detaille.component';

describe('EditPosteRecrutementDetailleComponent', () => {
  let component: EditPosteRecrutementDetailleComponent;
  let fixture: ComponentFixture<EditPosteRecrutementDetailleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditPosteRecrutementDetailleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPosteRecrutementDetailleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

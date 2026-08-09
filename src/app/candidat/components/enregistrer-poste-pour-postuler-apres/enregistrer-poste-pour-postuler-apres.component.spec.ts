import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnregistrerPostePourPostulerApresComponent } from './enregistrer-poste-pour-postuler-apres.component';

describe('EnregistrerPostePourPostulerApresComponent', () => {
  let component: EnregistrerPostePourPostulerApresComponent;
  let fixture: ComponentFixture<EnregistrerPostePourPostulerApresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnregistrerPostePourPostulerApresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnregistrerPostePourPostulerApresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterProfilUserDetailsPerRHComponent } from './consulter-profil-user-details-per-rh.component';

describe('ConsulterProfilUserDetailsPerRHComponent', () => {
  let component: ConsulterProfilUserDetailsPerRHComponent;
  let fixture: ComponentFixture<ConsulterProfilUserDetailsPerRHComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterProfilUserDetailsPerRHComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterProfilUserDetailsPerRHComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

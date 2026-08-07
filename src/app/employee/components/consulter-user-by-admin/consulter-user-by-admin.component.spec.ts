import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterUserByAdminComponent } from './consulter-user-by-admin.component';

describe('ConsulterUserByAdminComponent', () => {
  let component: ConsulterUserByAdminComponent;
  let fixture: ComponentFixture<ConsulterUserByAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterUserByAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterUserByAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterspecificposteseloncandidatandadminComponent } from './consulterspecificposteseloncandidatandadmin.component';

describe('ConsulterspecificposteseloncandidatandadminComponent', () => {
  let component: ConsulterspecificposteseloncandidatandadminComponent;
  let fixture: ComponentFixture<ConsulterspecificposteseloncandidatandadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterspecificposteseloncandidatandadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterspecificposteseloncandidatandadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

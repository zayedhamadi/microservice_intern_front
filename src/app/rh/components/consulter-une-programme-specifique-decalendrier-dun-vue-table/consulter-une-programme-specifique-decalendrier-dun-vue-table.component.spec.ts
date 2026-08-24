import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent } from './consulter-une-programme-specifique-decalendrier-dun-vue-table.component';

describe('ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent', () => {
  let component: ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent;
  let fixture: ComponentFixture<ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsulterUneProgrammeSpecifiqueDecalendrierDunVueTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

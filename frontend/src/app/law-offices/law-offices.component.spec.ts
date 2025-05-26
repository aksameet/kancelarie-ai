import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LawOfficesComponent } from './law-offices.component';

describe('LawOfficesComponent', () => {
  let component: LawOfficesComponent;
  let fixture: ComponentFixture<LawOfficesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LawOfficesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LawOfficesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

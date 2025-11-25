import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamDetailsComponentComponent } from './exam-details-component.component';

describe('ExamDetailsComponentComponent', () => {
  let component: ExamDetailsComponentComponent;
  let fixture: ComponentFixture<ExamDetailsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamDetailsComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamDetailsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

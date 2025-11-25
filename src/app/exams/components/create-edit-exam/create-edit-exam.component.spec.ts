import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditExamComponent } from './create-edit-exam.component';

describe('CreateEditExamComponent', () => {
  let component: CreateEditExamComponent;
  let fixture: ComponentFixture<CreateEditExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateEditExamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

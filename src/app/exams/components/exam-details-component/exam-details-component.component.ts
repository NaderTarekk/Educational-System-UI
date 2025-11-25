import { Component, OnInit } from '@angular/core';
import { Exam } from '../../../models/Exam.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsService } from '../../services/exams.service';

@Component({
  selector: 'app-exam-details-component',
  standalone: false,
  templateUrl: './exam-details-component.component.html',
  styleUrl: './exam-details-component.component.scss'
})
export class ExamDetailsComponentComponent implements OnInit {
  examId: string = '';
  exam?: Exam;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamsService
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.params['id'];
    this.loadExamDetails();
  }

  loadExamDetails(): void {
    this.examService.getExamByIdWithQuestionsAndOptions(this.examId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.exam = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam:', error);
        this.isLoading = false;
      }
    });
  }

  editExam(): void {
    this.router.navigate(['/exams/edit', this.examId]);
  }

  backToExams(): void {
    this.router.navigate(['/exams']);
  }

}

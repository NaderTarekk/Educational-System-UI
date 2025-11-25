import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-exams',
  standalone: false,
  templateUrl: './exams.component.html',
  styleUrl: './exams.component.scss'
})
export class ExamsComponent implements OnInit {
  searchTerm: string = '';
  selectedStatus: string = 'all';

  stats = [
    {
      label: 'إجمالي الامتحانات',
      value: '45',
      color: 'bg-blue-100 text-blue-600',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      label: 'نشط',
      value: '12',
      color: 'bg-green-100 text-green-600',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'قادم',
      value: '18',
      color: 'bg-orange-100 text-orange-600',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'مكتمل',
      value: '15',
      color: 'bg-purple-100 text-purple-600',
      icon: 'M5 13l4 4L19 7'
    }
  ];

  exams = [
    {
      id: '1',
      title: 'امتحان نصف الترم - رياضيات',
      description: 'الجبر والهندسة',
      avatar: 'RM',
      groupName: 'GRP-A1',
      duration: 90,
      totalMarks: 100,
      passingMarks: 50,
      startDate: new Date('2025-12-01T09:00:00'),
      endDate: new Date('2025-12-01T10:30:00'),
      status: 'upcoming',
      statusText: 'قادم',
      isActive: true
    },
    {
      id: '2',
      title: 'امتحان الفيزياء - الوحدة الأولى',
      description: 'الحركة والقوة',
      avatar: 'PH',
      groupName: 'GRP-B2',
      duration: 60,
      totalMarks: 50,
      passingMarks: 25,
      startDate: new Date('2025-11-28T10:00:00'),
      endDate: new Date('2025-11-28T11:00:00'),
      status: 'active',
      statusText: 'نشط',
      isActive: true
    },
    {
      id: '3',
      title: 'امتحان الكيمياء - الفصل الثاني',
      description: 'التفاعلات الكيميائية',
      avatar: 'CH',
      groupName: 'GRP-C3',
      duration: 75,
      totalMarks: 80,
      passingMarks: 40,
      startDate: new Date('2025-11-20T11:00:00'),
      endDate: new Date('2025-11-20T12:15:00'),
      status: 'completed',
      statusText: 'مكتمل',
      isActive: true
    }
  ];

  filteredExams = [...this.exams];

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    // TODO: Load exams from API
  }

  onSearchChange(): void {
    this.filterExams();
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.filterExams();
  }

  filterExams(): void {
    this.filteredExams = this.exams.filter(exam => {
      const matchesSearch = !this.searchTerm ||
        exam.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        exam.groupName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.selectedStatus === 'all' || exam.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'upcoming':
        return 'bg-orange-100 text-orange-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  addNewExam(): void {
    // TODO: Navigate to add exam page
    console.log('Add new exam');
  }

  viewExam(exam: any): void {
    // TODO: Navigate to exam details
    console.log('View exam:', exam);
  }

  editExam(exam: any): void {
    // TODO: Navigate to edit exam
    console.log('Edit exam:', exam);
  }

  deleteExam(exam: any): void {
    // TODO: Show confirmation dialog and delete
    console.log('Delete exam:', exam);
  }

}

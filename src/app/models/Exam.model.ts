// src/app/models/Exam.model.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// ===== SUBJECT & GROUP =====
export interface Subject {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface Group {
  id: string;
  name: string;
  subjectId?: string;
  subjectName?: string;
}

// ===== EXAM =====
export interface Exam {
  id: string;
  title: string;
  description: string;
  groupId: string;
  groupName?: string;
  subjectId?: string;          // ✅
  subjectName?: string;         // ✅
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt?: Date;
  questionsCount?: number;
  questions?: Question[];
  group?: Group;                // ✅
  subject?: Subject;            // ✅
  avatar?: string;
  status?: string;
  statusText?: string;
}

// ===== QUESTION =====
export enum QuestionType {
  MultipleChoice = 0,
  TrueFalse = 1,
  Essay = 2
}

export interface Question {
  id: string;
  examId: string;
  questionText: string;
  type: QuestionType;
  marks: number;
  order: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

// ===== STUDENT EXAM =====
export enum ExamStatus {
  NotStarted = 0,
  InProgress = 1,
  Submitted = 2,
  Graded = 3
}

export interface StudentExam {
  id: string;
  examId: string;
  studentId: string;
  startedAt?: Date;
  submittedAt?: Date;
  score?: number;
  status: ExamStatus;
  exam?: Exam;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: string;
  studentExamId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  isCorrect?: boolean;
  marksObtained?: number;
  question?: Question;
  selectedOption?: QuestionOption;
}

// ===== DTOs for API =====
export interface CreateExamDto {
  id: string;
  title: string;
  description: string;
  groupId: string;
  subjectId?: string;           // ✅
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  questionsCount?: number;
  questions?: QuestionDto[];
}

export interface UpdateExamDto {
  id: string;
  title: string;
  description: string;
  groupId: string;
  subjectId?: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy?: string;        // ✅ Add this
  createdAt?: Date;          // ✅ Add this
  questionsCount?: number;
  questions?: QuestionDto[]; // ✅ Already present, just confirming
}

export interface QuestionDto {
  id: string;
  questionText: string;
  type: string;  // 'MultipleChoice' | 'TrueFalse' | 'Essay'
  marks: number;
  order: number;
  options?: QuestionOptionDto[];
}

export interface QuestionOptionDto {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface SubmitAnswerDto {
  studentExamId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
}

// ===== Student Exam History =====
export interface StudentExamHistoryDto {
  id: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  submittedAt?: Date;
  correctAnswers: number;
  wrongAnswers: number;
}
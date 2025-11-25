export interface Exam {
    id: string;
    title: string;
    description: string;
    groupId: string;
    groupName?: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    questions?: Question[];
    questionsCount?: number;
    group?: any;
    avatar?: string;
    status?: string;
    statusText?: string;
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

export enum QuestionType {
    MultipleChoice = 0,
    TrueFalse = 1,
    Essay = 2
}

export enum ExamStatus {
    NotStarted = 0,
    InProgress = 1,
    Submitted = 2,
    Graded = 3
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface CreateExamDto {
    title: string;
    description: string;
    groupId: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdBy: string;
}

export interface UpdateExamDto {
    id: string;
    title: string;
    description: string;
    groupId: string;
    duration: number;
    totalMarks: number;
    passingMarks: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}

export interface SubmitAnswerDto {
    studentExamId: string;
    questionId: string;
    selectedOptionId?: string;
    answerText?: string;
}
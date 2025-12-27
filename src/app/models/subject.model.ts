// src/models/subject.model.ts
export interface Subject {
  id: string;
  name: string;
  description?: string;
  code?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  totalStudents: number;
  totalTeachers: number;
}

export interface CreateSubjectDto {
  id?: string;
  name: string;
  description?: string;
  code?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
}

export interface UserSubject {
  id: string;
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  subjectId: string;
  subjectName: string;
  enrolledAt: string;
  isActive: boolean;
}

export interface SubjectStats {
  totalSubjects: number;
  activeSubjects: number;
  inactiveSubjects: number;
  totalEnrollments: number;
}

export interface AssignUsersDto {
  subjectId: string;
  userIds: string[];
}

export interface SubjectResponse {
  success: boolean;
  message: string;
  data?: Subject | Subject[] | UserSubject[];
}
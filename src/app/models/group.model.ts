export interface Group {
  id?: string;
  name: string;
  subject: string;
  instructorName?: string;
  assistantId?: string;
  assistantName?: string;
  capacity: number;
  currentStudents?: number;
  startDate?: string;
  feesPerLesson: number;
  isActive: boolean;
  dayOfWeek?: number;
  startTime?: string;
  durationInHours?: number;
  endTime?: string;
  location?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  groupId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
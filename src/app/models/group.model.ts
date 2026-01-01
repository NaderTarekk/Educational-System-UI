export interface Group {
  id?: string;
  name: string;
  subject?: string;
  
  // ✅ إضافة subjectEntity
  subjectId?: string | null;
  subjectEntity?: {
    id: string;
    name: string;
    description?: string;
    code?: string;
    color?: string;
    icon?: string;
    isActive: boolean;
    createdAt: string;
  } | null;
  subjectName?: string;
  
  instructorName?: string;
  assistantId?: string;
  assistantName?: string;
  assistant?: any;
  capacity: number;
  currentStudents?: number;
  startDate?: string;
  feesPerLesson: number;
  isActive: boolean;
  dayOfWeek: number | string; // ⬅️ يقبل "Monday" أو 1
  startTime: string;
  durationInHours: number;
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
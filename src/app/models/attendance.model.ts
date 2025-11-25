// attendance.model.ts
export interface Attendance {
  id?: string;
  studentId: string;
  studentName?: string;
  groupId: string;
  groupName?: string;
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
  markedAt?: string;
}

export enum AttendanceStatus {
  Present = 0,
  Absent = 1,
  Late = 2
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
  markedAt?: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  email: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  records: any[];
}

export interface BulkAttendance {
  groupId: string;
  date: string;
  markedBy: string;
  attendances: StudentAttendance[];
}

export interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentPercentage: number;
  absentPercentage: number;
  latePercentage: number;
}

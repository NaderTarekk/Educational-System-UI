export interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface CreateMessageDto {
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  recipientIds: string[];
  attachments?: any[];
}

export interface SendToAllDto {
  subject: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  attachments?: any[];
}

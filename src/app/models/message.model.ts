export interface Message {
    id: string;
    senderName: string;
    senderEmail: string;
    senderAvatar?: string;
    subject: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    isStarred: boolean;
    priority: 'low' | 'medium' | 'high';
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
}
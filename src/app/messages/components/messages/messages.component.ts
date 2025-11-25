import { Component, OnInit } from '@angular/core';
import { Message } from '../../../models/message.model';

@Component({
  selector: 'app-messages',
  standalone: false,
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  messages: Message[] = [];
  selectedMessage: Message | null = null;
  isViewDialogOpen = false;
  searchTerm = '';
  selectedFilter = 'all';
  isLoading = false;

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    // Mock data - استبدل هذا بـ API call
    this.messages = [
      {
        id: '1',
        senderName: 'أحمد محمد',
        senderEmail: 'ahmed@example.com',
        subject: 'استفسار عن الدورة التدريبية',
        content: 'السلام عليكم، أود الاستفسار عن تفاصيل الدورة التدريبية القادمة وكيفية التسجيل فيها. هل يمكنكم إرسال المزيد من المعلومات؟',
        timestamp: new Date('2024-01-15T10:30:00'),
        isRead: false,
        isStarred: true,
        priority: 'high',
        attachments: []
      },
      {
        id: '2',
        senderName: 'فاطمة علي',
        senderEmail: 'fatma@example.com',
        subject: 'طلب مساعدة تقنية',
        content: 'مرحباً، أواجه مشكلة في تسجيل الدخول إلى الحساب الخاص بي. هل يمكنكم المساعدة؟',
        timestamp: new Date('2024-01-15T09:15:00'),
        isRead: false,
        isStarred: false,
        priority: 'medium',
        attachments: [
          { id: '1', name: 'screenshot.png', size: 245000, type: 'image/png', url: '#' }
        ]
      },
      {
        id: '3',
        senderName: 'محمود حسن',
        senderEmail: 'mahmoud@example.com',
        subject: 'شكر وتقدير',
        content: 'أشكركم على الجهود المبذولة في تطوير المنصة. الخدمة ممتازة وأتمنى لكم التوفيق.',
        timestamp: new Date('2024-01-14T16:45:00'),
        isRead: true,
        isStarred: false,
        priority: 'low',
        attachments: []
      },
      {
        id: '4',
        senderName: 'نور الدين',
        senderEmail: 'nour@example.com',
        subject: 'اقتراح لتحسين النظام',
        content: 'لدي بعض الاقتراحات لتحسين واجهة المستخدم وإضافة ميزات جديدة. هل يمكننا مناقشة هذا الأمر؟',
        timestamp: new Date('2024-01-14T14:20:00'),
        isRead: true,
        isStarred: true,
        priority: 'medium',
        attachments: []
      },
      {
        id: '5',
        senderName: 'سارة أحمد',
        senderEmail: 'sara@example.com',
        subject: 'استفسار عن الأسعار',
        content: 'أرغب في معرفة تفاصيل الباقات المتاحة وأسعارها. هل يوجد عروض خاصة للطلاب؟',
        timestamp: new Date('2024-01-13T11:30:00'),
        isRead: true,
        isStarred: false,
        priority: 'low',
        attachments: []
      }
    ];
  }

  get filteredMessages(): Message[] {
    let filtered = this.messages;

    // Filter by search
    if (this.searchTerm) {
      filtered = filtered.filter(msg =>
        msg.senderName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        msg.subject.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filter by category
    switch (this.selectedFilter) {
      case 'unread':
        filtered = filtered.filter(msg => !msg.isRead);
        break;
      case 'starred':
        filtered = filtered.filter(msg => msg.isStarred);
        break;
      case 'high':
        filtered = filtered.filter(msg => msg.priority === 'high');
        break;
    }

    return filtered;
  }

  get unreadCount(): number {
    return this.messages.filter(msg => !msg.isRead).length;
  }

  get starredCount(): number {
    return this.messages.filter(msg => msg.isStarred).length;
  }

  get highPriorityCount(): number {
    return this.messages.filter(msg => msg.priority === 'high').length;
  }

  viewMessage(message: Message): void {
    this.selectedMessage = message;
    this.isViewDialogOpen = true;
    message.isRead = true;
    document.body.style.overflow = 'hidden';
  }

  closeViewDialog(): void {
    this.isViewDialogOpen = false;
    this.selectedMessage = null;
    document.body.style.overflow = 'auto';
  }

  toggleStar(message: Message, event: Event): void {
    event.stopPropagation();
    message.isStarred = !message.isStarred;
  }

  markAsRead(message: Message, event: Event): void {
    event.stopPropagation();
    message.isRead = !message.isRead;
  }

  deleteMessage(message: Message, event: Event): void {
    event.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      this.messages = this.messages.filter(m => m.id !== message.id);
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'عادي';
      default: return '';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    if (minutes > 0) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
    return 'الآن';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  downloadAttachment(attachment: any): void {
    console.log('Downloading:', attachment.name);
    // Implement download logic
  }

}

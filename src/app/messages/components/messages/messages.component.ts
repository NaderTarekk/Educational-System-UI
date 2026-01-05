// src/app/pages/messages/messages.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MessagesService, AdminUser, SendToAdminDto } from '../../services/messages.service';
import { AuthService } from '../../../auth/components/auth-service';
import { UsersService } from '../../../user/services/users.service';
import { ToastrService } from 'ngx-toastr';

interface Message {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  priority: 'Low' | 'Medium' | 'High';
  attachments: any[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-messages',
  standalone: false,
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  selectedMessage: Message | null = null;
  isViewDialogOpen = false;
  searchTerm = '';
  selectedFilter = 'all';
  isLoading = false;
  imageIndex = 0;

  selectedFiles: File[] = [];
  isDragging = false;
  fileSizeError: string = '';
  maxFileSize = 10 * 1024 * 1024;

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;

  stats: any = {
    total: 0,
    unread: 0,
    starred: 0,
    highPriority: 0
  };

  // Admin Compose
  isComposeDialogOpen = false;
  isSending = false;
  composeData = {
    recipientType: 'all',
    selectedUsers: [] as User[],
    priority: 'Low' as 'Low' | 'Medium' | 'High',
    subject: '',
    content: '',
    attachments: []
  };

  // Delete Dialog
  isDeleteDialogOpen = false;
  messageToDelete: Message | null = null;
  isDeleting = false;

  // User Selection (Admin)
  userSearchTerm = '';
  allUsers: User[] = [];
  filteredUsers: User[] = [];

  // ✅ Student Compose Dialog
  isStudentComposeOpen = false;
  studentComposeData = {
    recipientType: 'all-admins' as 'all-admins' | 'specific-admin',
    specificAdminId: '',
    priority: 'Low' as 'Low' | 'Medium' | 'High',
    subject: '',
    content: ''
  };
  adminsList: AdminUser[] = [];
  selectedAdmin: AdminUser | null = null;

  isAdmin = false;
  private searchSubject = new Subject<string>();

  constructor(
    private messageService: MessagesService,
    private userService: UsersService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.checkAdminRole();
    this.loadMessages();
    this.loadStats();

    if (this.isAdmin) {
      this.loadAllUsers();
    } else {
      // ✅ الطالب يحمّل قائمة الأدمن
      this.loadAdminsList();
    }

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadMessages();
      });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  checkAdminRole(): void {
    const userRole = this.authService.getCurrentUserRole();
    this.isAdmin = userRole === 'Admin' || userRole === 'Assistant';
  }

  // ✅ جلب قائمة الأدمن
  loadAdminsList(): void {
    this.messageService.getAdminsList().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.adminsList = response.data;
          console.log('📋 Admins list loaded:', this.adminsList);
        }
      },
      error: (error: any) => {
        console.error('Error loading admins:', error);
        this.toastr.error('فشل تحميل قائمة المسؤولين', 'خطأ');
      }
    });
  }

  // ✅ فتح نافذة الإرسال للطالب
  openStudentCompose(): void {
    this.isStudentComposeOpen = true;
    this.resetStudentComposeForm();
    document.body.style.overflow = 'hidden';
  }

  closeStudentCompose(): void {
    this.isStudentComposeOpen = false;
    this.resetStudentComposeForm();
    document.body.style.overflow = 'auto';
  }

  resetStudentComposeForm(): void {
    this.studentComposeData = {
      recipientType: 'all-admins',
      specificAdminId: '',
      priority: 'Low',
      subject: '',
      content: ''
    };
    this.selectedAdmin = null;
    this.selectedFiles = [];
    this.fileSizeError = '';
  }

  selectAdmin(admin: AdminUser): void {
    this.selectedAdmin = admin;
    this.studentComposeData.specificAdminId = admin.id;
    console.log('✅ Admin selected:', admin);
  }

  removeSelectedAdmin(): void {
    this.selectedAdmin = null;
    this.studentComposeData.specificAdminId = '';
  }

  isStudentFormValid(): boolean {
    if (!this.studentComposeData.subject.trim() || this.studentComposeData.subject.length < 3) {
      return false;
    }
    if (!this.studentComposeData.content.trim() || this.studentComposeData.content.length < 10) {
      return false;
    }
    if (this.studentComposeData.recipientType === 'specific-admin' && !this.studentComposeData.specificAdminId) {
      return false;
    }
    return true;
  }

  // sendStudentMessage(): void {
  //   if (!this.isStudentFormValid() || this.isSending) {
  //     this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
  //     return;
  //   }

  //   this.isSending = true;

  //   const dto: SendToAdminDto = {
  //     subject: this.studentComposeData.subject,
  //     content: this.studentComposeData.content,
  //     priority: this.studentComposeData.priority,
  //     specificAdminId: this.studentComposeData.recipientType === 'specific-admin' 
  //       ? this.studentComposeData.specificAdminId 
  //       : undefined
  //   };

  //   console.log('📤 Sending message to admin:', dto);

  //   this.messageService.sendToAdmin(dto).subscribe({
  //     next: (response: any) => {
  //       if (response.success) {
  //         this.toastr.success(response.message || 'تم إرسال الرسالة بنجاح', 'نجاح');
  //         this.closeStudentCompose();
  //       } else {
  //         this.toastr.error(response.message || 'فشل إرسال الرسالة', 'خطأ');
  //       }
  //       this.isSending = false;
  //     },
  //     error: (error: any) => {
  //       console.error('Error sending message:', error);
  //       this.toastr.error('حدث خطأ أثناء إرسال الرسالة', 'خطأ');
  //       this.isSending = false;
  //     }
  //   });
  // }

  // ... باقي الـ methods من الكود القديم

  loadAllUsers(): void {
    this.userService.getAllUsers(1, 1000).subscribe({
      next: (response: any) => {
        if (response.success && response.allUsers) {
          this.allUsers = response.allUsers;
        }
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.toastr.error('فشل تحميل قائمة المستخدمين', 'خطأ');
      }
    });
  }

  loadMessages(): void {
    this.isLoading = true;

    const params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.selectedFilter === 'unread') {
      params.isRead = false;
    } else if (this.selectedFilter === 'starred') {
      params.isStarred = true;
    } else if (this.selectedFilter === 'high') {
      params.priority = 'High';
    }

    if (this.searchTerm.trim()) {
      params.searchTerm = this.searchTerm.trim();
    }

    this.messageService.getMyMessages(params).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.success && response.data) {
          this.messages = response.data;
          this.totalPages = response.totalPages || 0;
          this.totalCount = response.totalCount || 0;
        } else {
          this.messages = [];
          this.totalPages = 0;
          this.totalCount = 0;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading messages:', error);
        this.messages = [];
        this.isLoading = false;
        this.toastr.error('فشل تحميل الرسائل', 'خطأ');
      }
    });
  }

  loadStats(): void {
    this.messageService.getStats().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.stats = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  openComposeDialog(): void {
    this.isComposeDialogOpen = true;
    this.resetComposeForm();
    document.body.style.overflow = 'hidden';
  }

  closeComposeDialog(): void {
    this.isComposeDialogOpen = false;
    this.resetComposeForm();
    document.body.style.overflow = 'auto';
  }

  resetComposeForm(): void {
    this.composeData = {
      recipientType: 'all',
      selectedUsers: [],
      priority: 'Low',
      subject: '',
      content: '',
      attachments: []
    };
    this.userSearchTerm = '';
    this.filteredUsers = [];
    this.selectedFiles = [];
    this.fileSizeError = '';
  }

  searchUsers(): void {
    if (!this.userSearchTerm.trim()) {
      this.filteredUsers = [];
      return;
    }

    const searchLower = this.userSearchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      !this.composeData.selectedUsers.find(u => u.id === user.id) &&
      (user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower))
    );
  }

  selectUser(user: User): void {
    if (!this.composeData.selectedUsers.find(u => u.id === user.id)) {
      this.composeData.selectedUsers.push(user);
      this.userSearchTerm = '';
      this.filteredUsers = [];
    }
  }

  removeUser(user: User): void {
    this.composeData.selectedUsers = this.composeData.selectedUsers.filter(u => u.id !== user.id);
  }

  isFormValid(): boolean {
    if (!this.composeData.subject.trim() || this.composeData.subject.length < 3) {
      return false;
    }
    if (!this.composeData.content.trim() || this.composeData.content.length < 10) {
      return false;
    }
    if (this.composeData.recipientType === 'specific' && this.composeData.selectedUsers.length === 0) {
      return false;
    }
    return true;
  }

  // في sendMessage() - للأدمن
  sendMessage(): void {
    if (!this.isFormValid() || this.isSending) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSending = true;

    const formData = new FormData();
    formData.append('subject', this.composeData.subject);
    formData.append('content', this.composeData.content);
    formData.append('priority', this.composeData.priority);

    // ✅ إضافة الملفات
    this.selectedFiles.forEach((file) => {
      formData.append('attachments', file, file.name);
    });

    if (this.composeData.recipientType === 'all') {
      this.messageService.sendToAll(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('تم إرسال الرسالة لجميع المستخدمين بنجاح', 'نجاح');
            this.closeComposeDialog();
            this.loadMessages();
            this.loadStats();
          } else {
            this.toastr.error(response.message || 'فشل إرسال الرسالة', 'خطأ');
          }
          this.isSending = false;
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
          this.toastr.error('حدث خطأ أثناء إرسال الرسالة', 'خطأ');
          this.isSending = false;
        }
      });
    } else if (this.composeData.recipientType === 'students') {
      this.messageService.sendToStudents(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success('تم إرسال الرسالة لجميع الطلاب بنجاح', 'نجاح');
            this.closeComposeDialog();
            this.loadMessages();
            this.loadStats();
          } else {
            this.toastr.error(response.message || 'فشل إرسال الرسالة', 'خطأ');
          }
          this.isSending = false;
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
          this.toastr.error('حدث خطأ أثناء إرسال الرسالة', 'خطأ');
          this.isSending = false;
        }
      });
    } else {
      // إضافة IDs للمستخدمين المحددين
      this.composeData.selectedUsers.forEach(user => {
        formData.append('recipientIds', user.id);
      });

      this.messageService.sendMessage(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastr.success(
              `تم إرسال الرسالة بنجاح إلى ${this.composeData.selectedUsers.length} مستخدم`,
              'نجاح'
            );
            this.closeComposeDialog();
            this.loadMessages();
            this.loadStats();
          } else {
            this.toastr.error(response.message || 'فشل إرسال الرسالة', 'خطأ');
          }
          this.isSending = false;
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
          this.toastr.error('حدث خطأ أثناء إرسال الرسالة', 'خطأ');
          this.isSending = false;
        }
      });
    }
  }

  // ✅ في sendStudentMessage() - للطلاب
  sendStudentMessage(): void {
    if (!this.isStudentFormValid() || this.isSending) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSending = true;

    // ✅ إنشاء FormData بدلاً من Object عادي
    const formData = new FormData();
    formData.append('subject', this.studentComposeData.subject);
    formData.append('content', this.studentComposeData.content);
    formData.append('priority', this.studentComposeData.priority);

    // إذا كان مسؤول محدد
    if (this.studentComposeData.recipientType === 'specific-admin' && this.studentComposeData.specificAdminId) {
      formData.append('specificAdminId', this.studentComposeData.specificAdminId);
    }

    // ✅ إضافة الملفات
    this.selectedFiles.forEach((file, index) => {
      formData.append(`attachments`, file, file.name);
    });

    console.log('📤 Sending FormData with files:', this.selectedFiles.length);

    this.messageService.sendToAdmin(formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success(response.message || 'تم إرسال الرسالة بنجاح', 'نجاح');
          this.closeStudentCompose();
        } else {
          this.toastr.error(response.message || 'فشل إرسال الرسالة', 'خطأ');
        }
        this.isSending = false;
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.toastr.error('حدث خطأ أثناء إرسال الرسالة', 'خطأ');
        this.isSending = false;
      }
    });
  }

  get unreadCount(): number {
    return this.stats.unread || 0;
  }

  get starredCount(): number {
    return this.stats.starred || 0;
  }

  get highPriorityCount(): number {
    return this.stats.highPriority || 0;
  }

  viewMessage(message: Message): void {
    this.messageService.getMessageById(message.id).subscribe({
      next: (response: any) => {
        console.log(response);
        
        if (response.success && response.data) {
          this.selectedMessage = response.data;
          this.isViewDialogOpen = true;
          document.body.style.overflow = 'hidden';

          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.messages[index].isRead = true;
          }

          this.loadStats();
        }
      },
      error: (error: any) => {
        console.error('Error loading message:', error);
        this.toastr.error('فشل تحميل الرسالة', 'خطأ');
      }
    });
  }

  closeViewDialog(): void {
    this.isViewDialogOpen = false;
    this.selectedMessage = null;
    document.body.style.overflow = 'auto';
  }

  toggleStar(message: Message, event: Event): void {
    event.stopPropagation();
    const newStarredState = !message.isStarred;

    this.messageService.updateMessageStatus(message.id, undefined, newStarredState).subscribe({
      next: (response: any) => {
        if (response.success) {
          message.isStarred = newStarredState;
          this.loadStats();
          this.toastr.success(
            newStarredState ? 'تم تمييز الرسالة' : 'تم إلغاء التمييز',
            'نجاح'
          );
        }
      },
      error: (error: any) => {
        console.error('Error updating star status:', error);
        this.toastr.error('فشل تحديث حالة التمييز', 'خطأ');
      }
    });
  }

  markAsRead(message: Message, event: Event): void {
    event.stopPropagation();
    const newReadState = !message.isRead;

    this.messageService.updateMessageStatus(message.id, newReadState, undefined).subscribe({
      next: (response: any) => {
        if (response.success) {
          message.isRead = newReadState;
          this.loadStats();
          this.toastr.success(
            newReadState ? 'تم وضع علامة مقروء' : 'تم وضع علامة غير مقروء',
            'نجاح'
          );
        }
      },
      error: (error: any) => {
        console.error('Error updating read status:', error);
        this.toastr.error('فشل تحديث حالة القراءة', 'خطأ');
      }
    });
  }

  openDeleteDialog(message: Message, event: Event): void {
    event.stopPropagation();
    this.messageToDelete = message;
    this.isDeleteDialogOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.messageToDelete = null;
    document.body.style.overflow = 'auto';
  }

  confirmDelete(): void {
    if (!this.messageToDelete || this.isDeleting) return;

    this.isDeleting = true;

    this.messageService.deleteMessage(this.messageToDelete.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.messages = this.messages.filter(m => m.id !== this.messageToDelete!.id);
          this.loadStats();

          if (this.selectedMessage?.id === this.messageToDelete!.id) {
            this.closeViewDialog();
          }

          this.toastr.success('تم حذف الرسالة بنجاح', 'نجاح');
          this.closeDeleteDialog();
        } else {
          this.toastr.error(response.message || 'فشل حذف الرسالة', 'خطأ');
        }
        this.isDeleting = false;
      },
      error: (error: any) => {
        console.error('Error deleting message:', error);
        this.toastr.error('حدث خطأ أثناء حذف الرسالة', 'خطأ');
        this.isDeleting = false;
      }
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-orange-600 bg-orange-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'High': return 'عاجل';
      case 'Medium': return 'متوسط';
      case 'Low': return 'عادي';
      default: return '';
    }
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
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
  // ✅ الـ fileName قد يكون name أو fileName حسب الـ Response
  const fileName = attachment.name || attachment.fileName || 'download';
  const fileUrl = attachment.url;

  console.log('📥 Downloading:', fileName, 'from:', fileUrl);

  this.toastr.info('جاري تحميل الملف...', 'تحميل');

  fetch(fileUrl, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName; // ✅ استخدام الـ fileName
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      this.toastr.success('تم تحميل الملف بنجاح ✅', 'نجاح');
    })
    .catch(error => {
      console.error('❌ Download Error:', error);
      
      if (error.message.includes('CORS')) {
        this.toastr.error('خطأ في إعدادات الأمان (CORS)', 'خطأ');
      } else if (error.message.includes('404')) {
        this.toastr.error('الملف غير موجود على السيرفر', 'خطأ');
      } else {
        this.toastr.error(`فشل تحميل الملف: ${error.message}`, 'خطأ');
      }
    });
}

  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.loadMessages();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMessages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMessages();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.addFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  addFiles(fileList: FileList): void {
    this.fileSizeError = '';

    Array.from(fileList).forEach(file => {
      if (file.size > this.maxFileSize) {
        this.fileSizeError = `الملف "${file.name}" أكبر من 10MB`;
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.fileSizeError = `نوع الملف "${file.name}" غير مدعوم`;
        return;
      }

      const exists = this.selectedFiles.find(f => f.name === file.name && f.size === file.size);
      if (!exists) {
        this.selectedFiles.push(file);
      }
    });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.fileSizeError = '';
  }

  clearAllFiles(): void {
    this.selectedFiles = [];
    this.fileSizeError = '';
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'txt':
        return 'fa-file-alt';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'fa-file-image';
      default:
        return 'fa-file';
    }
  }
}
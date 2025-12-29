// src/app/pages/videos/videos.component.ts

import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Video, VideoStats, CreateVideoDto, VideoFilter } from '../../../models/video.model';
import { VideosService } from '../../services/videos.service';
import { AuthService } from '../../../auth/components/auth-service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from '../../../models/subject.model';
import { Group } from '../../../models/group.model';
import { SubjectsService } from '../../../subjects/services/subject.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { HttpEventType } from '@angular/common/http';
import { environment } from '../../../environment';

@Component({
  selector: 'app-videos',
  standalone: false,
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent implements OnInit {
  videos: Video[] = [];
  stats: VideoStats = {
    totalVideos: 0,
    published: 0,
    draft: 0,
    totalViews: 0
  };

  contentType: 'youtube' | 'pdf' = 'youtube'; // ⬅️ بدل videoSource
  selectedPdfFile: File | null = null;

  searchText = '';
  selectedFilter = 'all';
  selectedSubject = 'all';
  selectedGroup = 'all';

  isDeleteDialogOpen = false;
  videoToDelete: Video | null = null;
  isDeleting = false;

  currentPage = 1;
  pageSize = 12;
  totalPages = 0;
  totalCount = 0;

  showUploadModal = false;
  showEditModal = false;
  showViewModal = false;
  uploadProgress = 0;
  isLoading = false;
  isSaving = false;

  subjects: Subject[] = [];
  groups: Group[] = [];

  newVideo: CreateVideoDto = {
    title: '',
    description: '',
    url: '',
    thumbnailUrl: '',
    duration: '',
    subject: '',
    grade: '',
    category: 'درس',
    fileSize: '',
    isPublished: false,
    videoSource: 'youtube',
    contentType: 'video', // ⬅️ صح
    pageCount: undefined // ⬅️ صح
  };
  videoSource: 'youtube' | 'local' = 'youtube';
  youtubeUrl = '';

  selectedVideo: Video | null = null;
  selectedFile: File | null = null;

  userRole: string = '';

  constructor(
    private videosService: VideosService,
    private authService: AuthService,
    private toastr: ToastrService,
    private subjectsService: SubjectsService,
    private groupsService: GroupsService
  ) { }

  ngOnInit() {
    this.userRole = this.authService.getCurrentUserRole();
    this.loadInitialData();
  }

  // ✅ تحميل البيانات الأولية
  loadInitialData() {
    const isStudent = this.userRole === 'Student';

    if (isStudent) {
      // ✅ للطالب: جلب المواد والمجموعات الخاصة به فقط
      forkJoin({
        subjects: this.subjectsService.getUserSubjects(),
        groups: this.groupsService.getUserGroups()
      }).subscribe({
        next: (results: any) => {
          if (results.subjects?.success && results.subjects?.data) {
            this.subjects = results.subjects.data;
            console.log('✅ Student Subjects:', this.subjects.length);
          }
          if (results.groups?.success && results.groups?.data) {
            this.groups = results.groups.data;
            console.log('✅ Student Groups:', this.groups.length);
          }

          this.loadVideos();
          this.loadStats();
        },
        error: (error) => {
          console.error('❌ Error loading student data:', error);
          this.toastr.error('فشل تحميل البيانات');
          this.loadVideos();
        }
      });
    } else {
      // ✅ للـ Admin/Assistant: جلب كل المواد والمجموعات
      forkJoin({
        subjects: this.subjectsService.getAllSubjects(),
        groups: this.groupsService.getAllGroups()
      }).subscribe({
        next: (results: any) => {
          if (results.subjects?.success && results.subjects?.data) {
            this.subjects = results.subjects.data;
            console.log('✅ All Subjects:', this.subjects.length);
          }
          if (results.groups?.success && results.groups?.data) {
            this.groups = results.groups.data;
            console.log('✅ All Groups:', this.groups.length);
          }

          this.loadVideos();
          this.loadStats();
        },
        error: (error) => {
          console.error('❌ Error loading admin data:', error);
          this.toastr.error('فشل تحميل البيانات');
          this.loadVideos();
        }
      });
    }
  }

  loadVideos() {
    this.isLoading = true;

    const filter: VideoFilter = {
      status: this.selectedFilter,
      subject: this.selectedSubject !== 'all' ? this.selectedSubject : undefined,
      grade: this.selectedGroup !== 'all' ? this.selectedGroup : undefined,
      searchText: this.searchText || undefined,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    this.videosService.getVideos(filter).subscribe({
      next: (response: any) => {
        console.log(response);
        
        if (response.success && response.data) {
          this.videos = Array.isArray(response.data) ? response.data : [response.data];
          this.totalCount = response.totalCount || 0;
          this.totalPages = response.totalPages || 0;
        } else {
          this.videos = [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading videos:', error);
        this.toastr.error('فشل تحميل الفيديوهات', 'خطأ');
        this.videos = [];
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.videosService.getStats().subscribe({
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

  filterVideos(filter: string) {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.loadVideos();
  }

  onSubjectChange() {
    this.currentPage = 1;
    this.loadVideos();
  }

  onGroupChange() {
    this.currentPage = 1;
    this.loadVideos();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadVideos();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadVideos();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadVideos();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadVideos();
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'درس': 'bg-blue-100 text-blue-700',
      'تجربة عملية': 'bg-purple-100 text-purple-700',
      'مراجعة': 'bg-green-100 text-green-700',
      'اختبار': 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  }

  getGroupName(groupId: string): string {
    if (!groupId) return 'غير محدد';
    const group = this.groups.find(g => g.id === groupId);
    return group?.name || groupId;
  }

  getSubjectName(subjectName: string): string {
    const subject = this.subjects.find(s => s.name === subjectName);
    return subject?.name || subjectName;
  }

  viewVideo(video: Video) {
    this.selectedVideo = video;
    this.showViewModal = true;
    document.body.style.overflow = 'hidden';

    this.videosService.incrementView(video.id).subscribe({
      next: () => {
        video.views++;
      },
      error: (error: any) => {
        console.error('Error incrementing view:', error);
      }
    });
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedVideo = null;
    document.body.style.overflow = 'auto';
  }

  toggleLike(video: Video) {
    this.videosService.toggleLike(video.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          video.isLikedByCurrentUser = !video.isLikedByCurrentUser;
          video.likes += video.isLikedByCurrentUser ? 1 : -1;
          this.toastr.success(response.message, 'نجاح');
        }
      },
      error: (error: any) => {
        console.error('Error toggling like:', error);
        this.toastr.error('حدث خطأ', 'خطأ');
      }
    });
  }

  editVideo(video: Video) {
    this.selectedVideo = video;
    this.newVideo = {
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      category: video.category,
      subject: video.subject,
      grade: video.grade,
      fileSize: video.fileSize,
      isPublished: video.isPublished,
      contentType: video.contentType || 'video', // ⬅️ أضف
      pageCount: video.pageCount // ⬅️ أضف
    };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedVideo = null;
    this.resetForm();
    document.body.style.overflow = 'auto';
  }

  updateVideo() {
    if (!this.isFormValid()) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSaving = true;

    this.videosService.updateVideo(this.newVideo).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم تحديث الفيديو بنجاح', 'نجاح');
          this.closeEditModal();
          this.loadVideos();
          this.loadStats();
        } else {
          this.toastr.error(response.message || 'فشل تحديث الفيديو', 'خطأ');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error updating video:', error);
        this.toastr.error('حدث خطأ أثناء تحديث الفيديو', 'خطأ');
        this.isSaving = false;
      }
    });
  }

  openDeleteDialog(video: Video) {
    this.videoToDelete = video;
    this.isDeleteDialogOpen = true;
  }

  closeDeleteDialog() {
    if (this.isDeleting) return;
    this.isDeleteDialogOpen = false;
    this.videoToDelete = null;
  }

  confirmDeleteVideo() {
    if (!this.videoToDelete) return;

    this.isDeleting = true;
    this.videosService.deleteVideo(this.videoToDelete.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم حذف الفيديو بنجاح', 'نجاح');
          this.loadVideos();
          this.loadStats();
        } else {
          this.toastr.error(response.message || 'فشل حذف الفيديو', 'خطأ');
        }
        this.isDeleting = false;
        this.closeDeleteDialog();
      },
      error: (error: any) => {
        console.error('Error deleting video:', error);
        this.toastr.error('حدث خطأ أثناء حذف الفيديو', 'خطأ');
        this.isDeleting = false;
        this.closeDeleteDialog();
      }
    });
  }

  togglePublish(video: Video) {
    this.videosService.togglePublish(video.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          video.isPublished = !video.isPublished;
          this.toastr.success(response.message, 'نجاح');
          this.loadStats();
        } else {
          this.toastr.error(response.message || 'فشل تحديث حالة النشر', 'خطأ');
        }
      },
      error: (error: any) => {
        console.error('Error toggling publish:', error);
        this.toastr.error('حدث خطأ', 'خطأ');
      }
    });
  }

  openUploadModal() {
    this.resetForm();
    this.showUploadModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetForm();
    document.body.style.overflow = 'auto';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.newVideo.fileSize = `${fileSizeMB} MB`;

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        this.newVideo.duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      };
      video.src = URL.createObjectURL(file);
    }
  }

  isFormValid(): boolean {
    const { title, subject, grade, category } = this.newVideo;
    return !!(
      title?.trim() && title.trim().length >= 3 &&
      subject?.trim() &&
      grade?.trim() &&
      category?.trim()
    );
  }

  extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  saveVideo() {
    this.videosService.createVideo(this.newVideo).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastr.success('تم رفع الفيديو بنجاح!', 'نجاح');
          this.closeUploadModal();
          this.loadVideos();
          this.loadStats();
        } else {
          this.toastr.error(response.message || 'فشل رفع الفيديو', 'خطأ');
        }
        this.isSaving = false;
      },
      error: (error: any) => {
        console.error('Error uploading video:', error);
        this.toastr.error('حدث خطأ أثناء رفع الفيديو', 'خطأ');
        this.isSaving = false;
      }
    });
  }

  isYouTubeVideo(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }


  getFilteredVideos(): Video[] {
    return this.videos;
  }

  canEdit(): boolean {
    return this.userRole === 'Admin' || this.userRole === 'Assistant';
  }

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdfFile = file;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.newVideo.fileSize = `${fileSizeMB} MB`;
    } else {
      this.toastr.error('يرجى اختيار ملف PDF صالح');
    }
  }

  // ✅ عدّل uploadVideo
  uploadVideo() {
    if (!this.isFormValid()) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    this.isSaving = true;

    if (this.contentType === 'youtube') {
      // ✅ YouTube Video
      if (!this.youtubeUrl) {
        this.toastr.warning('يرجى إدخال رابط YouTube', 'تنبيه');
        this.isSaving = false;
        return;
      }

      const videoId = this.extractYouTubeId(this.youtubeUrl);
      if (!videoId) {
        this.toastr.error('رابط YouTube غير صحيح', 'خطأ');
        this.isSaving = false;
        return;
      }

      this.newVideo.url = `https://www.youtube.com/embed/${videoId}`;
      this.newVideo.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      this.newVideo.fileSize = 'YouTube';
      this.newVideo.duration = '00:00';
      this.newVideo.contentType = 'video';

      this.saveVideo();

    } else if (this.contentType === 'pdf') {
      // ✅ PDF Upload
      if (!this.selectedPdfFile) {
        this.toastr.warning('يرجى اختيار ملف PDF', 'تنبيه');
        this.isSaving = false;
        return;
      }

      this.videosService.uploadPdfFile(this.selectedPdfFile).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
          } else if (event.type === HttpEventType.Response) {
            if (event.body.success) {
              this.newVideo.url = `${environment.baseUrl}${event.body.url}`;
              this.newVideo.fileSize = event.body.fileSize;
              this.newVideo.pageCount = event.body.pageCount;
              this.newVideo.thumbnailUrl = 'https://via.placeholder.com/320x180/FF6B35/FFFFFF?text=PDF';
              this.newVideo.duration = `${event.body.pageCount} صفحة`;
              this.newVideo.contentType = 'pdf';
              this.saveVideo();
            }
          }
        },
        error: (error) => {
          console.error('Error uploading PDF:', error);
          this.toastr.error('حدث خطأ أثناء رفع الملف');
          this.isSaving = false;
          this.uploadProgress = 0;
        }
      });
    }
  }

  // ✅ أضف helper للتحقق من نوع المحتوى
  isPdf(video: Video): boolean {
    return video.contentType === 'pdf';
  }

  // ✅ عدّل resetForm
  resetForm() {
    this.newVideo = {
      title: '',
      description: '',
      url: '',
      thumbnailUrl: '',
      duration: '',
      subject: '',
      grade: '',
      category: 'درس',
      fileSize: '',
      isPublished: false,
      contentType: 'video'
    };
    this.selectedFile = null;
    this.selectedPdfFile = null;
    this.uploadProgress = 0;
    this.contentType = 'youtube';
    this.youtubeUrl = '';
  }

}
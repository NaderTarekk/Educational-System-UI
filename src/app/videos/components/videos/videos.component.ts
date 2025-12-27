// src/app/pages/videos/videos.component.ts
import { Component, OnInit } from '@angular/core';
import { Video, VideoStats, CreateVideoDto, VideoFilter } from '../../../models/video.model';
import { VideosService } from '../../services/videos.service';
import { AuthService } from '../../../auth/components/auth-service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from '../../../models/subject.model'; // ⬅️ أضف
import { Group } from '../../../models/group.model'; // ⬅️ أضف
import { SubjectsService } from '../../../subjects/services/subject.service';
import { GroupsService } from '../../../groups/services/groups.service';

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

  searchText = '';
  selectedFilter = 'all';
  selectedSubject = 'all';
  selectedGroup = 'all'; // ⬅️ غيرنا من selectedGrade

  // ✅ Dialog State
  isDeleteDialogOpen = false;
  videoToDelete: Video | null = null;
  isDeleting = false;

  // Pagination
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

  // ✅ Lists من Database
  subjects: Subject[] = [];
  groups: Group[] = [];

  newVideo: CreateVideoDto = {
    title: '',
    description: '',
    url: '',
    thumbnailUrl: '',
    duration: '',
    subject: '',
    grade: '', // ⬅️ هيبقى groupId
    category: 'درس',
    fileSize: '',
    isPublished: false,
    videoSource: 'youtube'
  };
  videoSource: 'youtube' | 'local' = 'youtube';
  youtubeUrl = '';

  selectedVideo: Video | null = null;
  selectedFile: File | null = null;

  // User role
  userRole: string = '';

  constructor(
    private videosService: VideosService,
    private authService: AuthService,
    private toastr: ToastrService,
    private subjectsService: SubjectsService, // ⬅️ أضف
    private groupsService: GroupsService // ⬅️ أضف
  ) { }

  ngOnInit() {
    this.userRole = this.authService.getCurrentUserRole();
    this.loadSubjects(); // ⬅️ أضف
    this.loadGroups(); // ⬅️ أضف
    this.loadVideos();
    this.loadStats();
  }

  // ✅ تحميل المواد من Database
  loadSubjects() {
    this.subjectsService.getAllSubjects().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subjects = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  // ✅ تحميل المجموعات من Database
  loadGroups() {
    this.groupsService.getAllGroups().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.groups = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading groups:', error);
      }
    });
  }

  loadVideos() {
    this.isLoading = true;

    const filter: VideoFilter = {
      status: this.selectedFilter,
      subject: this.selectedSubject !== 'all' ? this.selectedSubject : undefined,
      grade: this.selectedGroup !== 'all' ? this.selectedGroup : undefined, // ⬅️ groupId
      searchText: this.searchText || undefined,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    this.videosService.getVideos(filter).subscribe({
      next: (response: any) => {
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

  onGroupChange() { // ⬅️ غيرنا من onGradeChange
    this.currentPage = 1;
    this.loadVideos();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadVideos();
  }

  // Pagination
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

  // ✅ Helper: Get Group Name by ID
  getGroupName(groupId: string): string {
    const group = this.groups.find(g => g.id === groupId);
    return group?.name || groupId;
  }

  // ✅ Helper: Get Subject Name by Name
  getSubjectName(subjectName: string): string {
    const subject = this.subjects.find(s => s.name === subjectName);
    return subject?.name || subjectName;
  }

  // View Video
  viewVideo(video: Video) {
    console.log(video);

    this.selectedVideo = video;
    this.showViewModal = true;
    document.body.style.overflow = 'hidden';

    // Increment view count
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

  // Like Video
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

  // Edit Video
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
      grade: video.grade, // groupId
      fileSize: video.fileSize,
      isPublished: video.isPublished
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

  // Delete Video
  // ✅ Delete Video Dialog
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

  // Toggle Publish
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

  // Upload Modal
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

      // Get file size
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.newVideo.fileSize = `${fileSizeMB} MB`;

      // Get video duration (requires HTML5 video element)
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

  // uploadVideo() {
  //   if (!this.isFormValid()) {
  //     this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
  //     return;
  //   }

  //   if (!this.selectedFile) {
  //     this.toastr.warning('يرجى اختيار ملف فيديو', 'تنبيه');
  //     return;
  //   }

  //   this.isSaving = true;

  //   // محاكاة رفع الفيديو
  //   this.uploadProgress = 0;
  //   const interval = setInterval(() => {
  //     this.uploadProgress += 10;

  //     if (this.uploadProgress >= 100) {
  //       clearInterval(interval);

  //       // بعد اكتمال الرفع، احفظ البيانات
  //       this.newVideo.url = `https://example.com/videos/${Date.now()}.mp4`;
  //       this.newVideo.thumbnailUrl = `https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=${encodeURIComponent(this.newVideo.title)}`;

  //       this.videosService.createVideo(this.newVideo).subscribe({
  //         next: (response: any) => {
  //           if (response.success) {
  //             this.toastr.success('تم رفع الفيديو بنجاح!', 'نجاح');
  //             this.closeUploadModal();
  //             this.loadVideos();
  //             this.loadStats();
  //           } else {
  //             this.toastr.error(response.message || 'فشل رفع الفيديو', 'خطأ');
  //           }
  //           this.isSaving = false;
  //         },
  //         error: (error: any) => {
  //           console.error('Error uploading video:', error);
  //           this.toastr.error('حدث خطأ أثناء رفع الفيديو', 'خطأ');
  //           this.isSaving = false;
  //         }
  //       });
  //     }
  //   }, 300);
  // }

  // resetForm() {
  //   this.newVideo = {
  //     title: '',
  //     description: '',
  //     url: '',
  //     thumbnailUrl: '',
  //     duration: '',
  //     subject: '',
  //     grade: '', // groupId
  //     category: 'درس',
  //     fileSize: '',
  //     isPublished: false
  //   };
  //   this.selectedFile = null;
  //   this.uploadProgress = 0;
  // }

  getFilteredVideos(): Video[] {
    return this.videos;
  }

  // Check if user can edit/delete
  canEdit(): boolean {
    return this.userRole === 'Admin' || this.userRole === 'Assistant';
  }

  // video 
  uploadVideo() {
    if (!this.isFormValid()) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تنبيه');
      return;
    }

    // ✅ YouTube Video
    if (this.videoSource === 'youtube') {
      if (!this.youtubeUrl) {
        this.toastr.warning('يرجى إدخال رابط YouTube', 'تنبيه');
        return;
      }

      this.isSaving = true;

      // استخرج YouTube ID
      const videoId = this.extractYouTubeId(this.youtubeUrl);
      if (!videoId) {
        this.toastr.error('رابط YouTube غير صحيح', 'خطأ');
        this.isSaving = false;
        return;
      }

      this.newVideo.url = `https://www.youtube.com/embed/${videoId}`;
      this.newVideo.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      this.newVideo.fileSize = 'YouTube';
      this.newVideo.duration = this.newVideo.duration || '00:00';

      this.saveVideo();

    } else {
      // ✅ Local Video (مش شغال دلوقتي)
      this.toastr.warning('رفع الفيديوهات المحلية قيد التطوير', 'تنبيه');
    }
  }

  // ✅ أضف الدالة دي (جديدة)
  extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  // ✅ أضف الدالة دي (جديدة)
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

  // ✅ عدل resetForm()
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
      isPublished: false
    };
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.videoSource = 'youtube'; // ⬅️ أضف
    this.youtubeUrl = ''; // ⬅️ أضف
  }
}
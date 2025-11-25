import { Component, OnInit } from '@angular/core';
import { Video, VideoStats } from '../../../models/video.model';

@Component({
  selector: 'app-videos',
  standalone: false,
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent implements OnInit {
  videos: Video[] = [];
  stats: VideoStats = {
    totalVideos: 48,
    published: 35,
    draft: 13,
    totalViews: 12500
  };
  
  searchText = '';
  selectedFilter = 'all';
  selectedSubject = 'all';
  selectedGrade = 'all';
  
  showUploadModal = false;
  uploadProgress = 0;
  
  subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'الفيزياء', 'الكيمياء'];
  grades = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'];

  newVideo = {
    title: '',
    description: '',
    subject: '',
    grade: '',
    category: 'درس',
    file: null as File | null
  };

  ngOnInit() {
    this.loadVideos();
  }

  loadVideos() {
    this.videos = [
      {
        id: '1',
        title: 'مقدمة في الجبر الخطي',
        description: 'شرح تفصيلي لأساسيات الجبر الخطي والمصفوفات',
        url: 'https://example.com/video1.mp4',
        thumbnail: 'https://via.placeholder.com/320x180/4F46E5/FFFFFF?text=الجبر+الخطي',
        duration: '45:30',
        category: 'درس',
        subject: 'الرياضيات',
        grade: 'الصف الثالث',
        uploadedBy: 'TCH001',
        uploadedByUser: {
          id: '1',
          userName: 'ahmed.teacher',
          fullName: 'أحمد المعلم'
        },
        views: 1250,
        likes: 320,
        isPublished: true,
        uploadDate: '2024-11-10',
        fileSize: '450 MB'
      },
      {
        id: '2',
        title: 'تجارب الكيمياء العضوية',
        description: 'تجارب عملية في الكيمياء العضوية',
        url: 'https://example.com/video2.mp4',
        thumbnail: 'https://via.placeholder.com/320x180/7C3AED/FFFFFF?text=الكيمياء',
        duration: '32:15',
        category: 'تجربة عملية',
        subject: 'الكيمياء',
        grade: 'الصف الثاني',
        uploadedBy: 'TCH002',
        uploadedByUser: {
          id: '2',
          userName: 'fatima.teacher',
          fullName: 'فاطمة الأستاذة'
        },
        views: 890,
        likes: 210,
        isPublished: true,
        uploadDate: '2024-11-09',
        fileSize: '320 MB'
      },
      {
        id: '3',
        title: 'قواعد اللغة الإنجليزية',
        description: 'شرح قواعد الأزمنة في اللغة الإنجليزية',
        url: 'https://example.com/video3.mp4',
        thumbnail: 'https://via.placeholder.com/320x180/059669/FFFFFF?text=English',
        duration: '28:45',
        category: 'درس',
        subject: 'اللغة الإنجليزية',
        grade: 'الصف الأول',
        uploadedBy: 'TCH003',
        uploadedByUser: {
          id: '3',
          userName: 'omar.teacher',
          fullName: 'عمر المدرس'
        },
        views: 2100,
        likes: 540,
        isPublished: true,
        uploadDate: '2024-11-08',
        fileSize: '280 MB'
      },
      {
        id: '4',
        title: 'الفيزياء الكلاسيكية',
        description: 'مقدمة في قوانين نيوتن للحركة',
        url: 'https://example.com/video4.mp4',
        thumbnail: 'https://via.placeholder.com/320x180/DC2626/FFFFFF?text=الفيزياء',
        duration: '38:20',
        category: 'درس',
        subject: 'الفيزياء',
        grade: 'الصف الثالث',
        uploadedBy: 'TCH001',
        uploadedByUser: {
          id: '1',
          userName: 'ahmed.teacher',
          fullName: 'أحمد المعلم'
        },
        views: 650,
        likes: 180,
        isPublished: false,
        uploadDate: '2024-11-07',
        fileSize: '380 MB'
      }
    ];
  }

  filterVideos(filter: string) {
    this.selectedFilter = filter;
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

  viewVideo(id: string) {
    console.log('View video:', id);
  }

  editVideo(id: string) {
    console.log('Edit video:', id);
  }

  deleteVideo(id: string) {
    if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      this.videos = this.videos.filter(v => v.id !== id);
      console.log('Delete video:', id);
    }
  }

  togglePublish(video: Video) {
    video.isPublished = !video.isPublished;
    console.log('Toggle publish:', video.id, video.isPublished);
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetForm();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newVideo.file = file;
      console.log('File selected:', file.name);
    }
  }

  uploadVideo() {
    if (!this.newVideo.file || !this.newVideo.title || !this.newVideo.subject || !this.newVideo.grade) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    // محاكاة رفع الفيديو
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          alert('تم رفع الفيديو بنجاح!');
          this.closeUploadModal();
          this.loadVideos();
        }, 500);
      }
    }, 300);
  }

  resetForm() {
    this.newVideo = {
      title: '',
      description: '',
      subject: '',
      grade: '',
      category: 'درس',
      file: null
    };
    this.uploadProgress = 0;
  }

  getFilteredVideos(): Video[] {
    let filtered = this.videos;

    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(v => 
        this.selectedFilter === 'published' ? v.isPublished : !v.isPublished
      );
    }

    if (this.selectedSubject !== 'all') {
      filtered = filtered.filter(v => v.subject === this.selectedSubject);
    }

    if (this.selectedGrade !== 'all') {
      filtered = filtered.filter(v => v.grade === this.selectedGrade);
    }

    if (this.searchText) {
      filtered = filtered.filter(v => 
        v.title.includes(this.searchText) || 
        v.description.includes(this.searchText)
      );
    }

    return filtered;
  }

}

import { Component, OnInit } from '@angular/core';
import { ApplicationUser } from '../../../models/applicationUser.model';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: ApplicationUser = {
    id: '1',
    firstName: 'محمد',
    lastName: 'أحمد',
    email: 'mohamed.ahmed@example.com',
    phoneNumber: '+966501234567',
    role: 'student',
    groupId: '1',
    group: { id: '1', name: 'الصف الثالث الثانوي - المجموعة أ' },
    profileImage: '',
    bio: 'طالب مجتهد يسعى للتميز في مجال العلوم والتكنولوجيا'
  };

  editUser: ApplicationUser = { ...this.user };

  stats = {
    courses: 12,
    completed: 8,
    certificates: 5
  };

  tabs = [
    { id: 'about', label: 'نبذة عني' },
    { id: 'activity', label: 'النشاط' },
    { id: 'settings', label: 'الإعدادات' }
  ];

  activeTab = 'about';
  showEditModal = false;

  recentActivities = [
    {
      type: 'course',
      title: 'أكمل درس جديد',
      description: 'أساسيات البرمجة بلغة Python - الوحدة 3',
      time: 'منذ ساعتين'
    },
    {
      type: 'certificate',
      title: 'حصل على شهادة',
      description: 'شهادة إتمام دورة تطوير تطبيقات الويب',
      time: 'منذ يوم واحد'
    },
    {
      type: 'quiz',
      title: 'أجرى اختبار',
      description: 'اختبار الوحدة الثانية - الرياضيات المتقدمة',
      time: 'منذ 3 أيام'
    },
    {
      type: 'achievement',
      title: 'فتح إنجاز جديد',
      description: 'إنجاز "الطالب المثابر" - 30 يوم متتالي من التعلم',
      time: 'منذ 5 أيام'
    }
  ];

  currentCourses = [
    {
      title: 'أساسيات البرمجة بلغة Python',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
      duration: '12 ساعة',
      progress: 65
    },
    {
      title: 'تطوير تطبيقات الويب الحديثة',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
      duration: '20 ساعة',
      progress: 40
    },
    {
      title: 'الذكاء الاصطناعي للمبتدئين',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      duration: '15 ساعة',
      progress: 25
    },
    {
      title: 'قواعد البيانات وSQL',
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400',
      duration: '10 ساعات',
      progress: 80
    }
  ];

  achievements = [
    { icon: '🏆', title: 'المتميز', description: '10 دورات مكتملة', unlocked: true },
    { icon: '⭐', title: 'النجم', description: '5 شهادات', unlocked: true },
    { icon: '🎯', title: 'الهدف', description: '100% في اختبار', unlocked: true },
    { icon: '🔥', title: 'المثابر', description: '30 يوم متتالي', unlocked: true },
    { icon: '📚', title: 'القارئ', description: '50 درس مكتمل', unlocked: false },
    { icon: '💡', title: 'المبتكر', description: 'مشروع متميز', unlocked: false },
    { icon: '🎓', title: 'الخريج', description: '20 دورة مكتملة', unlocked: false },
    { icon: '👑', title: 'الملك', description: 'أعلى نقاط', unlocked: false }
  ];

  ngOnInit(): void {
    // Load user data
  }

  getRoleDisplayName(role: string): string {
    const roles: any = {
      'admin': 'مدير النظام',
      'teacher': 'معلم',
      'student': 'طالب'
    };
    return roles[role] || role;
  }

  getRoleBadgeColor(role: string): string {
    const colors: any = {
      'admin': 'bg-red-100 text-red-700',
      'teacher': 'bg-blue-100 text-blue-700',
      'student': 'bg-green-100 text-green-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  }

  getActivityIconColor(type: string): string {
    const colors: any = {
      'course': 'bg-blue-100 text-blue-600',
      'certificate': 'bg-green-100 text-green-600',
      'quiz': 'bg-purple-100 text-purple-600',
      'achievement': 'bg-yellow-100 text-yellow-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  }

  getActivityIcon(type: string): string {
    // Return SVG path for different activity types
    return '';
  }

  editProfile(): void {
    this.editUser = { ...this.user };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveProfile(): void {
    this.user = { ...this.editUser };
    this.closeEditModal();
    // Call API to save user data
  }

  changeProfileImage(): void {
    // Open file picker
  }

  changeCover(): void {
    // Open file picker for cover image
  }

  goBack(): void {
    // Navigate back
  }

  deactivateAccount(): void {
    // Show confirmation and deactivate
  }

  deleteAccount(): void {
    // Show confirmation and delete
  }

}

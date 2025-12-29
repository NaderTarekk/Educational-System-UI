// src/models/video.model.ts
export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  category: string;
  subject: string;
  grade: string;
  uploadedBy: string;
  uploadedByUser: UserBasicInfo;
  views: number;
  likes: number;
  isPublished: boolean;
  fileSize?: string;
  uploadDate: string;
  isLikedByCurrentUser: boolean;
    contentType: 'video' | 'pdf'; // ⬅️ أضف
  pageCount?: number; // ⬅️ أضف
}

export interface UserBasicInfo {
  id: string;
  userName: string;
  fullName: string;
}

export interface CreateVideoDto {
  id?: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  category: string;
  subject: string;
  grade: string;
  videoSource?: string;
  fileSize?: string;
  isPublished: boolean;
  userIds?: string[];
  groupIds?: string[];
    contentType: 'video' | 'pdf'; // ⬅️ أضف
  pageCount?: number; // ⬅️ أضف
}

export interface VideoStats {
  totalVideos: number;
  published: number;
  draft: number;
  totalViews: number;
}

export interface VideoFilter {
  userId?: string;
  status?: string;
  subject?: string;
  grade?: string;
  searchText?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface VideoResponse {
  success: boolean;
  message: string;
  data?: Video | Video[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}
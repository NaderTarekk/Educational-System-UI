export interface Video {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    duration: string;
    category: string;
    subject: string;
    grade: string;
    uploadedBy: string;
    uploadedByUser: {
        id: string;
        userName: string;
        fullName: string;
    };
    views: number;
    likes: number;
    isPublished: boolean;
    uploadDate: string;
    fileSize: string;
}

export interface VideoStats {
    totalVideos: number;
    published: number;
    draft: number;
    totalViews: number;
}
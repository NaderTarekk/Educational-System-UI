import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CreateVideoDto, VideoFilter, VideoResponse } from '../../models/video.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VideosService {

  private apiUrl = `${environment.videoUrl}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('NHC_PL_Token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all videos with filters
  getVideos(filter: VideoFilter): Observable<VideoResponse> {
    let params = new HttpParams();

    if (filter.status) params = params.set('status', filter.status);
    if (filter.subject) params = params.set('subject', filter.subject);
    if (filter.grade) params = params.set('grade', filter.grade);
    if (filter.searchText) params = params.set('searchText', filter.searchText);
    if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<VideoResponse>(this.apiUrl, { headers: this.getHeaders(), params });
  }

  // Get video by ID
  getVideoById(id: string): Observable<VideoResponse> {
    return this.http.get<VideoResponse>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Get stats
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  // Create video
  createVideo(dto: CreateVideoDto): Observable<any> {
    return this.http.post(this.apiUrl, dto, { headers: this.getHeaders() });
  }

  // Update video
  updateVideo(dto: CreateVideoDto): Observable<any> {
    return this.http.put(this.apiUrl, dto, { headers: this.getHeaders() });
  }

  // Delete video
  deleteVideo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Toggle publish
  togglePublish(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/toggle-publish`, {}, { headers: this.getHeaders() });
  }

  // Increment view
  incrementView(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/view`, {}, { headers: this.getHeaders() });
  }

  // Toggle like
  toggleLike(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/like`, {}, { headers: this.getHeaders() });
  }

  uploadPdfFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('NHC_PL_Token');
    return this.http.post(`${this.apiUrl}/upload-pdf`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }),
      reportProgress: true,
      observe: 'events'
    });
  }
}

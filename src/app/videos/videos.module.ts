import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideosComponent } from './components/videos/videos.component';
import { VideoRoutingModule } from '../routing/video-routing.module';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    VideosComponent
  ],
  imports: [
    CommonModule,
    VideoRoutingModule,
    FormsModule
  ]
})
export class VideosModule { }

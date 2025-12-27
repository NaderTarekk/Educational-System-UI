import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideosComponent } from './components/videos/videos.component';
import { VideoRoutingModule } from '../routing/video-routing.module';
import { FormsModule } from '@angular/forms';
import { SafePipe } from '../pipes/safe-pipe.pipe';



@NgModule({
  declarations: [
    VideosComponent,
    SafePipe
  ],
  imports: [
    CommonModule,
    VideoRoutingModule,
    FormsModule,
  ]
})
export class VideosModule { }

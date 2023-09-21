import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideosListComponent } from './videos-list/videos-list.component';
import { MaterialModule } from '../material.module';
import { VideoInfoComponent } from './video-info/video-info.component';
import { ProcessingStateComponent } from './processing-state/processing-state.component';



@NgModule({
  declarations: [
    VideosListComponent,
    VideoInfoComponent,
    ProcessingStateComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [
    VideosListComponent,
    VideoInfoComponent,
    ProcessingStateComponent
  ]
})
export class WidgetsModule { }

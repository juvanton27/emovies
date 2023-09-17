import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetsModule } from '../../widgets/widgets.module';
import { VideosComponent } from './videos.component';



@NgModule({
  declarations: [
    VideosComponent
  ],
  imports: [
    CommonModule,
    WidgetsModule,
  ]
})
export class VideosModule { }

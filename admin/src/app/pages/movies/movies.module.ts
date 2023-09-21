import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetsModule } from '../../widgets/widgets.module';
import { MoviesComponent } from './movies.component';



@NgModule({
  declarations: [
    MoviesComponent
  ],
  imports: [
    CommonModule,
    WidgetsModule,
  ]
})
export class MoviesModule { }

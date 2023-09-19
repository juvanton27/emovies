import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoviesListComponent } from './movies-list/movies-list.component';
import { MaterialModule } from '../material.module';
import { MovieInfoComponent } from './movie-info/movie-info.component';
import { ProcessingStateComponent } from './processing-state/processing-state.component';



@NgModule({
  declarations: [
    MoviesListComponent,
    MovieInfoComponent,
    ProcessingStateComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [
    MoviesListComponent,
    MovieInfoComponent,
    ProcessingStateComponent
  ]
})
export class WidgetsModule { }

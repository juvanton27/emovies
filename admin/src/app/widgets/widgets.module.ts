import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoviesListComponent } from './movies-list/movies-list.component';
import { MaterialModule } from '../material.module';
import { MovieInfoComponent } from './movie-info/movie-info.component';



@NgModule({
  declarations: [
    MoviesListComponent,
    MovieInfoComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [
    MoviesListComponent,
    MovieInfoComponent
  ]
})
export class WidgetsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoviesListComponent } from './movies-list/movies-list.component';
import { MaterialModule } from '../material.module';



@NgModule({
  declarations: [
    MoviesListComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [
    MoviesListComponent
  ]
})
export class WidgetsModule { }

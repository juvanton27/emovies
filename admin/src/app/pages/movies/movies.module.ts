import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetsModule } from '../../widgets/widgets.module';
import { MoviesComponent } from './movies.component';
import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    MoviesComponent
  ],
  imports: [
    CommonModule,
    WidgetsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class MoviesModule { }

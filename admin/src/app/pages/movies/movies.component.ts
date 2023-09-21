import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { allEmotions } from '../../model/emotion.type';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss']
})
export class MoviesComponent {
  // Filter
  searchForm = new FormGroup({
    title: new FormControl(),
    emotion: new FormControl('all' as any),
  });
  allEmotions = ['all', ...allEmotions];
  
  // Page
  pageSize: number = 12;
  skip: number = 0;
  count!: number;

  nbPage(count: number): number {
    return Math.ceil(count/this.pageSize);
  }

  isCurrentPage(index: number): boolean {
    return Math.floor(this.skip/this.pageSize) === index;
  }

  setSkip(skip: number): void {
    this.skip = skip;
  }
}

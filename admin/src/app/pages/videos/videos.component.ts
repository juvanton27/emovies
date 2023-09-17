import { Component, OnInit } from '@angular/core';
import { MoviesService } from '../../services/movies.service';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss']
})
export class VideosComponent implements OnInit {

  constructor(
    private readonly moviesService: MoviesService,
  ) { }
  
  ngOnInit(): void {
    this.moviesService.getAll(50, 0).subscribe(console.log);
  }
}

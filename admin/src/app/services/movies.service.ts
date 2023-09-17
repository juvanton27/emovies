import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Movie } from '../model/movie.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SearchResult } from '../model/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {

  constructor(
    @Inject('API_BACKEND') private readonly endpoint: string,
    private readonly http: HttpClient,
  ) { }

  getAll(pageSize: number, skip: number, filter?: any): Observable<SearchResult<Movie>> {
    const url = `${this.endpoint}/movies`;
    let params = new HttpParams();
    params = params.append('pageSize', pageSize);
    params = params.append('skip', skip);
    if (filter?.uploaded) params.append('uploaded', filter.uploaded);
    return this.http.get<SearchResult<Movie>>(url, {params});
  }

  getById(id: number): Observable<Movie> {
    const url = `${this.endpoint}/movies/${id}`;
    return this.http.get<Movie>(url);
  }
}

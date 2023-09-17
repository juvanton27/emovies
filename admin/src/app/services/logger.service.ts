import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  constructor(
    @Inject('API_BACKEND') private readonly endpoint: string,
    private readonly http: HttpClient,
  ) { }

  getById(id: number): Observable<any> {
    const url = `${this.endpoint}/logger/${id}`;
    return this.http.get(url, {responseType: 'text'})
  }
}

import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Log } from '../model/log.model';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  logs = new BehaviorSubject<Log>(undefined as any);
  onCurrentLogs = this.logs.asObservable();

  constructor(
    @Inject('API_BACKEND') private readonly backendEndpoint: string,
    @Inject('API_PROCESSING') private readonly processingEndpoint: string,
    private readonly http: HttpClient,
  ) { }

  setLogs(logs: Log): void {
    this.logs.next(logs);
  }

  getLogs(): Log {
    return this.logs.value;
  }

  getById(id: number): Observable<string> {
    const url = `${this.backendEndpoint}/logger/${id}`;
    return this.http.get(url, {responseType: 'text'})
  }

  getLastLog(): Observable<Log> {
    const url = `${this.processingEndpoint}/lastValue`;
    return this.http.get<any>(url).pipe(
      map(({data}: {data: Log}) => data)
    );
  }
}

import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MoviesService } from './services/movies.service';
import { Log } from './model/log.model';
import { LoggerService } from './services/logger.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  routes: { title: string, link: string, icon: string }[] = [
    { title: 'Dashboard', link: '/dashboard', icon: 'dashboard' },
    { title: 'Videos', link: '/videos', icon: 'videocam' },
  ];
  showSidenav = true;
  logs?: Log;

  constructor(
    private ngZone: NgZone,
    private readonly moviesService: MoviesService,
    private readonly loggerService: LoggerService
  ) { }

  ngOnInit(): void {
    this.onResize({target: {innerWidth: window.innerWidth}})
    this.loggerService.getLastLog().subscribe((logs: Log) => {
      if (logs && !logs.stop) {
        this.loggerService.setLogs(logs);
      }
    });

    const eventSource = new EventSource('/api-processing/sse');
    eventSource.onerror = () => {
      this.ngZone.run(() => {
        this.loggerService.setLogs(undefined as any);
      });
    }
    eventSource.onmessage = ({ data }: { data: string }) => {
      this.ngZone.run(() => {
        const logs: Log = JSON.parse(data);
        this.loggerService.setLogs(logs);
      });
    }
    this.loggerService.onCurrentLogs.subscribe((logs: Log) => this.logs = logs);
  }

  generateVideo(): void {
    this.moviesService.generateVideo().subscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: any): void {
    this.showSidenav = e.target.innerWidth >= 768;
  }
}

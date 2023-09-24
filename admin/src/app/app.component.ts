import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MoviesService } from './services/movies.service';
import { Log } from './model/log.model';
import { LoggerService } from './services/logger.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('theme') theme!: ElementRef;
  routes: { title: string, link: string, icon: string }[] = [
    { title: 'Dashboard', link: '/dashboard', icon: 'space_dashboard' },
    { title: 'Movies', link: '/movies', icon: 'movie' },
  ];
  showSidenav = true;
  logs?: Log;

  constructor(
    private ngZone: NgZone,
    private readonly moviesService: MoviesService,
    private readonly loggerService: LoggerService,
    private readonly settingsService: SettingsService
  ) { }

  ngAfterViewInit(): void {
    this.handleTheme();
  }

  ngOnInit(): void {
    this.onResize({target: {innerWidth: window.innerWidth}});
    this.handleLogs();
  }

  handleLogs(): void {
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

  handleTheme(): void {
    this.settingsService.onCurrentTheme.subscribe(
      (darkTheme: boolean) => {
        if (darkTheme) this.theme.nativeElement.classList.add('dark');
        else this.theme.nativeElement.classList.remove('dark');
      }
    );
  }
}

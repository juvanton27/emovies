import { Component, NgZone, OnInit } from '@angular/core';

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
  currentState!: string;

  constructor(private ngZone: NgZone) { }

  ngOnInit(): void {
    const eventSource = new EventSource('/api-processing');
    eventSource.onmessage = ({ data }) => {
      this.ngZone.run(() => {
        this.currentState = JSON.parse(data).message;
      })
    }
  }
}

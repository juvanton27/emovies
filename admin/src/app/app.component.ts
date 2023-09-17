import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  routes: {title: string, link: string, icon: string}[] = [
    {title: 'Dashboard', link: '/dashboard', icon: 'dashboard'},
    {title: 'Videos', link: '/videos', icon: 'videocam'},
  ];
}

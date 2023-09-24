import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private darkTheme = new BehaviorSubject<boolean>(false);
  onCurrentTheme = this.darkTheme.asObservable();

  constructor(private ref: ApplicationRef) {
    const darkModeOn =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // If dark mode is enabled then directly switch to the dark-theme
    if(darkModeOn){
      this.darkTheme.next(true);
    }

    // Watch for changes of the preference
    window.matchMedia("(prefers-color-scheme: dark)").addListener(e => {
      const turnOn = e.matches;
      this.darkTheme.next(turnOn);

      // Trigger refresh of UI
      this.ref.tick();
    });
  }

  isDarkTheme(): boolean {
    return this.darkTheme.value;
  }

  setTheme(theme: boolean): void {
    this.darkTheme.next(theme);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private darkTheme = new BehaviorSubject<boolean>(false);
  onCurrentTheme = this.darkTheme.asObservable();

  constructor() { }

  isDarkTheme(): boolean {
    return this.darkTheme.value;
  }

  setTheme(theme: boolean): void {
    this.darkTheme.next(theme);
  }
}

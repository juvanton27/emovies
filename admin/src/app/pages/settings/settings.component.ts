import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { map } from 'rxjs';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  form = new FormGroup({
    darkTheme: new FormControl(false),
  });

  constructor(
    private readonly settingsService: SettingsService,
  ) { }

  ngOnInit(): void {
    this.form.controls.darkTheme.setValue(this.settingsService.isDarkTheme(), { emitEvent: false });
    this.form.valueChanges.pipe(
      map(({ darkTheme }) => {
        if (darkTheme !== undefined) this.settingsService.setTheme(darkTheme!)
      })
    ).subscribe();
  }
}

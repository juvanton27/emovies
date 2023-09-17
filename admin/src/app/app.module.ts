import { APP_INITIALIZER, NgModule, NgZone } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { environment } from '../environments/environment.development';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DashboardModule } from './pages/dashboard/dashboard.module';
import { VideosModule } from './pages/videos/videos.module';
import { HttpClientModule } from '@angular/common/http';
import { MoviesListComponent } from './widgets/movies-list/movies-list.component';
import { WidgetsModule } from './widgets/widgets.module';

const initializer = (keycloak: KeycloakService, ngZone: NgZone) => 
  (): Promise<any> => 
  new Promise((resolve, reject) => {
    ngZone.runOutsideAngular(() => {
      try {
        resolve(keycloak.init({
          config: environment.keycloak,
          initOptions: {
            onLoad: 'login-required',
            checkLoginIframe: false,
          },
          enableBearerInterceptor: true
        }));
      } catch (e) {
        reject(e);
      }
    });
  });

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    KeycloakAngularModule,
    DashboardModule,
    HttpClientModule,
    VideosModule,
    WidgetsModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializer,
      multi: true,
      deps: [KeycloakService, NgZone]
    },
    { provide: 'API_BACKEND', useValue: environment.endpoint.backend },
    { provide: 'API_PROCESSING', useValue: environment.endpoint.processing },
    { provide: 'API_TMDB_IMAGE', useValue: environment.endpoint.tmdb_image },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

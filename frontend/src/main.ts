// main.ts

import 'chart.js/auto';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideCharts } from 'ng2-charts';
import { provideMarkdown } from 'ngx-markdown';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideCharts(),
    provideMarkdown({ loader: HttpClient }),
  ],
}).catch((err) => console.error(err));

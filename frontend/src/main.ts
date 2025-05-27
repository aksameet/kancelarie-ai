import 'chart.js/auto';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideCharts } from 'ng2-charts';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(withFetch()), provideCharts()],
}).catch((err) => console.error(err));

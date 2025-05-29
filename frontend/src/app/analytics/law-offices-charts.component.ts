import {
  Component,
  Input,
  OnChanges,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface Office {
  title: string;
  rating: number;
  reviews: number;
  specialization?: string;
}

@Component({
  selector: 'law-offices-charts',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Histogram ocen -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h3 class="font-semibold mb-2">Histogram ocen</h3>
        <canvas
          baseChart
          [data]="histData"
          [options]="histOptions"
          [type]="'bar'"
        ></canvas>
      </div>

      <!-- Scatter rating-vs-reviews -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h3 class="font-semibold mb-2">Popularność vs ocena</h3>
        <canvas
          baseChart
          [data]="scatterData"
          [options]="scatterOptions"
          [type]="'scatter'"
        ></canvas>
      </div>

      <!-- Top-N kancelarii -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h3 class="font-semibold mb-2">Top {{ topN }} ocen</h3>
        <canvas
          baseChart
          [data]="topData"
          [options]="topOptions"
          [type]="'bar'"
        ></canvas>
      </div>

      <!-- Udział specjalizacji -->
      <div
        class="bg-white p-4 rounded-xl shadow"
        *ngIf="pieData.labels?.length"
      >
        <h3 class="font-semibold mb-2">Udział specjalizacji</h3>
        <canvas
          baseChart
          [data]="pieData"
          [options]="pieOptions"
          [type]="'doughnut'"
        ></canvas>
      </div>
    </div>
  `,
})
export class LawOfficesChartsComponent implements OnChanges, AfterViewChecked {
  @Input() offices: Office[] = [];
  @Input() topN = 0;

  /* ---------- histogram ---------- */
  histData!: ChartData<'bar'>;
  histOptions: ChartOptions<'bar'> = {
    scales: {
      x: { title: { display: true, text: 'Ocena' } },
      y: {
        title: { display: true, text: 'Liczba kancelarii' },
        beginAtZero: true,
      },
    },
    plugins: { legend: { display: false } },
  };

  /* ---------- scatter ---------- */
  scatterData!: ChartData<'scatter'>;
  scatterOptions: ChartOptions<'scatter'> = {
    scales: {
      x: { title: { display: true, text: 'Liczba opinii' } },
      y: { title: { display: true, text: 'Ocena' }, min: 3, max: 5.5 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const data = context.raw as { x: number; y: number; title: string };
            return `${data.title}: ${data.y}★ (${data.x} opinii)`;
          },
        },
      },
    },
  };

  /* ---------- top-N ---------- */
  topData!: ChartData<'bar'>;
  topOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };

  /* ---------- pie ---------- */
  pieData!: ChartData<'doughnut'>;
  pieOptions: ChartOptions<'doughnut'> = {
    plugins: { legend: { position: 'bottom' } },
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (!this.offices.length) {
      // zeruj dane, jeśli brak kancelarii
      this.histData = { labels: [], datasets: [] };
      this.scatterData = { datasets: [] };
      this.topData = { labels: [], datasets: [] };
      this.pieData = { labels: [], datasets: [] };
      return;
    }

    // 1) Histogram ocen
    const bins = [3.0, 3.5, 4.0, 4.5, 5.0];
    const counts = bins.map(
      (b, i) =>
        this.offices.filter((o) =>
          i === bins.length - 1
            ? o.rating >= b
            : o.rating >= b && o.rating < bins[i + 1]
        ).length
    );
    this.histData = {
      labels: bins.map((b) => b.toFixed(1)),
      datasets: [{ data: counts }],
    };

    // 2) Scatter: opinie vs ocena
    this.scatterData = {
      datasets: [
        {
          label: 'Kancelarie',
          data: this.offices.map((o) => ({
            x: o.reviews,
            y: o.rating,
            title: o.title,
          })),
          pointRadius: 6,
        },
      ],
    };

    // 3) Top-N według ratingu
    const top = [...this.offices]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, this.topN);
    this.topData = {
      labels: top.map((o) => o.title),
      datasets: [{ data: top.map((o) => o.rating) }],
    };

    // 4) Pie: udział specjalizacji
    const map = new Map<string, number>();
    this.offices.forEach((o) =>
      map.set(
        o.specialization || 'inne',
        (map.get(o.specialization || 'inne') || 0) + 1
      )
    );
    this.pieData = {
      labels: [...map.keys()],
      datasets: [{ data: [...map.values()] }],
    };
  }

  ngAfterViewChecked(): void {
    // wymuszenie detekcji i uaktualnienia wykresów
    this.cdr.detectChanges();
  }
}

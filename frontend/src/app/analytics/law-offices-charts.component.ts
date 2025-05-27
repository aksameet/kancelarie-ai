// src/app/analytics/law-offices-charts.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartData,
  ChartOptions,
  ChartType,
  ChartConfiguration,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface Office {
  title: string;
  rating: number;
  reviews: number;
  specialization?: string; // jeśli masz w encji
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
        >
        </canvas>
      </div>

      <!-- Scatter rating-vs-reviews -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h3 class="font-semibold mb-2">Popularność vs ocena</h3>
        <canvas
          baseChart
          [data]="scatterData"
          [options]="scatterOptions"
          [type]="'scatter'"
        >
        </canvas>
      </div>

      <!-- Top-N kancelarii -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h3 class="font-semibold mb-2">Top {{ topN }} ocen</h3>
        <canvas
          baseChart
          [data]="topData"
          [options]="topOptions"
          [type]="'bar'"
        >
        </canvas>
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
        >
        </canvas>
      </div>
    </div>
  `,
})
export class LawOfficesChartsComponent implements OnChanges {
  @Input() offices: Office[] = [];
  @Input() topN = 10;

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
      y: { title: { display: true, text: 'Ocena' }, min: 3, max: 5 },
    },
    plugins: { legend: { display: false } },
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

  ngOnChanges(): void {
    if (!this.offices.length) return;

    /* 1) Histogram ocen (przedziały co 0.5) */
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
      datasets: [
        { data: counts, backgroundColor: '#6366f1' }, // indigo-500
      ],
    };

    /* 2) Scatter: opinie vs ocena */
    this.scatterData = {
      datasets: [
        {
          label: 'Kancelaria',
          data: this.offices.map((o) => ({ x: o.reviews, y: o.rating })),
          pointRadius: 4,
          backgroundColor: '#f59e0b', // amber-500
        },
      ],
    };

    /* 3) Top-N według ratingu */
    const top = [...this.offices]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, this.topN);

    this.topData = {
      labels: top.map((o) => o.title),
      datasets: [
        {
          data: top.map((o) => o.rating),
          backgroundColor: '#10b981', // emerald-500
        },
      ],
    };

    /* 4) Pie: udział specjalizacji */
    const map = new Map<string, number>();
    this.offices.forEach((o) =>
      map.set(
        o.specialization || 'inne',
        (map.get(o.specialization || 'inne') || 0) + 1
      )
    );
    this.pieData = {
      labels: [...map.keys()],
      datasets: [
        {
          data: [...map.values()],
        },
      ],
    };
  }
}

import { Injectable, Logger, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import axios, { CancelTokenSource } from 'axios';

import { LawOffice } from './law-office.entity';
import { LawOfficePersistService } from './law-office-persist.service';

@Injectable()
export class LawOfficesService {
  private readonly log = new Logger(LawOfficesService.name);

  /** aktywne zapytania HTTP  – klucz: `${city}:${type}` */
  private readonly inFlight = new Map<string, CancelTokenSource>();

  /** globalna flaga – czy scrapowanie włączone */
  private readonly SCRAPER_ENABLED = process.env.SCRAPER_ENABLED !== 'false';

  /* stałe współrzędne map-centre (potrzebne przy start>0) */
  private readonly coords: Record<string, string> = {
    poznan: '@52.406374,16.9251681,13z',
    warszawa: '@52.229675,21.0122287,13z',
    krakow: '@50.064650,19.9449799,13z',
    wroclaw: '@51.107885,17.0385376,13z',
    gdansk: '@54.352025,18.6466384,13z',
  };

  /* etykiety zapytań */
  private readonly typeLabel: Record<string, string> = {
    adwokacka: 'Adwokacka',
    radcowska: 'Radcowska',
    notarialna: 'Notarialna',
    komornicza: 'Komornicza',
    podatkowa: 'Podatkowa',
  };

  constructor(
    private readonly http: HttpService,
    private readonly persist: LawOfficePersistService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  PUBLICZNE API                                                     */
  /* ------------------------------------------------------------------ */
  async getOffices(
    city: string,
    type = 'adwokacka',
    limit = 20,
  ): Promise<LawOffice[]> {
    city = city.toLowerCase();
    type = type.toLowerCase();
    const lim = Math.min(Math.max(20, Math.floor(+limit / 20) * 20), 100);

    /* 1️⃣ zawsze najpierw baza danych */
    const fromDb = await this.persist.find(city, type, lim);
    if (fromDb.length || !this.SCRAPER_ENABLED) return fromDb;

    /* 2️⃣ brak w bazie → scrape, zapisz, zwróć */
    const scraped = await this.scrapeAndPersist(city, type, lim);
    return scraped;
  }

  /* ------------------------------------------------------------------ */
  /*  CRON – odśwież całość raz dziennie                                 */
  /* ------------------------------------------------------------------ */
  @Cron('0 3 * * *', { timeZone: 'Europe/Warsaw' })
  async refreshAll() {
    if (!this.SCRAPER_ENABLED) return;

    for (const city of Object.keys(this.coords)) {
      for (const type of Object.keys(this.typeLabel)) {
        try {
          await this.scrapeAndPersist(city, type, 100);
          this.log.log(`CRON refreshed ${city} [${type}]`);
        } catch (e) {
          this.log.error(`CRON ${city}/${type} failed`, (e as Error).message);
        }
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  WEWNĘTRZNE                                                         */
  /* ------------------------------------------------------------------ */
  private async scrapeAndPersist(
    city: string,
    type: string,
    limit: number,
  ): Promise<LawOffice[]> {
    const key = `${city}:${type}`;

    /* anuluj ewentualne poprzednie zapytanie */
    const prev = this.inFlight.get(key);
    if (prev) {
      prev.cancel('superseded by newer request');
      this.inFlight.delete(key);
    }

    /* pobierz dane */
    const data = await this.fetch(city, type, limit, key);
    await this.persist.replace(city, type, data); // zapisz w bazie

    return data;
  }

  /** Łączy się z SerpAPI, stronicuje co 20 wyników */
  private async fetch(
    city: string,
    type: string,
    limit: number,
    flightKey: string,
  ): Promise<LawOffice[]> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) throw new HttpException('SERPAPI_KEY missing', 500);

    const ll = this.coords[city];
    if (!ll)
      throw new HttpException(`Brak współrzędnych dla miasta ${city}`, 400);

    const q = `Kancelaria ${this.typeLabel[type] || 'Adwokacka'} ${city}`;
    const pages = Math.ceil(limit / 20); // 1 … 5
    const starts = Array.from({ length: pages }, (_, i) => i * 20);

    /* token anulujący */
    const src: CancelTokenSource = axios.CancelToken.source();
    this.inFlight.set(flightKey, src);

    const out: LawOffice[] = [];

    try {
      for (const start of starts) {
        const { data } = await firstValueFrom(
          this.http.get('https://serpapi.com/search.json', {
            params: {
              engine: 'google_maps',
              q,
              api_key: apiKey,
              ...(start ? { start, ll } : {}), // dla 20,40,60…
            },
            cancelToken: src.token,
          }),
        );

        if (data.error?.includes("hasn't returned any results")) break;
        if (data.error) throw new HttpException(`SerpAPI: ${data.error}`, 502);

        const locals: any[] = data.local_results ?? [];
        if (!locals.length) break;

        /* mapowanie → „bezpieczny” model */
        locals.forEach((it: any) =>
          out.push({
            id: undefined!,
            created_at: undefined!,
            updated_at: undefined!,

            city,
            specialization: type,

            position: it.position ?? 0,
            title: it.title ?? '',

            place_id: it.place_id ?? '',
            data_id: it.data_id ?? '',
            data_cid: it.data_cid ?? '',

            rating: it.rating ?? 0,
            reviews: it.reviews ?? 0,

            address: it.address ?? '',
            phone: it.phone ?? '',
            website: it.website ?? '',

            types: it.types ?? [],
            type_id: it.type_id ?? '',
            type_ids: it.type_ids ?? [],

            thumbnail: it.thumbnail ?? '',
            serpapi_thumbnail: it.serpapi_thumbnail ?? '',

            gps_coordinates: it.gps_coordinates ?? {},
            operating_hours: it.operating_hours ?? {},

            extensions: it.extensions ?? [],
            unsupported_extensions: it.unsupported_extensions ?? [],
            service_options: it.service_options ?? {},

            reviews_link: it.reviews_link ?? '',
            photos_link: it.photos_link ?? '',
            place_id_search: it.place_id_search ?? '',

            open_state: it.open_state ?? '',
            hours: it.hours ?? '',
          } as LawOffice),
        );

        if (locals.length < 20) break; // koniec wyników
        await new Promise((r) => setTimeout(r, 3000)); // politeness delay
      }
    } finally {
      this.inFlight.delete(flightKey);
    }

    return out.slice(0, limit);
  }
}

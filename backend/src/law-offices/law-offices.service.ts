import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';

export interface LawOffice {
  position: number;
  title: string;
  place_id: string;
  data_id: string;
  data_cid: string;
  reviews_link: string;
  photos_link: string;
  gps_coordinates: { latitude: number; longitude: number };
  place_id_search: string;
  provider_id: string;
  rating: number;
  reviews: number;
  type: string;
  types: string[];
  type_id: string;
  type_ids: string[];
  address: string;
  open_state: string;
  hours: string;
  operating_hours: Record<
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday',
    string
  >;
  phone?: string;
  website?: string;
  extensions: any[];
  unsupported_extensions: any[];
  service_options: { online_appointments: boolean; onsite_services: boolean };
  thumbnail?: string;
  serpapi_thumbnail?: string;
}

@Injectable()
export class LawOfficesService {
  private readonly logger = new Logger(LawOfficesService.name);
  private readonly cache = new Map<string, LawOffice[]>();
  private readonly cities = [
    'poznan',
    'warszawa',
    'krakow',
    'wroclaw',
    'gdansk',
  ];

  constructor(private readonly http: HttpService) {}

  async getOffices(city: string): Promise<LawOffice[]> {
    city = city.toLowerCase();
    if (!this.cache.has(city)) {
      try {
        const data = await this.fetchCity(city);
        this.cache.set(city, data);
      } catch (err: any) {
        this.handleFetchError(err);
      }
    }
    return this.cache.get(city) ?? [];
  }

  @Cron('0 3 * * *', { timeZone: 'Europe/Warsaw' })
  async refreshAll(): Promise<void> {
    this.logger.log('Refreshing all city caches…');
    await Promise.all(
      this.cities.map(async (city) => {
        try {
          const data = await this.fetchCity(city);
          this.cache.set(city, data);
        } catch (err: any) {
          this.logger.error(
            `Failed to refresh ${city}`,
            err.response?.data || err.message,
          );
        }
      }),
    );
    this.logger.log('Refresh complete.');
  }

  private async fetchCity(city: string): Promise<LawOffice[]> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      throw new HttpException(
        'Missing SerpAPI key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const results: LawOffice[] = [];
    let nextPageToken: string | undefined;

    do {
      const params: any = {
        engine: 'google_maps',
        num: 5,
        type: 'search',
        q: `Kancelaria Adwokacka ${city}`,
        api_key: apiKey,
        ...(nextPageToken && { next_page_token: nextPageToken }),
      };
      const resp = await firstValueFrom(
        this.http.get('https://serpapi.com/search.json', { params }),
      );
      const data = resp.data;

      if (data.error) {
        throw new HttpException(
          `SerpAPI error: ${data.error}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      for (const item of data.local_results || []) {
        results.push({
          position: item.position,
          title: item.title,
          place_id: item.place_id,
          data_id: item.data_id,
          data_cid: item.data_cid,
          reviews_link: item.reviews_link,
          photos_link: item.photos_link,
          gps_coordinates: item.gps_coordinates,
          place_id_search: item.place_id_search,
          provider_id: item.provider_id,
          rating: item.rating,
          reviews: item.reviews,
          type: item.type,
          types: item.types,
          type_id: item.type_id,
          type_ids: item.type_ids,
          address: item.address,
          open_state: item.open_state,
          hours: item.hours,
          operating_hours: item.operating_hours,
          phone: item.phone,
          website: item.website,
          extensions: item.extensions,
          unsupported_extensions: item.unsupported_extensions,
          service_options: item.service_options,
          thumbnail: item.thumbnail,
          serpapi_thumbnail: item.serpapi_thumbnail,
        });
      }

      nextPageToken = data.next_page_token;
    } while (nextPageToken);

    return results;
  }

  private handleFetchError(err: any): never {
    const msg = err.response?.data?.error as string | undefined;
    if (msg?.includes('Invalid API key')) {
      this.logger.error('Invalid SerpAPI key');
      throw new HttpException(
        'Configuration error: invalid SerpAPI key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.logger.error('Fetch failed', err.response?.data || err.message);
    throw new HttpException(
      'Failed to fetch from SerpAPI',
      HttpStatus.BAD_GATEWAY,
    );
  }
}

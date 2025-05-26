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

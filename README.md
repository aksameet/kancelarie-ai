# Kancelarie-AI – Proof-of-Concept

## Struktura projektu

| Folder       | Technologia / rola                              | Kluczowe biblioteki                        |
|--------------|--------------------------------------------------|--------------------------------------------|
| `backend/`   | NestJS + TypeORM + PostgreSQL (API + scraper)   | `@nestjs/*`, `typeorm`, `pg`, `axios`      |
| `frontend/`  | Angular 18 + Tailwind (UI stand-alone)           | `@angular/*`, `tailwindcss`, `autoprefixer`|

---

## Backend – przepływ danych

```
GET /api/...  ─►  LawOfficesService
                    ├─► sprawdza bazę (LawOfficePersistService)
                    └─► zapisuje dane w bazie (replace)
```


- Obsługa automatycznego anulowania zduplikowanych requestów (axios CancelToken)
- Dane typu `jsonb`, brakujące pola `rating` i `reviews` ustawiane na `0`

---

## Frontend – Angular App

- Prosty UI z wyborem miasta, specjalizacji i limitu
- Endpoint:

  ```
  GET /api/cities/:city/law-offices?type=komornicza&limit=60
  ```

- Lista: tytuł kancelarii, miniatura, adres, rating, liczba opinii
- Dane tylko z lokalnej bazy

---

### Baza danych PostgreSQL

```bash
docker run --name pg-kancelarie \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  -d postgres:16
```

### Backend

```bash
cd backend
cp .env.example .env      # uzupełnij DATABASE_URL 
npm install
npm run typeorm:migrate
npm run start:dev         # nasłuchuje na http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run start             # http://localhost:4200
```

---

## Zmienne środowiskowe (`.env`)

| Zmienna           | Opis                                              |
|-------------------|---------------------------------------------------|
| `DATABASE_URL`    | `postgres://user:pass@localhost:5432/db`         |
| `PORT`            | Port backendu – domyślnie `3000`                 |
| `GROQ_API_KEY`    | Klucz API do analizy AI (kolejny krok)           |

---

## Struktura tabeli `law_office` (TypeORM)

| Pole                   | Typ danych   | Obowiązkowe | Uwagi                                      |
|------------------------|--------------|-------------|---------------------------------------------|
| `id`                   | integer      | ✓           | autoincrement                              |
| `city`                 | string       | ✓           | miasto, np. `warszawa`                     |
| `specialization`       | string       | ✓           | np. `radcowska`, `adwokacka`               |
| `position`             | integer      | ✓           | pozycja w wynikach                         |
| `title`                | string       | ✓           | nazwa kancelarii                           |
| `rating`               | numeric      | ✓           | domyślnie `0`                              |
| `reviews`              | integer      | ✓           | domyślnie `0`                              |
| `address`, `phone`     | string       | -           |                                             |
| `website`              | string       | -           |                                             |
| `types`, `type_ids`    | `jsonb`      | -           |                               |
| `gps_coordinates`      | `jsonb`      | -           | `{ latitude, longitude }`                  |
| `operating_hours`      | `jsonb`      | -           |                                             |
| `extensions`           | `jsonb`      | -           |                                             |
| `unsupported_extensions` | `jsonb`    | -           |                                             |
| `service_options`      | `jsonb`      | -           | np. `{"onsite_services":true}`             |
| `reviews_link`         | string       | -           |                                             |
| `photos_link`          | string       | -           |                                             |
| `place_id_search`      | string       | -           |                                             |
| `open_state`, `hours`  | string       | -           | np. `Closed ⋅ Opens 9 AM`                  |
| `created_at`, `updated_at` | timestamp | ✓          | automatycznie ustawiane przez TypeORM      |

---

## Komendy developerskie

### Backend

```bash
npm run start:dev           # uruchomienie NestJS z watch-mode
npm run typeorm:migrate     # uruchomienie migracji
npm run typeorm:revert      # cofnięcie ostatniej migracji
```

### Frontend

```bash
npm run start               # uruchomienie Angular dev servera
npm run tailwind:build      # produkcyjna kompilacja CSS
```

---

## Kolejny krok

Podłączenie Groq API do analizy danych kancelarii:

- scoring jakości (AI)
- analiza sentymentu
- rekomendacje dopasowane do użytkownika

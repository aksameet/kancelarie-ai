/* ──────────────────────────────────────────────────────────────
   src/analysis/build-prompt.ts
   Pełny zrzut rekordu  ▸  CSV  |  DICT  |  DELTA
   (obsługuje WSZYSTKIE pola z encji LawOffice)
   ────────────────────────────────────────────────────────────── */
import { LawOffice } from '../law-offices/law-office.entity';
import * as crc from 'crc-32';

/* pomocnicze ──────────────────────────────────────────────── */
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(1) : '';
};
const txt = (v: unknown) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '/') // pipy psują CSV
    .slice(0, 120); // limit długości
const arr = (a?: unknown[]) => (a?.length ? a.join(',') : '');
const jsn = (o?: unknown) =>
  o && Object.keys(o).length ? JSON.stringify(o) : '';

/* tryby promptu ────────────────────────────────────────────── */
export enum PromptMode {
  CSV = 'csv',
  DICT_ID = 'dict',
  DELTA = 'delta',
}

/* główna funkcja ───────────────────────────────────────────── */
export function buildPrompt(
  offices: LawOffice[],
  mode: PromptMode = PromptMode.CSV,
): string {
  switch (mode) {
    /* ────────────── A) pełny CSV (≤ 200) ─────────────── */
    case PromptMode.CSV: {
      const header =
        'id|title|rating|reviews|city|spec|address|phone|website|' +
        'types|type_ids|open_state|hours';
      const lines = offices.map((o, i) =>
        [
          i + 1,
          txt(o.title),
          num(o.rating),
          o.reviews ?? '',
          o.city,
          o.specialization,
          txt(o.address),
          txt(o.phone),
          txt(o.website),
          arr(o.types),
          arr(o.type_ids),
          txt(o.open_state),
          txt(o.hours),
        ].join('|'),
      );
      return [header, ...lines].join('\n');
    }

    /* ────────────── B) DICT + numeryka (200–2000) ─────── */
    case PromptMode.DICT_ID: {
      const numeric = offices
        .map((o, i) =>
          [
            i + 1,
            num(o.rating),
            o.reviews ?? '',
            o.city,
            o.specialization,
            txt(o.open_state),
          ].join('|'),
        )
        .join('\n');

      const dict = offices.map((o, i) => `${i + 1}:${txt(o.title)}`).join(';');

      return (
        'id|rating|reviews|city|spec|open_state\n' +
        numeric +
        '\n\n#DICTIONARY ' +
        dict
      );
    }

    /* ────────────── C) Δ-CSV + CRC32 (> 2000) ─────────── */
    case PromptMode.DELTA: {
      let prevTitleWords: string[] = [];
      const rows: string[] = [];

      offices.forEach((o, i) => {
        const words = o.title.split(/\s+/);
        const delta = words
          .map((w, idx) => (w === prevTitleWords[idx] ? '' : w))
          .filter(Boolean)
          .join(' ');
        prevTitleWords = words;

        rows.push(
          [
            i + 1,
            delta,
            num(o.rating),
            o.reviews ?? '',
            o.city,
            o.specialization,
            txt(o.open_state),
          ].join('|'),
        );
      });

      const body = rows.join('\n');
      const checksum = crc.str(body) >>> 0;

      return (
        'schema:id|Δtitle|rating|reviews|city|spec|open_state|crc\n' +
        body +
        `\n\ncrc32:${checksum}`
      );
    }

    default:
      throw new Error('Nieobsługiwany tryb buildPrompt');
  }
}

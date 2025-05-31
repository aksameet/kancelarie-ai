import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LlmQueryGeneratorService {
  constructor(private readonly http: HttpService) {}

  async toOrmQuery(
    userQ: string,
    history: string,
    queryHistory: string[],
  ): Promise<string | null> {
    console.log('============ history ============', history);
    const cities = ['warszawa', 'poznan', 'krakow', 'wroclaw', 'gdansk'];
    const specializations = [
      'adwokacka',
      'radcowska',
      'notarialna',
      'komornicza',
      'podatkowa',
    ];
    const legal_services = `
      "rozwód", "sprawa rozwodowa", "sprawy rozwodowe" → "divorce_attorney"  
      "usługi rozwodowe", "mediacje rozwodowe" → "divorce_service"  
      "prawo rodzinne", "sprawy rodzinne", "alimenty", "opieka nad dzieckiem" → "family_law_attorney"  
      "prawo ogólne", "praktyka ogólna", "konsultacje prawne", "prawo cywilne" → "general_practice_attorney"  
      "prawnik", "radca", "adwokat" → "lawyer"  
      "prawo nieruchomości", "zakup mieszkania", "najem", "sprzedaż domu" → "real_estate_attorney"  
      "proces", "reprezentacja w sądzie", "postępowanie sądowe", "pozew" → "trial_attorney"  
      "barrister", "brytyjski adwokat", "reprezentacja sądowa UK" → "barrister"  
      "upadłość", "bankructwo", "restrukturyzacja" → "bankruptcy_attorney"  
      "pomoc w upadłości", "usługi upadłościowe" → "bankruptcy_service"  
      "ubezpieczenia", "spory z ubezpieczycielem", "odmowa wypłaty" → "insurance_attorney"  
      "prawo pracy", "zwolnienie", "umowa o pracę", "związki zawodowe" → "labor_relations_attorney"  
      "błąd medyczny", "prawo medyczne", "odpowiedzialność lekarza" → "medical_lawyer"  
      "obrażenia osobiste", "wypadek", "odszkodowanie", "odszkodowanie z OC" → "personal_injury_lawyer"  
      "prawo administracyjne", "decyzja administracyjna", "urząd", "odwołanie" → "administrative_attorney"  
      "prawo karne", "przestępstwo", "obrona", "oskarżony", "zatrzymanie" → "criminal_law_attorney"  
      "pomoc ofiarom", "ofiary przestępstw", "wsparcie prawne dla poszkodowanych" → "crime_victim_service"  
      "prawo spadkowe", "dziedziczenie", "testament", "spadek" → "estate_planning_attorney"  
      "prawo imigracyjne", "obywatelstwo", "wiza", "zezwolenie na pobyt" → "immigration_attorney"  
      "obrońca z urzędu", "publiczny obrońca", "obrona karna bez opłat" → "public_defenders_office"  
      "prawo gospodarcze", "firma", "spółka" → "business_attorney"  
      "windykacja", "odzyskiwanie długów" → "debt_collecting"  
      "agencja windykacyjna" → "debt_collection_agency"  
      "doradztwo podatkowe", "konsultacje podatkowe" → "tax_consultant"  
      "rozliczenie podatkowe", "pit" → "tax_preparation"`;

    const mappingPrompt = `If the user question contains legal domain keywords (e.g. "prawo rodzinne", "prawo spadkowe"), use the following mapping to convert them into appropriate database filters:
      Legal domain mapping: type_ids: ${legal_services} in which case the proper TypeORM would be Raw((alias) => '\\'mapped_value\\' = ANY(' + alias + ')').
      If no clear mapping is found or the domain is ambiguous, respond with: CLARIFY`;

    const best = `If the user asks for:
      - the best law firm
      - the top rated law firm
      - the most trusted lawyer
      then:

      → Do not just order by rating. Instead:
      1. Add where: { reviews: MoreThan(20), rating: MoreThan(4.7) }
      2. Order by: rating DESC, then reviews DESC
      3. Prioritize offices with multiple type_ids (broad expertise)
      4. Always use take: 1 to return a single best result
      5. Use find({ where: ..., order: ..., take: 1 })
      6. If you use type_ids, use Raw((alias) => '\\'mapped_value\\' = ANY(' + alias + ')) to match any of the types
      7. Provide short reasoning at the prompt end - explain shortly what was taken into account`;

    const prompt =
      `You are an assistant that converts user questions into TypeORM calls (pseudo-code). The database has the following structure: { "id": 534, "created_at": "2025..", "updated_at": "2025..", "city": "wars..", "specialization": "adwo..", "position": 1, "title": "Kanc..", "place_id": "ChIJ..", "data_id": "0x47..", "data_cid": "5037..", "rating": "4.9..", "reviews": 122, "address": "Obro..", "phone": "+48 ..", "website": "http..", "type_id": "tria..", "types": [ "Tria..", "Gene.." ], "type_ids": [ "tria..", "gene.." ], "thumbnail": "http..", "serpapi_thumbnail": "http..", "operating_hours": { "friday": "Open..", "monday": "Open..", "sunday": "Open..", "tuesday": "Open..", "saturday": "Open..", "thursday": "Open..", "wednesday": "Open.." }, "unsupported_extensions": [], "service_options": { "onsite_services": true, "online_appointments": true }, "reviews_link": "http..", "place_id_search": "http..", "open_state": "Open..", "hours": "Open.." }. Use only **exact** values from the lists below (match spelling and case exactly): - Possible cities: ${cities.join(', ')} - Possible specializations: ${specializations.join(', ')}. ${mappingPrompt}. ${best}. If there is any context it is this: ${history}. If the user's new question refers to "the same firms" or "the ones mentioned earlier", then you MUST reuse the same filters (city, type_ids, specialisation, order, take, etc.) from the previous query context: ${queryHistory}, unless the new question explicitly changes them. NEVER switch from type_ids → specialization. Check all user prompts and check if there is anything in that prompt that can be mapped to the database structure above. If there is, convert the question to a TypeORM pseudo-code query that can be executed against the LawOffice database. If the question related to database is too general, respond exactly with: CLARIFY. If the question is not related to the LawOffice database, respond with: NONE. User asks: "${userQ}". Answer *only*: - PSEUDO-code: find(...), find(...order...), find(...skip...), distinct(...), groupBy, count(...), findAndCount(...) (Respond only with **valid** TypeORM pseudo-code, for example:- count({ where: { city: "..." } })- find({ where: { '...': '...' }, order: { rating: 'DESC' }, take: 10 })- findAndCount({ where: { open_state: 'Open 24 hours' } }))), - or: NONE, - or: CLARIFY. `.trim();

    const res = await firstValueFrom(
      this.http.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_QUERY_MODEL,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        },
      ),
    );

    let out = res.data.choices[0].message.content.trim();
    console.log('LLM Output:\n', out);

    // Usuń <think>...</think>
    out = out.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Pobierz ostatnią istotną linię
    const lastLine = out
      .trim()
      .split('\n')
      .filter(Boolean)
      .pop()
      ?.toUpperCase();

    // Sprawdź jednoznaczne odpowiedzi
    if (lastLine === 'NONE') return 'NONE';
    if (lastLine === 'CLARIFY') return 'CLARIFY';

    return out;
  }
}

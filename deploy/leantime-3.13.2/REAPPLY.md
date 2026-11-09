# Nadogradnja Trames Leantimea (v3.13.2 → nova verzija)

Ovdje je sve što se na instalaciji razlikuje od čistog Leantimea, razdvojeno na dva dijela:

| dio | što je | što radi nadogradnja |
|---|---|---|
| `patches/` | 12 unified diffova prema **v3.13.2** (242 dodana, 12 oduzetih redaka) | pregazi se → ponovno primijeni |
| `theme/` + `custom/` | tema `flat` i `custom/Language/hr-HR.ini` (u forku) | **preživljava**, samo se kopira |

## Redoslijed nadogradnje

1. **Backup prije svega** (cPanel → Backup, ili ručno):
   - baza `projektn_leantime`
   - `config/.env`
   - `userfiles/`
   - `custom/` i `public/theme/flat/`
   - cijela mapa `public/theme/flat/` + `app/Language/hr-HR.ini` su dovoljni za prijevod

2. **Novi release** raspakiraj u privremenu mapu (npr. `/home/projektn/new/`).
   Ne kopiraj preko postojeće instalacije — `public/userfiles` i `.env` bi se izgubili.

3. **Vrati konfiguraciju i podatke u novu mapu:**
   ```
   config/.env            (iz stare instalacije)
   userfiles/             (iz stare instalacije)
   custom/Language/hr-HR.ini
   public/theme/flat/     (cijela tema, uključujući icons/ i js/theme.js)
   public/dist/images/background-flat.png
   ```

4. **Primijeni zakrpe** (iz ove mape, na novom stablu):
   ```
   ./apply-patches.sh /home/projektn/new
   ```
   Skripta javi `OK`/`FAIL` po datoteci. Ako neka vrati `FAIL`, verzija se razlikovala — otvori
   `patches/<ime>.patch`, primijeni ručno po istom principu (sve zakrpe su male i lokalizirane).

5. **Prebaci instalaciju** (stara mapa → `old/`, nova → mjesto stare) i pokreni `/install`
   da se izvrše migracije baze. Zatim `Settings → Cache` ili brisanje `storage/framework/cache/*`.

6. **Provjeri popis** (30 sekundi):
   - `/auth/login` radi, prijava prolazi
   - `/dashboard/home` — pozdrav, 4 broja u boji, ikone (ne emoji)
   - `/tickets/showKanban` — povlačenje kartica radi, „sakrij detalje" mijenja polja
   - `/tickets/showAll` — filtar „Oznake" je dropdown, „Očisti" radi, paginacija nije odrezana
   - `/projects/showMy` — bez 500
   - `/users/showAll` (kao admin) — „Dodaj bez pozivnice" postavi lozinku
   - Profil → Tema → Flat je i dalje odabrana

## Što koja zakrpa nosi

| datoteka | dio | zašto |
|---|---|---|
| `Tickets/Services/Tickets.php` | +27 | tag filter; `countSetFilters()` ne broji `excludeType` |
| `Tickets/Repositories/Tickets.php` | +59 | `FIND_IN_SET` po tagu u oba upita; `getTagsByProjectId()` |
| `Tickets/Templates/submodules/ticketFilter.blade.php` | +13 | „Oznake" kao multi-select |
| `Tickets/Controllers/ShowAllMilestonesOverview.php` | +1 | predaja `projectTags` |
| `Users/Services/Users.php` | +75 | `addUserWithoutInvite()` — račun s lozinkom, bez pozivnice |
| `Users/Controllers/NewUser.php` | +43 −1 | `saveDirect` grana (mora biti **prije** `save`) |
| `Users/Templates/newUser.blade.php` | +13 | kućica „bez pozivnice" + polje za lozinku |
| `Projects/…/projectHub.blade.php` | +1 −1 | ⭐ → Lucide `star` |
| `Projects/…/partials/projectHubProjects.blade.php` | +2 −2 | ⭐ i 🗂️ → ikone |
| `Widgets/…/myProjects.blade.php` | +2 −2 | ⭐ i 🗂️ → ikone |
| `Widgets/…/welcome.blade.php` | +5 −5 | 👋 ⏱️ 🥳 📥 🎯 → ikone |
| `Widgets/…/components/moveableWidget.blade.php` | +1 −1 | `{{ $name }}` → `{!! $name !!}` da naslov widgeta može nositi ikonu |

## Pravila da se ne ponovi današnji 500

- **Zakrpe se rade prema release tagu, nikad prema `master`.** Dana 2026-11-09 su tri templatea
  uploadana iz mastera i srušila `/projects/showMy` (`Class …ProjectFavoriteAdded not found`)
  jer release v3.13.2 tu klasu nema. Ako trebaš novu osnovu:
  `curl -H "Authorization: token $TOK" -L https://api.github.com/repos/Leantime/leantime/zipball/refs/tags/vX.Y.Z`
- **Sve što može ići u temu, ide u temu** (`public/theme/flat/`) — to nadogradnja ne dira.
- **Sve što može ići u `custom/Language/`, ide tamo** — čita se nakon core prijevoda.
- Prije svake nadogradnje: `php -l` na zakrpljenim PHP datotekama ili barem `/auth/login` + jedna
  stranica po modulu iz popisa gore.

## Datum i osnova

- Generirano: 2026-11-09
- Osnova: Leantime **v3.13.2** (`v3132.zip`, 2038 datoteka)
- Izvor istine: živa instalacija `https://trames.prometnice.com`
- Provjereno: svaka zakrpa primijenjena na svježu kopiju v3.13.2 daje **identične** datoteke živoj instalaciji
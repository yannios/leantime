# deploy

Everything needed to rebuild the live installation from a stock Leantime release.

| folder | what |
|---|---|
| `leantime-3.13.2/` | patches + procedure, based on the v3.13.2 release |
| `../public/theme/flat/` | the Flat theme (CSS, 214 Lucide icons, theme.js) - add it by copying, no patching |
| `../custom/Language/hr-HR.ini` | Croatian overrides (menu group titles, dashboard strings) - same, copy only |

Read `leantime-3.13.2/REAPPLY.md` before an upgrade. Short version: new release -> copy
`.env`, `userfiles/`, `custom/`, `public/theme/flat/` -> `./apply-patches.sh <new tree>` ->
`/install` -> clear cache -> walk the checklist.

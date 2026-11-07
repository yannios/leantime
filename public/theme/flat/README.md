# Flat theme

A minimalist skin for Leantime: corners reduced to a 2px hairline, one step larger
typography, quieter elevation.

## What it changes

| Layer | Change |
|---|---|
| Corners | All `--radius-*`, `--box-radius`, `--card-radius`, `--btn-radius`, `--input-radius`, `--modal-radius`, `--badge-radius` → 2px |
| Corners (hardcoded) | A sweep in `css/custom.css` normalises the ~500 rules that hardcode `border-radius`, then restores circles for faces, status dots, toggle knobs, spinners and the image cropper |
| Type | `--base-font-size` 14px → 15px, and the rest of the scale moves with it (`--font-size-s` 13px, `-l` 17px, `-xl` 19px, `-xxl` 21px, `-xxxl` 26px) |
| Elevation | Shadow tokens flattened; input shadow removed |
| Inputs | `--input-padding` 4px 10px → 6px 12px, primary button padding +2px |

Nothing else is touched: layout, colours, fonts, colour schemes and company
colours all still come from the user's own theme settings.

## Structure

```
theme.ini          name/description/logo/colours/capabilities
css/light.css      copy of the default theme's light sheet (base, unmodified)
css/dark.css       copy of the default theme's dark sheet (base, unmodified)
css/custom.css     this theme's overrides — loaded last by Theme::getCustomStyleUrl()
js/theme.js        optional script — Theme::getJsUrl() looks for js/theme.js (or theme.min.js)
```

The base sheets are copies so the theme is self-contained: `Theme::getStyleUrl()`
resolves `css/<colorMode>.css` from the *active* theme only, so a theme cannot
inherit another theme's sheet at runtime.

`css/custom.css` is normally gitignored (`public/theme/*/css/custom.css`) because it
is meant for per-installation tweaks. This theme ships one on purpose, so it had to
be added with `git add -f` — it is the only hook Leantime offers for a second layer
of rules, and keeping the overrides there leaves `light.css`/`dark.css` byte-identical
to the default theme's sheets, which makes them easy to refresh on upgrade.

## Install

Copy `public/theme/flat/` into the instance and pick **Flat** under
*Profile → Theme*. No database change, no core patch — `Theme::getAll()` scans
the `theme/` directory and `Theme::isValidTheme()` only requires the folder and
`theme.ini`.

A custom theme folder survives release upgrades, unlike `css/custom.css` inside
`theme/default/`, which a release overwrites.

## Contributing upstream

Plain `git diff` against `public/theme/` — nothing outside the folder changes.
Note that Leantime 3.13 added core colour schemes, so a new theme is most
welcome when it changes something a colour scheme cannot (density, corners, type).

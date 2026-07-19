# Team identity assets — attribution & licensing

Sources and licenses for the files in `crests/` and `flags/`.
Club crests and competition marks are trademarks of their respective owners;
they are used here solely as prototype/hackathon assets, not for commercial
distribution.

## Club crests (`crests/`)

| File | Club | Source | License |
|---|---|---|---|
| `saopaulo.svg` | São Paulo FC | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Brasao_do_Sao_Paulo_Futebol_Clube.svg) | Public domain |
| `riverplate.svg` | CA River Plate | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Escudo_del_C_A_River_Plate.svg) | Public domain |
| `milan.svg` | AC Milan | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Logo_of_AC_Milan.svg) | Public domain |
| `realmadrid.svg` | Real Madrid CF | [English Wikipedia](https://en.wikipedia.org/wiki/File:Real_Madrid_CF.svg) | Non-free logo, fair use; trademark of Real Madrid CF |
| `liverpool.svg` | Liverpool FC | [English Wikipedia](https://en.wikipedia.org/wiki/File:Liverpool_FC.svg) | Non-free logo, fair use; trademark of Liverpool FC |
| `corinthians.svg` | SC Corinthians Paulista | [English Wikipedia](https://en.wikipedia.org/wiki/File:Sport_Club_Corinthians_Paulista_crest.svg) | Non-free logo, fair use; trademark of SC Corinthians Paulista |

## National flags (`flags/`)

| File | Source | License |
|---|---|---|
| `br.svg`, `ar.svg`, `de.svg`, `fr.svg`, `it.svg`, `gb-eng.svg` | [flagcdn.com](https://flagcdn.com) | Free to use; national-flag designs are public symbols |

## Notes

- SVGs were sanitized on import (no scripts; `viewBox` guaranteed) and
  optimized with SVGO (`svgo.identity.config.mjs` at the repo root):
  `liverpool.svg` 864 KB → 359 KB, `corinthians.svg` 217 KB → 117 KB,
  visually verified identical after optimization.
- If this project ships publicly, replace the fair-use crests with licensed
  or officially provided media.

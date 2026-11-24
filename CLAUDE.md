# Sumgeon

A math-practice dungeon crawler. The player fights anthropomorphic monsters built from numbers and math symbols, and the answer to each problem is the damage dealt.

## Current state (prototype)
- Single file: `index.html` (HTML + CSS + vanilla JS, no build step). Open it in a browser to play.
- Fonts: Bungee (titles, numbers) and Nunito (body), from Google Fonts.
- Palette: chalkboard slate `#12242b`, panel `#1a313a`, chalk `#f3efe4`, coral `#ff5a4e`, gold `#ffc93c`, outline `#0c171c`.

## Core rules
- Damage = the correct answer. Three correct in a row turns on crits (double damage) until a miss.
- Wrong answer or timeout: lose 1 of 5 hearts and show the correct answer.
- Clearing a floor restores 1 heart.
- Monster HP = average answer for that monster's problem mix × its `hits` value, so fights last about the same number of solves on any difficulty.
- Each monster prefers its own operation 70% of the time when that operation is enabled. `mix` monsters use any enabled operation.

## Monsters (7 floors)
| Floor | Name | Glyph | Op | hits |
|---|---|---|---|---|
| 1 | Plusquito | + | + | 3 |
| 2 | Minustaur | − | − | 3 |
| 3 | Sevenstein | 7 | mix | 4 |
| 4 | Timesaur | × | × | 4 |
| 5 | Octoloop | 8 | mix | 5 |
| 6 | Divvy | ÷ | ÷ | 5 |
| 7 | Sigma Rex (boss) | Σ | mix | 7 |

Monsters are inline SVG drawn from simple shapes (no fonts), using the `solid()` and `line()` helpers. Each helper draws a dark outline, then a color fill, then a white sheen gradient.

## Settings
- Operations: any mix of + − × ÷.
- Difficulty: Easy (add ≤10, × ≤5, 15 s), Medium (≤20, ≤10, 12 s), Hard (≤50, ≤12, 10 s).
- Optional countdown timer.
- Settings and best floor are saved to localStorage under the key `sumgeon`.

## Design direction
See `DESIGN.md` for the full design: audience (ages 5–14) and content bands, the learning engine, Wings, progression, math input, game feel, recorded voice, achievements, players and linking, and milestones M1–M6. Check new work against its pillars.

Voice, achievements, players and linking copy the sibling project `../sound-box-crosswords` (see its `CLAUDE.md` and `js/speech.js`, `js/achievements.js`, `js/seal.js`, `js/merge.js`, `js/sync.js`, `sync/`). Read the matching code there before building any of these.

## Roadmap ideas (original seed list, expanded in DESIGN.md)
- More floors and monsters (π pirate, √ root creature, % gremlin, = twins)
- Endless mode with scaling HP and a high score
- Fractions, decimals and negative numbers
- Monster collection / bestiary screen showing defeated glyphs
- Sound effects and attack animations
- Player character and items (heal potion, shield, skip)
- Split into modules (monsters, problems, game loop, UI) once it grows

# Sumgeon

A math-practice dungeon crawler. The player fights anthropomorphic monsters built from numbers and math symbols, and the answer to each problem is the damage dealt.

## Current state
- Plain static files, no build step: `index.html` (markup), `styles.css`, and browser ES modules in `js/`:
  - `app.js`: everything on screen (game loop, menu and players, attack animations)
  - `problems.js`: problem generation and spoken text (`spoken`, `spokenProblem`, `spokenFact`)
  - `monsters.js`: monster data and SVG art
  - `store.js`: saved data (players, storage upgrade)
  - `sfx.js`: Web Audio sound effects
  - `speech.js`: `say(kind, text)`
  The modules other than `app.js`, `sfx.js` and `speech.js` have no DOM and run in Node.
- Modules need http, so run it with any static server: `python3 -m http.server 8791`, then open http://localhost:8791. Opening `index.html` as a file won't work.
- After editing, run `npm run check` (no install needed): it syntax-checks every module, runs `scripts/*.test.mjs`, checks the import map and stamped attributes, and checks saving goes through `store.js`. CI runs it too.
- Fonts: Bungee (titles, numbers) and Nunito (body), from Google Fonts.
- Palette: chalkboard slate `#12242b`, panel `#1a313a`, chalk `#f3efe4`, coral `#ff5a4e`, gold `#ffc93c`, outline `#0c171c`.

## Players and saving (patterned on sound-box-crosswords)
- `sumgeon:` holds the device's own data: `profiles` ([{ id, name }]), `profile` (who's playing), `storage` (version) and `device`.
- `sumgeon:@<id>:` holds one player's data. Every key saved there must be in `OWN_KEYS` in `store.js`, which throws on any other key.
- Storage version 2 moved the prototype's single `sumgeon` key into the `default` player, resumably.
- Names belong to the device. Remove only appears on a device with two or more players, never for the one playing, confirms with a second tap, and only affects this device.
- Settings (`ops`, `diff`, `timer`, `sfx`, `voice`) are per player and save as they change in the menu.

## Sound and voice
- `sfx.js` synthesizes every effect with Web Audio. The context is created on the first tap and woken on later taps, for iOS.
- `speech.js` `say(kind, text)` plays a recorded clip from `audio.json` when there is one, or falls back to the device voice.
  - Kinds: `p` phrase, `m` monster line, `n` number, `q` problem.
  - Every line the game says lives in `js/lines.js` (`PHRASE`, monster lines, and `facts()` from `problems.js`: sums and differences within 20, the 2–12 tables and their division facts, each as the problem and as "… is …"). `app.js` only says lines from there; `scripts/lines.test.mjs` fails on any other `say()`.
  - `scripts/audio/build.mjs` (patterned on Sound Box's) records each line as one whole clip with Kokoro (`af_heart`, speed 0.95). Whole clips won a listen test against stitched numbers, which sounded choppy.
    - Clip names hash model, voice, encoding, method, speed, kind and text, so a clip never changes once made.
    - Each build reads the live `index.json` from the audio host and records only missing clips.
    - `audio.json` lists only clips that are live, so a line without one uses the device voice.
    - With `GENERATE=false` (CI without the Cloudflare token) nothing is recorded.
    - Bigger problems (Hard mode, sums over 20) aren't recorded and use the device voice.
  - The audio host is the Cloudflare Pages project `sumgeon-audio` (https://sumgeon-audio.pages.dev/). CI's `audio-deploy` job uploads new clips; it needs the `CLOUDFLARE_API_TOKEN` secret.
  - To record locally on a Mac: `ASSET_BASE=https://sumgeon-audio.pages.dev/ KOKORO=container KOKORO_DIR=<folder for the model and venv> node scripts/audio/build.mjs`. Kokoro runs in Apple's `container` (the macOS espeak wheel is broken). Then upload with `npx wrangler pages deploy _audio --project-name sumgeon-audio --branch main`.
  - `scripts/audio/listen-test.sh` renders the whole-vs-stitched comparison, for any future method change picked by ear.
- The game speaks: monster names on arrival, "Crits on!" at 3 in a row, the right answer after a miss ("seven plus eight is fifteen"), floor clears, and the 🔊 buttons (the problem, the menu intro).

## Core rules
- Damage = the correct answer. Three correct in a row turns on crits (double damage) until a miss.
- Wrong answer or timeout: the monster lunges, lose 1 of 5 hearts, and the correct answer is shown and said.
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
- Settings and best floor are saved per player (see Players and saving).

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

## License
PolyForm Noncommercial 1.0.0 (`LICENSE.md`). Its first line is the `Required Notice:` copyright, which must travel with copies. When you add a dependency, font or asset, list it with its license in the README's License section.

## Publishing
- Public repo `jbtule/sumgeon`. Pushing to `main` deploys to GitHub Pages at https://tools.tuley.name/sumgeon/ through `.github/workflows/ci.yml`. `scripts/stamp.mjs` builds `_site/` (Sound Box's pattern): it copies the files in `SITE`, adds `?v=<short sha>` to each local file the page loads (`STAMPED`), and fills in the footer's GitHub badge with the short sha so you can see what's deployed (locally it reads "dev"). Add new site files to `SITE`, and anything the page loads to `STAMPED`.
- Workflows must pass `zizmor .`: actions pinned to a SHA, minimal `permissions`, and `persist-credentials: false`. CI runs zizmor too.

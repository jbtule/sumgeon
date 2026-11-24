# Sumgeon

A math-practice dungeon crawler. The player fights anthropomorphic monsters built from numbers and math symbols, and the answer to each problem is the damage dealt.

## Current state
- Plain static files, no build step: `index.html` (markup), `styles.css`, and browser ES modules in `js/`:
  - `app.js`: everything on screen (game loop, menu and players, attack animations)
  - `problems.js`: facts and spoken text (`facts`, `spoken`, `spokenProblem`, `spokenFact`)
  - `learn.js`: the learning engine: bands and levels, fact records, choosing problems, monster HP
  - `hints.js`: the classroom models for hints (`hintFor`)
  - `lines.js`: every line the game says
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
- Settings (`band`, `timer`, `sfx`, `voice`) are per player and save as they change in the menu. `ops` and `diff` are the prototype's, kept only so a player who practiced × or ÷ starts in Apprentice.

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
  - The audio host is the Cloudflare Pages project `sumgeon-audio`, served at the custom domain https://sumgeon.asset-data.stream/ (like Sound Box's). Use the custom domain, not `sumgeon-audio.pages.dev`: bare pages.dev ignores byte-range requests, and Safari's `<audio>` needs them. CI's `audio-deploy` job uploads new clips; it needs the `CLOUDFLARE_API_TOKEN` secret.
  - To record locally on a Mac: `ASSET_BASE=https://sumgeon.asset-data.stream/ KOKORO=container KOKORO_DIR=<folder for the model and venv> node scripts/audio/build.mjs`. Kokoro runs in Apple's `container` (the macOS espeak wheel is broken). Then upload with `npx wrangler pages deploy _audio --project-name sumgeon-audio --branch main`.
  - `scripts/audio/listen-test.sh` renders the whole-vs-stitched comparison, for any future method change picked by ear.
- The game speaks: monster names on arrival, "Crits on!" at 3 in a row, the right answer after a miss ("seven plus eight is fifteen"), floor clears, and the 🔊 buttons (the problem, the menu intro).

## Core rules
- Damage = the correct answer. Three correct in a row turns on crits (double damage) until a miss. A hinted answer still hits but doesn't build the streak.
- Problems come from the learning engine (`learn.js`, DESIGN.md §5), not at random:
  - Each player has a record per fact (`facts`): box 0–4, times seen and right, average answer time, last seen.
  - A right, unhinted answer moves a fact up a box (two when fast, from box 1). A miss sends it to box 0. A hinted answer changes nothing.
  - Each problem is about 60% learning facts (box 0–2, box 0 favored), 25% review facts that are due (box 3 after 10 minutes, box 4 after a day), and 15% new facts from the newest open level. The monster's operation is preferred 70% of the time. The last 3 facts don't repeat.
  - A missed fact comes back 2–4 problems later.
- Bands (`BANDS`) replace the prototype's operations and Easy/Medium/Hard:
  - **Sprout** (K–1st, 7 hearts): within 5 → within 10 → 10 and some more → within 20.
  - **Apprentice** (2nd–3rd, 5 hearts): within 20 → ×2, 5, 10 → ÷ → ×3, 4 → ÷ → ×6–9 → ÷ → ×÷ 11, 12.
  - A level opens when 70% of the level before is learned (box 3+). Every banded fact is one of the 633 recorded facts, so every problem has the recorded voice.
- Hints (`hints.js`, DESIGN.md §5.3) follow how classrooms teach now: ten-frames, 10 and some more, make 10, doubles plus one, draw and cross out, think addition on a number line, arrays, break apart, ×9 as ×10 minus a group, think multiplication.
  - A new fact shows its hint by itself. A fact being learned gets a 💡 button. A fact in review gets none.
  - After a miss, the worked example (with the answer) stays up until "Got it" or Enter.
  - Every hint has a "For grown-ups" note. The timer stops while a hint is open.
- Wrong answer or timeout: the monster lunges, lose 1 of 5 hearts, and the correct answer is shown and said.
- Clearing a floor restores 1 heart.
- Monster HP = the average answer of the player's open facts (the monster's operation weighted 70%) × its `hits` value, so fights last about the same number of solves at any level.

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
- Band: Sprout or Apprentice (per player). Changing band starts a fresh dungeon.
- Optional countdown timer: 15 s in Sprout, 12 s in Apprentice.
- Sound effects and voice.
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

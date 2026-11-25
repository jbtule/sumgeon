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
- Phones (under 760px wide) get a one-screen layout with no scrolling, all in CSS at the end of `styles.css`:
  - `.arena` and `.panel` become `display: contents`, so their parts share one grid. The arena's look moves to `.game::before`.
  - Top to bottom: the monster's box (its name and HP across the top, then the monster), then an open hint, then the problem and answer box as one line ("3 + 1 = [ ]", with the 🔊/💡 buttons first) right above the number pad. The monster is sized with container units to the room left, so it shrinks rather than hides.
  - Messages float as a pill under the monster.
  - The number pad docks at the bottom, clear of the home bar, with your hero and hearts under it, on your side of the screen and apart from the monster's.
  - Short phones (under 700px tall) get a tighter variant.
  - The footer badges are hidden on phones and repeated in Settings.
  - The page height comes from `--app-h`, measured from `visualViewport` by `fitToScreen` in `app.js`, not `100dvh`: with iOS Safari's floating toolbar, `100dvh` can include the strip behind it, which hid the number pad outside the Home Screen. The viewport meta has `viewport-fit=cover`, so the safe-area insets are real.
  - The phone `body` also sets `min-height: 0`, undoing the base `min-height: 100vh`: on iPhone Safari `100vh` is the height with the toolbars hidden, which forced the body 100px taller than the screen and hid the pad and hearts behind Safari's toolbar.
  - Open the game with `?layout` on a device to see what it reports: `innerHeight`, `visualViewport`, `100dvh`, the safe-area insets, `--app-h`, the body and `.game` heights, the grid rows, and where each part sits.
  - Test layout fixes on the real iPhone before merging: serve the branch locally and run `tailscale serve --bg <port>` (tailnet only), then turn it off with `tailscale serve --https=443 off`. Emulators don't have Safari's collapsing toolbars.
- iPad and desktop (760px and wider) use two columns with the same split: the left column is the monster's box (nameplate across the top, the monster, messages as a pill under it); the right column is your side (an open hint, then the problem and answer as one line, then the number pad, with your hero and hearts under it). The nameplate is pinned to the top of the monster's box, so an open hint doesn't move the monster. As on phones, `.arena` and `.panel` are `display: contents`; their boxes are `.game::before` and `::after`.
- Check layout changes at iPhone SE, iPhone 14, iPad (both orientations) and desktop sizes.
- Fonts: Bungee (titles, numbers) and Nunito (body), from Google Fonts.
- Palette: chalkboard slate `#12242b`, panel `#1a313a`, chalk `#f3efe4`, coral `#ff5a4e`, gold `#ffc93c`, outline `#0c171c`.

## Players and saving (patterned on sound-box-crosswords)
- `sumgeon:` holds the device's own data: `profiles` ([{ id, name }]), `profile` (who's playing), `storage` (version) and `device`.
- `sumgeon:@<id>:` holds one player's data. Every key saved there must be in `OWN_KEYS` in `store.js`, which throws on any other key.
- Storage version 2 moved the prototype's single `sumgeon` key into the `default` player, resumably.
- Names belong to the device. Remove only appears on a device with two or more players, never for the one playing, confirms with a second tap, and only affects this device.
- Settings (`band`, `sfx`, `voice`) are per player and save as they change in the menu. `ops` and `diff` are the prototype's, kept only so a player who practiced × or ÷ starts in Apprentice.

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
- The game speaks: monster names on arrival, "Crits on!" at 3 in a row, the right answer after a miss ("seven plus eight is fifteen"), floor clears, and the problem's 🔊 button. (`PHRASE.intro` is still recorded but no longer played.)

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
- Hints (`hints.js`, DESIGN.md §5.3) follow how classrooms teach now: ten-frames, 10 and some more, make 10, doubles plus one, draw and cross out, think addition on a number line, arrays, doubling (×4 as double ×2, ×8 as double ×4), break apart, ×9 as ×10 minus a group, think multiplication.
  - A new fact shows its hint by itself. A fact being learned gets a 💡 button. A fact in review gets none.
  - After a miss, the voice says "Oops!" then the right answer ("Oops! Seven plus eight is fifteen."), and the worked example opens as a card over the game: "Oops!", the fact with its answer, the drawing and the worked line, until "Got it" or Enter. The message under the monster says "Oops!" too.
  - Hints in play show only the drawing and its words. The explanation for grown-ups (`grownups` in `hintFor`) lives on ⚙ Settings → **How the hints work**: how the game teaches, then one card per strategy (`STRATEGIES` in `hints.js`) with the game's drawing.
- Wrong answer or timeout: the monster lunges, lose 1 of 5 hearts, and the correct answer is shown and said.
- Clearing a floor restores 1 heart (up to the band's hearts: 7 in Sprout, 5 in Apprentice).
- Monster HP = the average answer of the player's open facts (the monster's operation weighted 70%) × its `hits` value, so fights last about the same number of solves at any level. Deeper floors scale it (`depthScale` in `wings.js`): 0.8 on floor 1, rising evenly to 1.3 for the boss.
- **Coins** (`js/coins.js`, Trollar): a few US coins drawn in a row, biggest first; "how many cents?" typed on the number pad, and the total is the damage. No multiple choice: kids learn the coins by adding their values. Coins are a *strand* (`BANDS.coins`, `strand: true`): its own 98 facts (keys `¢q,d,n,p`) and levels (pennies to 10, each coin alone, nickels and pennies, dimes, quarters), asked by monsters with `strand: "coins"` whatever the Wing. The hint labels each coin's value and counts on from the biggest. The portraits are traced from public-domain US Mint photos (see the README). Spoken as "two dimes and three pennies. How many cents?" and "… make twenty-three cents".
- **Missing-number problems** (`js/missing.js`): a fact with one number hidden, like `3 + □ = 7`. The answer and the damage are the hidden number. The □ shows as a glowing "?" that fills as you type (the answer box hides), and the hint is the inverse fact's (3 + □ = 7 is 7 − 3). They use the fact's own record. Quizard asks only these; other monsters ask 15% of review facts (box 3+) this way. Spoken as "three plus what is seven", recorded for every fact.

## Wings, monsters and heroes
Runs happen in Wings (`js/wings.js`, DESIGN.md §4). Each Wing asks one band's facts and has a monster pool, a rescue floor (floor 3) and a boss:

| Wing | Band | Floors | Boss |
|---|---|---|---|
| The Counting Cellar | Sprout | Plusquito, Minustaur, rescue, Quizard, Trollar | Make-Ten Golem |
| The Tables Tower | Apprentice | Timesaur, Divvy, rescue, Starbot, pool, pool | Sigma Rex |

- A Wing opens the next when its boss is beaten and 60% of its facts are learned. The band a player starts in (`st.start`) opens that Wing from the start.
- Per player, progress is saved under `wings`: `{ [wingId]: { boss: wins, best: floors, stars: [best stars per floor] } }`.
- **Stars** (`floorStars` in `wings.js`, DESIGN.md §6.1): each floor awards ★ cleared, ★ no hearts lost on it, ★ a streak of 5 on it (hinted answers don't build streaks). The floor-cleared and win cards show them, and the Wing map shows each Wing's total.
- Sevenstein and Octoloop aren't regular floors any more: they're cursed digits (7, and 8, whose cursed form is Octoloop).
- **Monsters & Heroes** (📖 on the pause screen; `bookPage` in `app.js`, `js/bestiary.js`): every Wing's monsters, met or still a silhouette, with their trait, times beaten, and a mastery ring for the share of their kind of math learned (their operation's facts in their Wing's band; gold outline when full); then the ten heroes, rescued or still cursed. Monsters met and beaten are saved per player under `bestiary`: `{ [name]: { met, beaten } }` (cursed digits belong to the Heroes half).
- Cards over the game (`show(html, kind)`) open at the top and focus their main button (the last in `.btns`) without scrolling to it.
  - `"page"` (the default: the start screen, Settings, Monsters & Heroes, help, a run's end) fills a phone's screen, with its buttons docked full-width at the bottom; on iPad and desktop it's a centered card.
  - `"float"` (a floor cleared, a rescue, the Oops card) floats over the game as a centered card on every size. (Not "pop": that's the damage number's class.)
- The battle header is just the title and floor (sound is the device's volume; Settings has the on/off switches). ⏸ sits at the right of the hero-and-hearts row (or Escape): the pause card stops the clock mid-problem and offers Keep fighting (the same problem, with the time that was left), 📖 Monsters & Heroes, ⚙ Settings (without Players, since switching would end the run) and Exit the dungeon (a second tap confirms).
- The start screen has ⚙ Settings by the title (no speaker buttons outside the problem: volume is the device's keys), then your hero, the Wings, and Enter docked at the bottom. Short phones drop the tagline so it all fits.
- The start screen shows your hero as one line with "Change", which opens the grid of ten (the first time, the grid shows by itself). The run's end card uses the same line.
- Settings is a list: player rows, the chalk colors in one row, on/off switches for sound effects and voice, and "How the hints work ›".
- **Monster traits** (`js/traits.js`, DESIGN.md §3): one rule each, shown as a badge on the nameplate and explained in the message as the monster arrives. Plusquito has none (the tutorial monster).
  - Minustaur, ⚡ Charge: every 4th problem on the floor is charged (⚡ by the problem); a miss on it costs 2 hearts.
  - Timesaur, 🛡️ Armor: hits under 10 do half damage.
  - Divvy, ✂️ Split: at half HP its art splits into two smaller Divvies.
  - Quizard, ❓ Mystery: every problem hides a number (`blank` on the monster).
  - Trollar, 🪙 Toll: asks only coin problems (its `strand`).
  - Starbot, ⭐ Stripes: asks ×5 and ×10 facts 70% of the time (`like` in `choose`).
  - Make-Ten Golem, 🔟 Ten Smash: answers of 10 or more hit double.
  - Sigma Rex, 👑 Second wind: at half HP it armors up like Timesaur.
  - Cursed digits, 🍀 Lucky Number: answers with their digit hit double.
- **Digit heroes** (`js/heroes.js`, DESIGN.md §6.6): Zeroic (0), Onesie, Twodini, Threasure Hunter, Sir Fourtress, High Five, Sixlock Holmes, Sevenstein, Chef Eight, Nine-ja (9).
  - The start screen asks for a hero first, and the end-of-run card offers the hero picker again. The first pick can be any of the ten; after that, any hero on the team (picked or rescued) can lead a run. **Losing all your hearts curses the hero who led the run** (`curseCaptain` in `heroes.js`): it leaves the team, to be rescued again on a rescue floor, and the end card asks who leads next from the rest of the team, or from all ten when nobody is left (`freePick`, `pickHero`). Saved under `heroes`: `{ captain, color, rescued: [digits] }`.
  - The start screen holds only the hero, the Wings, "Enter the dungeon" and a ⚙ Settings link. Settings (as in Sound Box) holds Players (names optional, "Player 2" when blank), chalk color and sounds.
  - A right answer's digits fly at the monster: team digits as their hero, the rest as chalk numbers.
  - The captain's digit in the answer is a power hit (+50%). Each rescued hero in the answer adds 10%, up to 30%.
  - The rescue floor holds the lowest digit not yet free (never the captain), cursed. *Lucky Number*: answers with its digit hit double. Beating it frees the hero. Once all nine are free, it's a regular floor.
- Monsters and heroes are inline SVG drawn from simple shapes (no fonts), using the `solid()` and `line()` helpers. Each helper draws a dark outline, then a color fill, then a white sheen gradient.

## Settings
- Band: Sprout or Apprentice (per player). Changing band starts a fresh dungeon.
- No timer: the prototype's countdown was removed until there's a plan for it (a saved `timer` setting is ignored).
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

## Working on it
- **Every change goes through a pull request**, as in sound-box-crosswords: `git fetch`, branch from `origin/main`, push the branch, and open a PR. CI runs the check on the PR; merging to `main` deploys. Leave merging to Jay. Stage files by name rather than `git add -A`.
- More than one agent may be working at once; use a separate git worktree per agent when that happens.

## Publishing
- Public repo `jbtule/sumgeon`. Pushing to `main` deploys to GitHub Pages at https://tools.tuley.name/sumgeon/ through `.github/workflows/ci.yml`. `scripts/stamp.mjs` builds `_site/` (Sound Box's pattern): it copies the files in `SITE`, adds `?v=<short sha>` to each local file the page loads (`STAMPED`), and fills in the footer's GitHub badge with the short sha so you can see what's deployed (locally it reads "dev"). Add new site files to `SITE`, and anything the page loads to `STAMPED`.
- Workflows must pass `zizmor .`: actions pinned to a SHA, minimal `permissions`, and `persist-credentials: false`. CI runs zizmor too.

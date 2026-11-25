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
  - `sigil.js`: reading a drawn digit for spells (a $P point-cloud recognizer and its templates)
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
- iPad and desktop (760px and wider) use two columns with the same split. The right column sits at the bottom of its box, and the game is at least the screen's height, so a hint opening (a new fact's opens after a moment) grows into the space above and the problem and pad never move under a click: the left column is the monster's box (nameplate across the top, the monster, messages as a pill under it); the right column is your side (an open hint, then the problem and answer as one line, then the number pad, with your hero and hearts under it). The nameplate is pinned to the top of the monster's box, so an open hint doesn't move the monster. As on phones, `.arena` and `.panel` are `display: contents`; their boxes are `.game::before` and `::after`.
- Check layout changes at iPhone SE, iPhone 14, iPad (both orientations) and desktop sizes.
- No accidental zoom: `touch-action: manipulation` stops double-tap zoom (fast taps still register), and `app.js` stops pinches (`gesturestart`, two-finger `touchmove`), since Safari ignores `maximum-scale` for them.
- Fonts: Bungee (titles, numbers) and Nunito (body), from Google Fonts.
- Palette: chalkboard slate `#12242b`, panel `#1a313a`, chalk `#f3efe4`, coral `#ff5a4e`, gold `#ffc93c`, outline `#0c171c`.

## Players and saving (patterned on sound-box-crosswords)
- `sumgeon:` holds the device's own data: `profiles` ([{ id, name }]), `profile` (who's playing), `storage` (version) and `device`.
- `sumgeon:@<id>:` holds one player's data. Every key saved there must be in `OWN_KEYS` in `store.js`, which throws on any other key.
- **Dungeon version** (`DUNGEON_VERSION` in `app.js`, saved per player as `dungeon`), while we're before release: bump it when a balance change means saved runs should start over (how fast heroes are freed, how strata open). On the next load each player's dungeon progress resets (`wings`, `bestiary`, `best`, and heroes back to just their own captain, via `resetTeam`), keeping their hero, chalk color and settings. What's been learned (`facts`) is kept too, unless the version is in `LEARNING_RESETS` (version 3: placement and skipping ahead changed how learning counts). Add a line to its list saying why. Stop bumping it once real players are using the game.
- Storage version 2 moved the prototype's single `sumgeon` key into the `default` player, resumably.
- Names belong to the device. Remove only appears on a device with two or more players, never for the one playing, confirms with a second tap, and only affects this device.
- Settings (`band`, `sfx`, `voice`) are per player and save as they change in the menu. `ops` and `diff` are the prototype's, kept only so a player who practiced × or ÷ starts in Apprentice.

## Sound and voice
- `sfx.js` synthesizes every effect with Web Audio, on **the one Web Audio context the game uses**: the voice's sprites play on it too (`audioContext()`), since Safari handles one context far more reliably than two. A sound asked for while the context is paused waits for it to wake. Otherwise, the context is created on the first tap (with a moment of silence played inside it) and woken from any state but "running" on every tap, click or key, for iOS and for macOS Safari, which can leave it "interrupted". Open the game with `?audio` to see the context's state, errors and a Test sound button.
- `speech.js` `say(kind, text)` plays a recorded clip from `audio.json` when there is one, or falls back to the device voice.
  - Kinds: `p` phrase, `m` monster line, `n` number, `q` problem.
  - Names the voice should say differently from how they're written go in `SAY_AS` in `lines.js`: "Twodini" is said "Toodini" (too-DEE-nee, for the Houdini pun; Kokoro stresses "Twodini" up front), "Jr." is "Junior", "Mr." is "Mister", "Plusington" is "Plussington", "Chompette" is "Chomp-ette", "Nine-ja" is "Nine-jah", and Sevenstein's "Six, seven" gets pauses. Check a spelling with Kokoro's espeak phonemes before adding it (phonemizer in the Kokoro venv, run in `container`). These fixes usually come from the listen check.
  - Every line the game says lives in `js/lines.js` (`PHRASE`, monster lines, and `facts()` from `problems.js`: sums and differences within 20, the 2–12 tables and their division facts, each as the problem and as "… is …"). `app.js` only says lines from there; `scripts/lines.test.mjs` fails on any other `say()`.
  - `scripts/audio/build.mjs` (patterned on Sound Box's) records each line as one whole clip with Kokoro (`af_heart`, speed 0.95). Whole clips won a listen test against stitched numbers, which sounded choppy.
    - Clip names hash model, voice, encoding, method, speed, kind and text, so a clip never changes once made.
    - Each build reads the live `index.json` from the audio host and records only missing clips.
    - `audio.json` lists only clips that are live, so a line without one uses the device voice.
    - With `GENERATE=false` (CI without the Cloudflare token) nothing is recorded.
    - Bigger problems (Hard mode, sums over 20) aren't recorded and use the device voice.
  - The audio host is the Cloudflare Pages project `sumgeon-audio`, served at the custom domain https://sumgeon.asset-data.stream/ (like Sound Box's). Use the custom domain, not `sumgeon-audio.pages.dev`: bare pages.dev ignores byte-range requests, and Safari's `<audio>` needs them. CI's `audio-deploy` job uploads new clips; it needs the `CLOUDFLARE_API_TOKEN` secret.
  - To record locally on a Mac: `ASSET_BASE=https://sumgeon.asset-data.stream/ KOKORO=container KOKORO_DIR=<folder for the model and venv> node scripts/audio/build.mjs`. Kokoro runs in Apple's `container` (the macOS espeak wheel is broken). Then upload with `npx wrangler pages deploy _audio --project-name sumgeon-audio --branch main`.
  - **Audio sprites**: lines marked with a `sprite` in `lines.js` (today "names": the monster and hero lines) are also joined into one file per group, `s/<key>.mp3`, with a `.json` map of where each line starts. `build.mjs` builds them from the clips with ffmpeg (CI installs it), and `audio.json` lists them under `sprites`. In the game (`speech.js`) a sprite downloads and decodes with Web Audio after the first tap; until then, and if it fails, its lines play as single clips. Each line is still recorded whole, so it sounds the same.
  - **The listen check** (`listen/`, at `/sumgeon/listen/`): a grown-up page for hearing the recorded voice, patterned on Sound Box's. It plays one group of lines at a time (`GROUPS` and each line's `group` in `lines.js`): Phrases, Monsters & heroes, Add & subtract, Times & divide, Missing numbers, Coins, Two-digit, Balance Hall.
    - **Play/Pause** runs through the unheard lines (or the issues, or all) one after another, and a line that plays to the end unflagged counts as OK.
    - **⚑ Something's wrong** pauses, flags the line just heard with tags and a note, and Save & continue carries on.
    - Marks are per device (`sumgeon:listen`), keyed by clip key, so a re-recorded line is unheard again.
    - **Report** copies the flagged lines or opens a GitHub issue with them.
    - It reads the site's `audio.json`, or the live one when run locally.
    - It's `noindex` and nothing in the game links to it; the check enforces both.
    - It has the game's GitHub badge with the deployed commit, which `stamp.mjs` fills in. `stamp.mjs` also stamps `listen.js` and fills the page's import map, so the game modules it reads (`js/lines.js` and its imports) are the deployed ones. Unstamped, a cached old `lines.js` showed new lines as "not recorded yet".
    - Keys: space plays or pauses, F flags, R replays, ← goes back.
  - `scripts/audio/listen-test.sh` renders the whole-vs-stitched comparison, for any future method change picked by ear.
- The game speaks: "Now entering the Sumgeon!" when you tap Enter the dungeon, monster names on arrival, "Critical hits!" at 3 in a row, the right answer after a miss ("seven plus eight is fifteen"), floor clears, and the problem's 🔊 button. (`PHRASE.intro` is still recorded but no longer played.)

## Core rules
- Damage = the correct answer. Three correct in a row turns on crits (double damage) until a miss. A hinted answer still hits but doesn't build the streak.
- Problems come from the learning engine (`learn.js`, DESIGN.md §5), not at random:
  - Each player has a record per fact (`facts`): box 0–4, times seen and right, average answer time, last seen.
  - A right, unhinted answer moves a fact up a box (two when fast, from box 1). A miss sends it to box 0. A hinted answer changes nothing.
  - **Fluent** means right, unhinted and under `fluentTime(band.fluentMs, answer)`: 4 s in Sprout and Apprentice (counting the reading and the taps), plus 1 s for each extra digit to tap. At 3 s, about half a fluent adult's answers counted as slow.
- **Skipping ahead** (`tiers`, `probeKey`, `skipTo` in `learn.js`): each band's facts, easiest first, are cut into tiers of about 20 that stay inside a level. After two fluent answers in a row, each problem is a probe: a fact not yet learned from the tier above the first one not yet learned. **5 fluent out of the last 6 probes** (`SKIP_PROBES`, `SKIP_WINDOW`) count everything below the probe's tier as known ("You already know these. Skipping ahead!"), so one mis-tap doesn't undo it. Two slips in the window pause probing for 3 problems. Skipped facts come back as reviews. `node scripts/balance-sim.mjs` simulates it: a fluent player opens the next strata in about 4–5 runs, and a learner never skips.
- **Placement:** a fact seen for the first time and answered right, fast (under the band's `fluentMs`) and unhinted is already known and goes straight to box 3 (learned), so a fluent player isn't held back.
  - Each problem is about 60% learning facts (box 0–2, box 0 favored), 25% review facts that are due (box 3 after 10 minutes, box 4 after a day), and 15% new facts from the newest open level. The monster's operation is preferred 70% of the time. The last 3 facts don't repeat.
  - A missed fact comes back 2–4 problems later.
  - **Variety:** a problem is never the same kind (operation) with the same answer as either of the last two when there's another choice (`avoidAns` in `choose` and `probeKey`, as "op ans"). The same answer from a different kind (3 + 7 after 17 − 7) is fine. The teen subtraction facts all equal 10, and with Minustaur preferring − they came up in a row.
- Bands (`BANDS`) replace the prototype's operations and Easy/Medium/Hard:
  - **Sprout** (K–1st, 7 hearts): within 5 → within 10 → 10 and some more → within 20.
  - **Apprentice** (2nd–3rd, 5 hearts): within 20 → ×2, 5, 10 → ÷ → ×3, 4 → ÷ → ×6–9 → ÷ → ×÷ 11, 12.
  - A level opens when 70% of the level before is learned (box 3+). Strands (coins, two-digit) open theirs at 50% (`unlock`), since they're asked one floor a run. Every banded fact is one of the 633 recorded facts, so every problem has the recorded voice.
- Hints (`hints.js`, DESIGN.md §5.3) follow how classrooms teach now: ten-frames, 10 and some more, make 10, doubles plus one, draw and cross out, think addition on a number line, arrays, doubling (×4 as double ×2, ×8 as double ×4), break apart, ×9 as ×10 minus a group, think multiplication.
  - A new fact shows its hint by itself after 3.5 s (`NEW_HINT_MS`), with 💡 there at once, so a player who knows it can answer first and get the credit. A fact being learned gets a 💡 button. A fact in review gets none.
  - After a miss, the voice says "Oops!" then the right answer ("Oops! Seven plus eight is fifteen."), and the worked example opens as a card over the game: "Oops!", the fact with its answer, the drawing and the worked line, until "Got it" or Enter. The message under the monster says "Oops!" too.
  - Hints in play show only the drawing and its words. The explanation for grown-ups (`grownups` in `hintFor`) lives on ⚙ Settings → **How the hints work**: how the game teaches, then one card per strategy (`STRATEGIES` in `hints.js`) with the game's drawing.
- Wrong answer or timeout: the monster lunges, lose 1 of 5 hearts, and the correct answer is shown and said.
- Clearing a floor restores 1 heart (up to the band's hearts: 7 in Sprout, 5 in Apprentice).
- Monster HP = the average answer of the player's open facts (the monster's operation weighted 70%) × its `hits` value, so fights last about the same number of solves at any level. Deeper floors scale it (`depthScale` in `wings.js`): 0.8 on floor 1, rising evenly to 1.3 for the boss.
- **Coins** (`js/coins.js`, Trollar): US coins typed on the number pad, never multiple choice. Coins are a *strand* (`BANDS.coins`, `strand: true`) with its own 134 facts and six levels, asked by monsters with `strand: "coins"` whatever the Wing:
  - **Find the coin** (K, naming the coins): a shuffled pile of heads and tails, and the voice asks "How many quarters?" by itself when it appears (a pre-reader can't read the word). The count is the answer, typed into a glowing "?" under the pile ("quarters = ?", `.game.find`), so the row fits an iPhone SE. Keys `¢?q:q,d,n,p`.
  - **Each coin** (K, values): one coin, drawn big, heads or tails (`¢0,1,0,0`, `¢t0,1,0,0`), "How many cents?". The voice never names it; after a miss it says the K guide's words: "This is a dime. A dime is small and silver. It's worth ten cents."
  - Then counting (1st grade): 2 to 6 pennies, nickels and pennies, dimes, quarters (`¢q,d,n,p`), "two dimes and three pennies. How many cents?", the total is the answer, biggest first.
  - `pileOf` lays the coins out each time: sides at random, a find pile shuffled; `app.js` keeps it on the problem so the hint shows the same pile.
  - Hints: find shows that coin's two sides, then the pile with it ringed in gold; one coin shows all four with values, then that coin's two sides; counting labels each value and counts on from the biggest.
  - Heads are traced from public-domain US Mint photos (see the README). Backs are drawn from simple shapes (`BACKS`): the penny's Union Shield, the nickel's Monticello, the dime's torch and branches, the quarter's classic eagle (the K guide names it; newer quarters vary too much to pick one).
- **Two-digit + and − within 100** (`js/twodigit.js`, Haberhasher, 2nd grade): a strand (`BANDS.place`) in seven levels: add tens, add ones, add tens and ones, add and regroup, subtract tens, subtract without regrouping, subtract and regroup. Each level is a fixed sample (200 facts in all), so 70% of a level can be learned and every problem is recorded (both orders of a sum). Hints: base-ten blocks with "tens and ones" for adding; tens crossed out, or counting up on an open number line (to the next ten, by tens, then the rest) for subtracting. It's a strand rather than levels in Apprentice so it doesn't lock multiplication for players already there.
- **The Balance Hall** (`js/balance.js`, K–2nd): the `balance` band, 120 fixed problems in three levels (compare and balance to 10; sums on both sides; compare to 100), each level with both kinds, opening at 50%.
  - **Comparing** (Chompers, op `○`): "3 + 4 ○ 8". The answer is the symbol, typed on **< = > keys** that take the number pad's place (`padUI`), three rows tall so nothing moves; on a keyboard `<`, `=`, `>` (or `,` and `.`). It's a math symbol typed like a digit, not multiple choice. A right answer hits for the **bigger number** (Chompers eats it), and that number's digits fly.
  - **Balancing** (the Equal Twins, op `=`): "3 + 4 = □ + 5", "7 = □ + 2". The hidden number is the answer and the damage.
  - Hints: dot rows to line up (to 10, and sums), tens then ones (to 100), and a balance scale ("Both sides are the same. 3 + 4 = 7, so □ + 5 = 7. 7 − 5 = ?").
  - Spoken: "Compare three plus four and eight.", "three plus four is less than eight", "three plus four equals what plus five".
- **Missing-number problems** (`js/missing.js`): a fact with one number hidden, like `3 + □ = 7`. The answer and the damage are the hidden number. The □ shows as a glowing "?" that fills as you type (the answer box hides), and the hint is the inverse fact's (3 + □ = 7 is 7 − 3). They use the fact's own record. Quizard asks only these; other monsters ask 15% of review facts (box 3+) this way. Spoken as "three plus what is seven", recorded for every fact.

## Wings, monsters and heroes
Runs happen in Wings (`js/wings.js`, DESIGN.md §4), called **strata** (one **stratum**) wherever the game shows the word; the code keeps "wing". Each Wing asks one band's facts and has a monster pool, a rescue floor (floor 3) and a boss:

| Wing | Band | Floors | Boss |
|---|---|---|---|
| The Counting Cellar | Sprout | Plusquito, Minustaur, rescue, Quizard, Trollar | Make-Ten Golem |
| The Balance Hall | Balance | Chompers, Equal Twins, rescue, Chompers, pool | The Unknown |
| The Tables Tower | Apprentice | Timesaur, Divvy, rescue, Starbot, Haberhasher, pool | Sigma Rex |

- **Depth** (`depthHP`, `deepest` in `wings.js`): beating a Wing's boss opens its next depth, saved as `wings[id].depth` (the deepest reached). The win card's main button is **Go deeper** (depth + 1), with Play again (same depth) and Menu; a loss offers Try again. "Enter the dungeon" starts at the deepest depth.
  - Each depth is tougher: HP × (1 + 0.15 per depth).
  - Every floor but the rescue floor and the boss is drawn from the pool, never the same monster twice in a row.
  - More of the newest problems: `choose`'s fresh share goes from 15% to 35%.
  - The room darkens (`--murk`, 8% per depth up to 48%).
  - Shown as "Depth 2 · Floor 1 / 6" and on the Wing map, and said as "Depth two!" (recorded to 20).
  - It keeps runs from feeling the same while the next Wing waits on mastery.
- **The depth map** (`wingsHTML`, `depthTrack`, `.strata`): the start screen shows the strata as rock layers under a grassy surface, each in its own texture. Each open layer has a shaft of its depths going down: cleared (gold), "you are here" (coral), and the ones below. It starts at `MAP_DEPTHS` (5) rows and grows as you go deeper; after 8 rows the early cleared ones fold into one. Tap a layer to pick it. Depth never opens the next strata; only mastery does.
- **The dive** (`diveUI`, `#dive`): during a fight, the same shaft runs down the left edge of the monster's box, every depth from 1 to two below the deepest. It scrolls (swipe it), opening with this run's depth in the middle, and fades at the ends. On phones it's dots only, and tapping one shows its score in a bubble ("Depth 3: ★ 12 of 18"); on iPad and desktop it shows the depth numbers and scores.
- **Depth scores**: the most stars earned in one run at a depth, saved as `wings[id].depthStars[depth]` (out of 3 per floor: 18 in the Cellar and Hall, 21 in the Tower), shown on the dive and the depth map.
- **Colors**: each stratum has its own palette to go with its wall (`body[data-stratum]` in `styles.css`: `--bg`, `--panel`, `--line`, `--btn`, `--btn2`, `--edge`, `--muted`, `--dark`): warm browns for the Cellar, blue-slate for the Hall, stone grey for the Tower. Gold and coral stay the accents. Use these variables, not fixed colors, for new UI.
- **Walls**: each stratum has a tiling wall (inline SVG in `styles.css`: `--wall-cellar` bricks, `--wall-hall` marble tiles, `--wall-tower` big stone blocks), behind the monster in a fight (`data-stratum` on `.game`, set by `newRun`) and on its map layer. The Tables Tower is a tower that goes down.
- A Wing opens when the Wing it comes `after` has its boss beaten and 60% of its facts learned: the Cellar opens both the Hall and the Tower. The band a player starts in (`st.start`) opens every Wing at that grade or below (`GRADE` in `wings.js`), so starting in Apprentice opens all three.
- Per player, progress is saved under `wings`: `{ [wingId]: { boss: wins, best: floors, stars: [best stars per floor] } }`.
- **Stars** (`floorStars` in `wings.js`, DESIGN.md §6.1): each floor awards ★ cleared, ★ no hearts lost on it, ★ all fast: every answer on it right, quick (under the band's `fluentMs`) and without a hint. A short floor can earn all three (a streak of 5 couldn't be reached on a 3-problem floor). The floor-cleared and win cards show them, and the Wing map shows each Wing's total.
- Sevenstein and Octoloop aren't regular floors any more: they're cursed digits (7, and 8, whose cursed form is Octoloop).
- **Monsters & Heroes** (📖 on the pause screen; `bookPage` in `app.js`, `js/bestiary.js`): every Wing's monsters, met or still a silhouette, with their trait, times beaten, and a mastery ring for the share of their kind of math learned (their operation's facts in their Wing's band; gold outline when full); then the ten heroes, rescued or still cursed. Monsters met and beaten are saved per player under `bestiary`: `{ [name]: { met, beaten } }` (cursed digits belong to the Heroes half).
- Cards over the game (`show(html, kind)`) open at the top and focus their main button (the last in `.btns`) without scrolling to it.
  - `"page"` (the default: the start screen, Settings, Monsters & Heroes, help, a run's end) fills a phone's screen, with its buttons docked full-width at the bottom; on iPad and desktop it's a centered card.
  - `"float"` (a floor cleared, a rescue, the Oops card) floats over the game as a centered card on every size. (Not "pop": that's the damage number's class.)
- The battle header is just the title and floor (sound is the device's volume; Settings has the on/off switches). ⏸ sits at the right of the hero-and-hearts row (or Escape): the pause card stops the clock mid-problem and offers Keep fighting (the same problem, with the time that was left), 📖 Monsters & Heroes, ⚙ Settings (without Players, since switching would end the run) and Exit the dungeon (a second tap confirms).
- The start screen has ⚙ Settings by the title (no speaker buttons outside the problem: volume is the device's keys), then your hero, the Wings, and Enter docked at the bottom. Short phones drop the tagline so it all fits.
- The start screen shows your hero as one line with "Change", which opens the grid of ten (the first time, the grid shows by itself). The run's end card uses the same line.
- Settings is a list: player rows, the chalk colors in one row, on/off switches for sound effects and voice, and "How the hints work ›".
- **Looks** (`LOOKS`, `lookOf` in `monsters.js`): each regular monster has four more looks with their own fun names (Minustaur's Mom, King Minus, Baby Minustaur, Professor Minustaur). A look is the same symbol drawing with extras from a kit placed on its face and head (`ANCHOR`, `KIT`: crown, bow, lashes, glasses, monocle, sunglasses, eyepatch, top hat, nightcap with sleepy eyes, headband, scarf, bow tie, medal, spiral eyes, sparkles, or drawn smaller). A look can be "he" or "she" (the third item in `LOOKS`), and its lines say "his" or "her" (Minustaur's Mom loses her footing). It keeps its monster's trait and math (`m.base`; `traits.js` checks `kind(m)`). Depth 1 has the originals; below it each floor's look is fixed per stratum, depth and floor (`dressed` in `wings.js`). Meeting a look counts as meeting its monster, and Monsters & Heroes shows each monster's looks found. Every look's lines are recorded. Bosses and cursed digits have no looks.
- **Spell casting** (`castSpell` and friends in `app.js`, `js/sigil.js`):
  - **When:** about 1 problem in 6 (`SPELL_SHARE`), on touch screens only (`any-pointer: coarse`; drawing with a mouse isn't writing). The answer must be a single digit, the fact already learned, and the problem not a skip-ahead probe. `?spells` makes every single-digit problem a spell, for testing.
  - **The pad:** the number pad becomes a glowing drawing pad in the same space (`padUI("spell")`), with Clear and Cast. The voice says "Cast a spell!".
  - **Reading:** `sigil.js` is a $P point-cloud recognizer on the device (no machine learning, no server). It has several templates per digit for how kids write them (open and closed 4, 7 with or without a crossbar, 1 with or without a flag and base, 9 straight or curly, 2 with or without a loop), plus mirrored copies that mean reversed (not for 0, 8 or a plain 1, which look the same mirrored).
    - A read is **clear** when its fit is at least `CLEAR.fit` and it's ahead of the next digit by `CLEAR.margin`.
    - It counts as **reversed** only when the mirror is clearly the better match (`REVERSED_MARGIN`), so a wobbly 1 gets the benefit of the doubt.
  - **Outcomes:**
    - Clear and right: it hits, and the drawing is saved as one of the player's own templates (the last 3 per digit).
    - Clear but backwards: half damage, the digit shown the right way round with an arrow, and "Your 3 is facing backwards. It faces this way."
    - Clear but another digit: a wrong answer.
    - Not clear: "Incantation failed!", no heart lost, try again. After two, the number pad comes back.
  - **Kept out of learning:** a spell changes no fact record, timing, placement, skipping or the "all fast" star.
  - **Saved** per player as `spells`: `{ templates, reversed: { digit: count }, cast }`.
  - **The spell check** (`spell/`, at `/sumgeon/spell/`): a grown-up page, built like the listen check. Draw any digit and see the read, its fit and margin, and whether it's reversed, with or without a player's learned handwriting. It also shows each player's backwards counts by digit. `scripts/sigil.test.mjs` tests every template, its mirror, messy copies and a scribble.
- **Boss roars** (`roarSoon` in `app.js`, `roar` in `sfx.js`): every 9–15 s of a boss fight, while you're working on a problem (never during an attack, a card, a hint or the pause), the boss growls (a low, wobbling saw tone over a rumble) and rears up and shakes while the room flickers darker. With reduced motion it only growls.
- **Monster traits** (`js/traits.js`, DESIGN.md §3): one rule each, shown as a badge on the nameplate and explained in the message as the monster arrives. Plusquito has none (the tutorial monster).
  - Minustaur, ⚡ Charge: every 4th problem on the floor is charged (⚡ by the problem); a miss on it costs 2 hearts.
  - Timesaur, 🛡️ Armor: hits under 10 do half damage.
  - Divvy, ✂️ Split: at half HP its art splits into two smaller Divvies.
  - Quizard, ❓ Mystery: every problem hides a number (`blank` on the monster).
  - Trollar, 🪙 Toll: asks only coin problems (its `strand`).
  - Haberhasher, 🔢 Tens and ones: asks only two-digit problems (its `strand`).
  - Chompers, 🐊 Big Bite: comparisons; hits for the bigger number.
  - Equal Twins, ⚖️ Balance: balance equations.
  - The Unknown (the Hall's boss), 🌀 Shapeshift: switches between comparing and balancing.
  - Starbot, ⭐ Stripes: asks ×5 and ×10 facts 70% of the time (`like` in `choose`).
  - Make-Ten Golem, 🔟 Ten Smash: answers of 10 or more hit double.
  - Sigma Rex, 👑 Second wind: at half HP it armors up like Timesaur.
  - Cursed digits, 🍀 Lucky Number: answers with their digit hit double.
- **Digit heroes** (`js/heroes.js`, DESIGN.md §6.6): Zeroic (0), Onesie, Twodini, Threasure Hunter, Sir Fourtress, High Five, Sixlock Holmes, Sevenstein, Chef Eight, Nine-ja (9).
  - The start screen asks for a hero first, and the end-of-run card offers the hero picker again. The first pick can be any of the ten, and so can any pick while the dungeon has no progress yet (nothing played, say after a reset, and the team is just your own hero; `freePick(team, fresh)`). After that, any hero on the team (picked or rescued) can lead a run. **Losing all your hearts curses the hero who led the run** (`curseCaptain` in `heroes.js`): it leaves the team, to be rescued again on a rescue floor, and the end card asks who leads next from the rest of the team, or from all ten when nobody is left (`freePick`, `pickHero`). Saved under `heroes`: `{ captain, color, rescued: [digits] }`.
  - The start screen holds only the hero, the Wings, "Enter the dungeon" and a ⚙ Settings link. Settings (as in Sound Box) holds Players (names optional, "Player 2" when blank), chalk color and sounds.
  - A right answer's digits fly at the monster: team digits as their hero, the rest as chalk numbers.
  - The captain's digit in the answer is a power hit (+50%). Each rescued hero in the answer adds 10%, up to 30%.
  - The rescue floor holds the lowest digit not yet free (never the captain), cursed. **Breaking the curse takes 3 wins** (`CURSE_HITS`, `crackCurse` in `heroes.js`): the first two crack it ("The curse is cracking!", "1 of 3", with gold cracks on the cursed hero, saved as `heroes.cracks[digit]`), and the third frees the hero. The rescue floor keeps the same hero until then. A captain cursed by losing starts a fresh curse. *Lucky Number*: answers with its digit hit double. Beating it frees the hero. Once all nine are free, it's a regular floor.
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
- **Icon**: Plusquito on the Cellar's bricks. `design/icon/` holds the source (see its README): `make.mjs` draws the layers and `favicon.svg`, and `site.py` renders `apple-touch-icon.png` and the manifest's `icon-192.png`/`icon-512.png` from the Icon Composer document. `manifest.webmanifest` (standalone, the Cellar's brown) and the icons are stamped like the page's other files.
- **Update checking** (`checkUpdate` in `app.js`): `stamp.mjs` writes `version.json` (`{ sha }`). The game asks for it, uncached, when it wakes up (visibilitychange, focus, pageshow, so also the Home Screen app coming back) and every 15 minutes. If a different version is deployed, it reloads at the next safe moment: the start screen, never mid-run (Settings and Monsters & Heroes wait too). The reload adds `?v=<sha>` to the address so the browser can't reuse its cached old page, and it tries once per version (`sumgeon:update` in sessionStorage), so a stale cache can't loop. Locally the badge reads "dev" and nothing is checked.
- Workflows must pass `zizmor .`: actions pinned to a SHA, minimal `permissions`, and `persist-credentials: false`. CI runs zizmor too.

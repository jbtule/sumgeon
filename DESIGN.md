# Sumgeon — Design Direction

_Last updated 2026-11-23. Companion to `CLAUDE.md`. That file describes what the prototype is today. This file says where it's going._

---

## 1. Vision

**Sumgeon is a math-fact dungeon crawler where your answer is your weapon.** Every problem you solve becomes an attack. The number you type flies at a monster made of numbers and symbols. The game should feel like a real game first, with practice built in. A kid should want "one more floor" without anyone asking them to do math.

### Design pillars
1. **The answer is the attack.** Every system should support the idea that math is the player's power. Correct answers do damage, faster and streakier answers do more, and harder problems hit harder. We never add a mechanic that lets you win without doing math.
2. **Failure teaches and never shames.** A miss always shows the right answer, and that problem comes back later. Losing a run costs a little and gives the player something to learn from. No mocking copy and no red "WRONG" screens.
3. **One game, ages 5 to 14.** The same dungeon and the same monsters work for a kindergartner doing 3 + 4 and an eighth-grader doing −3 × (4 − 9). Difficulty comes from *content bands*, not separate games.
4. **Short sessions and instant start.** A floor takes 1–2 minutes and a full run about 10–15. Opening the page gets you into play within two taps.
5. **Chalkboard charm.** The monsters are living glyphs drawn in chalk-and-slate style. New content keeps the existing look: SVG shapes, thick dark outlines, flat fills with a sheen, and the Bungee/Nunito fonts.
6. **Private, offline, free of manipulation.** No accounts, no ads, and no dark patterns such as loot boxes, energy timers or streak-shaming. Progress is saved on the device. The only network use is fonts, recorded voice clips, and **optional** device linking, which is end-to-end encrypted so the server can't read it (§15).

---

## 2. Audience and content bands

The age range is 5–14 (kindergarten to 8th grade), which is too wide for one difficulty slider. The game instead has **four content bands**. Each band sets which problem types appear, the number ranges, the input method and the defaults for timer and hints. A player (or parent) picks a band, and the game adapts within it (see §5).

| Band | Ages (≈ grade) | Core skills | Defaults |
|---|---|---|---|
| **Sprout** | 5–7 (K–1) | How many? (dot flash); compare; add/subtract fluently within 5, then within 10, then 20; make 10; teen numbers as 10 + ones; counting on; doubles; count by 1s and 10s, then 5s; coin names, then values | No timer, word-free UI with spoken instructions, visual hints (dots, ten-frames), 7 hearts |
| **Apprentice** | 8–9 (2–3) | Add/subtract within 100; count by 2s; arrays up to 5×5; money with $ and ¢; times tables to 10; division as an inverse fact | Timer off, hints on, 5 hearts |
| **Adept** | 10–11 (4–5) | Multi-digit ×÷, tables to 12, fractions (equivalent, add like denominators), decimals to tenths and hundredths | Timer optional, 5 hearts |
| **Master** | 12–14 (6–8) | Negatives, order of operations, percents, exponents and roots, one-step equations | Timer on, 5 hearts, harder bosses |

The current Easy, Medium and Hard settings become difficulty levels *inside* a band. The operation checkboxes become a "custom practice" option for parents and teachers (§9).

**Plan (2026-11-25): one band per grade, K through 5th.** The four bands above were drawn by age. A review against the Missouri Learning Standards and the curriculum guides of the players' school found that this mixes grades: Apprentice made a 3rd grader clear sums within 20 before multiplication, the Sprout Wing asked 2nd-grade coin counting, and 2nd grade's two-digit math hid in the Tables Tower. So Sprout, Balance and Apprentice become a band per grade, K, 1st, 2nd and 3rd, and Adept becomes 4th and 5th. Each grade's band is one stratum (§4), with its levels in the order the school teaches them. Master (6th–8th) stays as it is, for the later strata.
- A new player picks their **grade** (K–5) instead of a band. It opens every stratum up to that grade, as the band does now.
- What each grade asks follows the guides, limited to what works as a quick typed answer (§4). Shapes, angles, graphs, the coordinate plane, measurement conversions, prime or composite (a yes/no) and word problems are left out of fights.
- The guides' own models and words decide how the hints teach (§5.3); the standards decide what each grade covers.

**Design rules for the youngest players (Sprout):**
- The target player is a **pre-reader who reads numbers and symbols fluently**. Problems are plain numerals and symbols, the same as in every other band. Only the *words* need help: every instruction, button and menu gets an icon, and can be read aloud with `speechSynthesis`. Reading problems aloud is available but not needed.
- Hearts stay, at 7 instead of 5. Losing a run is fine at this age as long as the copy is kind and the next run starts right away.
- **No multiple choice in any band.** Every answer is typed, so the player has to work it out rather than recognize or guess it.
- No timer by default. Pressure stops young kids from learning. (The prototype's optional countdown was removed on 2026-11-24 until there's a plan for it; the timer ideas below are parked.)
- Use bigger touch targets (≥ 64 px) and fewer buttons on screen at once.
- Show a visual model next to the numbers: dot groups for 3 + 4 and a ten-frame for make-ten.

---

## 3. Core loop (keep, then deepen)

The current loop works and stays at the center:

> See monster → read problem → type answer → hit (or get hurt) → monster falls → descend.

What changes:

| Current | Direction |
|---|---|
| Damage = answer; crit ×2 after a 3-streak | Keep both. Add a **speed bonus** when the timer is on (answering in the first third of the time gives +25%). This rewards fluency, not only accuracy. |
| A miss costs a heart and shows the answer | Keep. Also **queue the missed problem** to come back 2–4 problems later (see §5). Getting it right the second time shows a small "Got it!" moment. |
| The answer pops up as a number | **Your answer summons its digits**: each digit is a hero that attacks (§6.6). |
| One monster per floor | Floors can sometimes have **two weak minions** or **an elite** variant, such as a gold-outlined Plusquito with more HP and a special rule. |
| Clearing a floor heals 1 heart | Keep, and add **a choice between floors** (§6.3) so the player decides something besides "next". |
| 7 fixed floors | A run becomes a trip through one **Wing** (§4) with 5–7 floors and a boss. Wings unlock as you clear them. |

### Monster abilities (light, readable, math-based)
Each monster gets one simple trait that changes *how* you do math, never anything unfair (built in `js/traits.js`):
- **Plusquito**: none (the tutorial monster).
- **Minustaur**: ⚡ *Charge*. Every 4th problem is charged, and a miss on it costs 2 hearts.
- **Timesaur**: 🛡️ *Armor*. Hits under 10 do half damage, so bigger products matter.
- **Divvy**: ✂️ *Split*. At half HP it splits into two half-size Divvies.
- **Starbot**: ⭐ *Stripes*. It asks the ×5 and ×10 tables more often.
- **Make-Ten Golem**: 🔟 *Ten Smash*. Answers of 10 or more hit double.
- **Haberhasher (#)**: 🔢 *Tens and ones*. A # with eyes, in the Tables Tower. Asks two-digit sums and differences within 100, with base-ten and count-up hints.
- **Trollar**: 🪙 *Toll*. Asks only coin problems: count the coins, type the cents.
- **Quizard**: ❓ *Mystery*. Every problem hides a number (3 + □ = 7); the hidden number is the damage. Its body is a big question mark in a wizard hat.
- **Sigma Rex**: 👑 *Second wind*. At half HP it armors up like Timesaur.
- **Cursed digits** (Sevenstein, Octoloop and the other eight; §6.6): 🍀 *Lucky Number*. Answers containing its digit deal double damage.

Explain each trait with a single icon and five words or fewer.

The monsters are all **operators and symbols**. Digits are on the player's side (§6.6).

---

## 4. World structure: the Wings of the Sumgeon

The dungeon is a map of **Wings**, shown in the game as **strata**. Each Wing has its own floor palette, monsters and boss. **Mastery unlocks Wings, not grade.** The Wings form a chain going down. A Wing unlocks the next one when its boss is beaten **and** over 60% of its facts are mastered, the same bar as the *Legend Loading…* achievement (§14.2). A kindergartner who masters her facts climbs into multiplication. A 3rd grader can't skip ahead without mastering the facts below.
- **The grade is a starting point, not a ceiling.** When a player is created, their grade opens every Wing up to and including theirs, so a 3rd grader doesn't have to grind through kindergarten. It also sets their help defaults (read-aloud, hints, timer).
- **Lower Wings are always open,** so an older player can drop back for fast, easy practice (§6.7).
- **New content gets taught as it arrives.** The first time a kind of problem appears, the captain demonstrates it, and a new fact starts with its model shown (§5.3). That's what makes working ahead possible for a young player.
- **There is no manual unlock.** See §9 for why nothing needs a grown-up lock.

### 4.1 The grade strata (plan, 2026-11-25)
One stratum per grade, in a **straight chain**: each opens only the next. The levels inside each follow the school's teaching order. The audience stops at 5th grade, but one **stretch stratum** of 6th-grade math, Pirate Cove, sits under the Pyramid so a 5th grader who finishes it can keep going. Its content follows the school's 6th-grade guide; inequalities, plotting points, data and surface area are left out.

| Stratum | Grade | Levels (in order) | Monsters | Boss |
|---|---|---|---|---|
| **The Counting Cellar** (built) | K | Within 5, with zero (4 + 0, 4 − 4) → within 10 → make 10 (7 + □ = 10) and number bonds → teen numbers as 10 and some more (10 + 4, 14 − 4) | Plusquito (+), Minustaur (−), Trollar ($: find the coin, each coin's worth), Chompers in a K form (which is more, 7 or 4? type 7: comparing without symbols), a dot-flash monster (how many at a glance, up to 5) | **Make-Ten Golem** |
| **The Balance Hall** (built) | 1st | Within 20 without crossing 10 → crossing 10 (make a ten, use a ten, doubles) → missing numbers and the equal sign → ± tens (34 + 20, 10 more, 10 less) | Quizard (?), Chompers (< = >), Equal Twins (=, balancing and true or false), Doublet (doubles), a three-addend monster (4 + 3 + 6), Tick-Tockus (hours and half hours) | **The Unknown** |
| **The Crystal Caverns** (new) | 2nd | Two-digit ± within 100, adding and subtracting mixed → with regrouping → ± 10 and 100 within 1000 | Haberhasher (tens and ones), Trollar (counting coins with ¢ and $), Slimelipsis (skip counting by 2s, 5s and 10s), an array monster (up to 5 × 5 as 5 + 5 + 5), Tick-Tockus (to 5 minutes) | **The Centipede** |
| **The Tables Tower** (built) | 3rd | × and ÷ only: ×0, 1, 2, 5, 10 and their ÷ → ×3, 4, 6 and ÷ → ×7, 8, 9 and ÷ → × tens (4 × 30) → ×÷ 11 and 12, kept as an extra bottom level | Timesaur (×), Divvy (÷), Starbot (*), Tick-Tockus (to the minute) | **Sigma Rex** |
| **The Fraction Forge** | 4th | ×10, 100, 1000; 2-digit × 1-digit, then 2-digit × 2-digit (area model); factors (6 × □ = 48); remainders (29 ÷ 4 = 7 R1); equivalent fractions (3/4 = □/8); adding and subtracting like denominators; whole × fraction; decimals in tenths and hundredths; area and perimeter | Halfling (½), Quarterjack (¼), Dotty (.), Boomainder (R) | **The Denominator** |
| **The Parenthesis Pyramid** (new) | 5th | Unlike denominators (1/2 + 1/4 = □/4); a fraction of a number (1/2 of 12); dividing by a unit fraction (3 ÷ 1/2); powers of ten; decimals × and ÷ 10, 100, 1000; order of operations; volume (l × w × h) | Parenthesaurus (( ), order of operations), fraction and volume monsters (to design) | **Shoutandcomma** (!), the mummy in the deepest chamber |
| **Pirate Cove** (stretch) | 6th, for 5th graders who finish the Pyramid | GCF and LCM (GCF of 12 and 18; 12 + 20 = 4 × (3 + □)) and dividing fractions (3/4 ÷ 1/8) → ratios (2:3 = □:12) and unit rates (12 for $3, so □ for $1) → percent (25% of 80; 3/4 = □%) → opposites, absolute value and comparing negatives (\|−7\| = □; −3 ○ −8) → expressions and one-step equations (3x + 2 when x = 4; x + 7 = 15; 4x = 28) → area of triangles | Slashbuckler (/, GCF, LCM and dividing fractions), Colon-el Ratio (:, ratios and rates), % Gremlin (percent), Negasicle (−) and Absolutely (\|x\|) (negatives), an x monster for equations (to design, Quizard's grown-up cousin) | **Dread Pirate Radius** |

- **What changes from today:** the Tower becomes × and ÷ only (its sums within 20 belong to 1st and 2nd grade, so the "alongside" level in Apprentice goes away); Haberhasher moves to the Caverns; Quizard moves to the Hall, since hidden numbers are 1st grade; coin counting moves to the Caverns, and the Cellar keeps finding coins and their worth, which the K guide teaches.
- **Answers stay whole numbers where possible.** Most 4th- and 5th-grade problems hide a whole number in a box (3/4 = □/8), so the answer is still the damage, as with missing numbers. New pad keys appear only when a problem needs them: **R** for remainders, **.** for decimals, **−** for negatives (Pirate Cove), and the stacked fraction input (§7.1) for problems whose answer is a fraction. A fraction, decimal or percent answer hits for its value as a percent (§7.2).
- **Tick-Tockus** asks time the way Trollar asks coins: one monster whose problems follow the stratum's grade.
- **Saved progress:** a dungeon version bump starts runs over and keeps what's been learned.
- **Build order** (stacked PRs): (1) this plan; (2) restructure K–3 into grade strata with today's monsters (the levels in the school's order, zero facts, make-10 partners, ×0 and ×1, × tens, monsters moved), with a stand-in wall and boss for the Caverns; (3) the Crystal Caverns' wall, palette, the Centipede and voice lines; (4) the new K–3 monsters: Doublet, Slimelipsis, dot flash, three addends, arrays, Tick-Tockus; (5) the Fraction Forge; (6) the Parenthesis Pyramid.

### 4.2 Later strata (Master, 6th–8th)
Below Pirate Cove, unchanged from the first design (π Pirate, from Pirate Cove's first design, waits for circles in 7th grade):

| Wing | Strand | Monsters (glyph) | Boss |
|---|---|---|---|
| **The Negative Zone** | Integers and negatives | Negasicle (−, an icy minus-sign popsicle), Absolutely (\|x\|) | **Lord Undefined** (÷0) |
| **The Root Cellar** | Exponents and roots | Rootling (√), Squaresquatch (²), Exponent-tron (^) | **Hydra of Powers** (heads = exponent) |

**Endless Descent** (§6.4) has its own boss, the **Endless Specter** (∞).

A Wing's monster list is a **pool**, which can be bigger than one run's floors. Each run draws its floors from the pool, so replays meet different monsters. **Creature types can repeat across Wings** (there are two robots, two ghosts and a few pirates), but within a Wing no two regular monsters share a creature type, and repeats need clearly different silhouettes. Pirate Cove's pirates are the exception, because pirates are its theme.

Every Wing also has one **rescue floor** holding a cursed digit (§6.6). The prototype's operator monsters move into the Counting Cellar and the Tables Tower, and Sevenstein and Octoloop become cursed digits. New monster art follows the existing `solid()` / `line()` helper style: shapes only, no fonts inside the SVG, a dark outline, a fill and a sheen.

### Monster design notes for new glyphs
- **= Twins**: two bars that are siblings and finish each other's sentences. They pose missing-number problems (□ + 4 = 9).
- **Chompers (< >)**: a croc whose mouth opens toward the bigger number. This is the classic comparison mnemonic. Answering is a tap: <, = or >.
- **Rootling (√)**: a creature whose roots are its legs. It asks perfect-square roots.
- **% Gremlin**: two little circle-headed gremlins on a seesaw. It asks "10% of 50" and similar.
- **π Pirate**: one leg on each side of the π bar and an eyepatch. For Master it asks circle facts, and otherwise it does decimal arithmetic.
- **Halfling (½)**: its body is literally split in two. When hit, it shows the damage as a filling fraction bar.
- **Quizard (?)**: a question mark in a wizard hat, holding a wand. *Mystery*: the missing number moves around (3 + □ = 7).
- **Shoutandcomma (!)**: a mummy whose tall wrapped body is the !, with the dot as its feet. The name is a pun on Tutankhamun. The Parenthesis Pyramid's boss (5th grade): like every boss it mixes its stratum's problems, and its boss roars are the mummy rising from its tomb. *Unwrap*: at half HP its wrappings come off and its problems turn to big numbers, powers of ten and place value (10³ = □; how many zeros in 10⁵).
- **Slimelipsis (…)**: three little slimes in a row, in the Crystal Caverns (2nd grade). *What comes next*: skip counting by 2s, 5s and 10s (2, 4, 6, □; 15, 20, □).
- **Doublet (+ + twins)**: two plus signs who do everything together, in the Balance Hall. *Doubles*: doubles facts and doubles to subtract (8 + 8, 16 − 8).
- **Tick-Tockus**: a clock monster whose hands are its arms. *Tell the time*: hours and half hours in the Hall, 5 minutes in the Caverns, the minute in the Tower; the answer is the minutes or the hour, typed.
- **The Centipede**: the Crystal Caverns' boss. Centi- means a hundred: its legs come in tens, for counting by tens and hundreds, and it nods to cents.
- **Parenthesaurus (( ))**: a dinosaur whose ribs are brackets, a regular monster in the Parenthesis Pyramid. *Order of operations*: 3 + 4 × 2, and (3 + 4) × 2.
- **Trollar ($)**: a bridge troll with a $ on his belly who wants coins to let you pass. *Pocket change*: follows the stratum: find each coin and know its worth in the Cellar (K, as the K guide teaches), then count collections with ¢ and $ in the Crystal Caverns (2nd grade).
- **Starbot (*)**: a robot with a star-burst head, since * is how computers write ×. *Stripes*: favors the ×5 and ×10 tables.
- **Boomainder (R)**: a ghost who haunts the leftovers. Division with remainders (17 ÷ 5 = 3 R2), which leads into mixed numbers (3⅖).
- **Slashbuckler (/)**: a swashbuckler whose sword is the slash. Writes division as 24 / 6, so kids learn the other notation.
- **Exponent-tron (^)**: a robot whose antenna is the caret. Exponents.
- **Colon-el Ratio (:)**: an officer whose medals are the colon. Ratios (2:3).
- **Endless Specter (∞)**: a looping ghost that only appears in Endless Descent. Its body traces ∞, so it looks nothing like Boomainder.

---

## 5. The learning engine (how the game teaches)

This is the most important invisible system. Today problems are random. They should become **deliberately chosen**.

### 5.1 Fact mastery tracking
- Each fact (e.g. `7×8`, `13−5`, `¾+¼`) has a record: `{seen, correct, lastSeen, avgMs, box}`.
- `box` is a Leitner box from 0 to 4. A correct answer moves the fact up one box, and a miss sends it back to box 0. Answers that are correct and fast (under the band's fluency threshold) move it up faster.
- A fact counts as **mastered** at box 4 with an average time under the threshold (≈ 3 s for Sprout and Apprentice facts).

### 5.2 Problem selection
For each problem slot, choose:
- **~60% learning facts** (boxes 0–2), weighted toward box 0 and the longest-unseen,
- **~25% review facts** (box 3–4, spaced by time since `lastSeen`),
- **~15% fresh facts** never seen in this band.

The monster's preferred operation still applies (the 70% rule from the prototype), but selection happens *within* that operation's fact pool.

### 5.3 Teaching with hints (help that fades)
The game should **teach first, then fade the help out** as a fact gets learned, instead of waiting for misses. Hints follow **how math is taught now**: the **Missouri Learning Standards** (2016 K–5 grade-level expectations) and the models and words local K–5 curricula use. Missouri names *what* to learn, not *which method*. Its grades 4–5 say "justify the solution" and never require a standard algorithm, so hints show the strategy models, which classroom curricula use.

**Help follows the fact's Leitner box (§5.1):**
| Fact state | What the player sees |
|---|---|
| **New** (never seen) | A **"show me" model appears automatically** beside the problem, such as 3 + 4 as dots on a ten-frame. She counts, then types. |
| **Learning** (box 1–2) | A **💡 hint button**. The model appears only when tapped. |
| **Review** (box 3–4) | No button. A hint comes back only after a miss. |
| **After any miss** | A **worked example** instead of just the answer, animated and read aloud. 8 + 5 → 8 + 2 = 10, then 10 + 3 = 13. The fact then goes into the **retry queue** and returns 2–4 problems later. |

**First time a new *kind* of problem appears** (Quizard's □, Trollar's coins), the player's captain shows one example. It takes about 10 seconds, is read aloud, can be skipped, and is shown once per player.

**Hints never punish:** no heart lost, full damage, and the timer pauses while a hint is open. A hinted solve doesn't build the crit streak and doesn't move the fact up a box, so mastery needs solves without help. Grown-ups can set hints to automatic, on tap, or off.

**Hints teach a strategy and never just show the answer** (the same rule as Sound Box: scaffolds help the player work it out). Strategies by problem type:

| Problem type | Hint model and words | Missouri GLE |
|---|---|---|
| How many? (dot flash) | Dot patterns as on dice, dominoes and five-frames | K.NS.B.8 |
| Compare | Two dot sets side by side, then two numerals on a number line: "more," "less," "same as" | K.NS.C |
| Add within 10 | Ten-frame or **number bond**. Words: "put together," "in all" | K.RA.A.1–2 |
| Subtract within 10 | **Draw and cross out**, or count back on a number line. Words: "take away," "how many are left?" | K.RA.A.1–2 |
| Make 10 | Ten-frame with the empty spaces glowing | K.RA.A.4 |
| Teen numbers | "10 and some more": a full ten-frame plus extras, 10 + 4 = 14 | K.NBT.A |
| Add within 20 | **Make 10**: 8 + 5 → 8 + 2 + 3. **Doubles plus one**: 6 + 7 = 6 + 6 + 1 | 1.RA.B.1 (properties as strategies) |
| Subtract within 20 | By the numbers: **10 and some more** when the ones are enough (15 − 3: 15 is 10 and 5, 5 − 3 = 2); **count back through 10** when taking a little crosses ten (13 − 4: back 3 to 10, then 1 more); **doubles** for a double (16 − 8: 8 + 8 = 16); **think addition** when the numbers are close: 12 − 8 → "8 + ? = 12", counting up on a number line | 1.RA.B.2 (unknown addend) |
| Missing number | A number bond or balance with the □ glowing | 1.RA.A.4 |
| Count by 1s and 10s, then 5s, then 2s | Hops on a number line or hundred chart | K.NS.A.1, 1.NS.A.4, 2.RA.B.1 |
| Coins | Find a coin in a mixed pile, heads and tails ("How many quarters?"); one coin, "How many cents?", with the guide's words ("A dime is small and silver"); then coin pictures with their values ("A nickel is worth five cents"), then counted biggest first | K.GM.B.5 (names), 1.GM.C.9 (values), 2.GM.D.12 (combinations with $ and ¢) |
| Add/subtract within 100 | Open number line with jumps of 10s and 1s, and "10 more, 10 less" | 1.NBT.B, 2.NBT.B |
| Multiply | **Arrays** (rows of dots), **turn-around facts** (6 × 4 = 4 × 6), × 2 as a double (8 + 8), × 10 as tens (7 tens is 70), × 11 and × 12 broken apart at 10 (12 × 6 = 60 + 12), **doubling**: × 4 is double × 2 and × 8 is double × 4 (8 × 7 = 28 + 28), **break apart**: 6 × 7 = 6 × 5 + 6 × 2. For ×9, use 9 × 7 = 70 − 7 (not the finger trick) | 2.RA.B.2 (arrays), 3.RA.B.1, 3.RA.C.1 |
| Divide | **Think multiplication**: 32 ÷ 8 → "8 × ? = 32" | 3.RA.A.5, 3.RA.C.1 |
| Multi-digit × and ÷ | **Area model** (23 × 4 as 20 × 4 + 3 × 4) and partial quotients | 4.NBT.A.6–7 |
| Fractions | Fraction bars, pies and number lines | 3.NF, 4.NF |

**"How the hints work" page for grown-ups** (⚙ Settings): how the game teaches, then each strategy with a sample problem, the game's drawing, and one plain line on why it works ("Make 10: kids split the 5 into 2 + 3 so 8 becomes an easy 10"), so a parent who learned the old way can follow along and use the same words. Multi-digit strategies (the area model, plus the familiar standard algorithm) join it with the Adept band. The notes used to sit on every hint; they moved to this page so the kids see only the drawing and its words.

**Match the classroom's words.** Hint copy uses the words in the standards and local curriculum guides ("number bond," "ten-frame," "10 and some more"), not invented ones. Check the guides for each grade when building that band.

### 5.4 Adaptive difficulty (within a band)
- Keep a rolling accuracy over the last 10 problems. Above 90% with fast answers, raise the number range one step. Below 60%, lower it a step and turn hints on sooner.
- Moving up is earned through the Wing chain (§4), so there's no separate band jump. When a new Wing unlocks, the game celebrates it: "You unlocked the Tables Tower!"

### 5.5 Monster HP stays fair
The prototype rule, HP = mean answer × `hits`, still holds. Compute it from the **actual selected problem pool** rather than uniform random, so adaptive selection doesn't produce bullet-sponge or one-shot monsters.

---

## 6. Progression and replay

### 6.1 Per-floor stars
Each floor awards up to 3 stars:
- ★ cleared it
- ★ no hearts lost on this floor
- ★ all fast: every answer right, quick and without a hint (changed 2026-11-25 from a streak of 5, which short floors couldn't reach)

Stars unlock cosmetics, so they give replay goals without grinding. Wings unlock through mastery (§4).

### 6.2 The Bestiary
- Every monster you defeat goes into the **Bestiary**, a chalkboard page per monster with its art, name, a joke and its trait.
- Each entry has a **mastery ring** built from the fact records for that monster's operation. The ring fills as you master its facts. Filling the ring gives the monster a **gold outline** variant to show off.
- Undiscovered monsters appear as chalk silhouettes. Curiosity is the hook.
- Rescued heroes have their own page beside it (§6.6).

### 6.3 Between-floor choices
After each floor, pick **one of two** rewards:
- ♥ Heal 1 heart
- 🧪 **Potion** (heal 2, used anytime)
- 🛡️ **Shield** (blocks the next miss)
- 💡 **Hint scroll** (shows a hint on any problem, no streak penalty)
- ⏭️ **Skip stone** (swap the current problem; the fact goes to the retry queue, so it isn't dodged forever)

Inventory holds 3 items. This adds a small strategic layer without making math optional, because every item helps you *get to* math and none replaces it.

### 6.4 Endless Descent
- Unlocked after you clear any Wing once.
- Monsters cycle through every unlocked Wing with HP scaling about +8% per floor. A boss appears every 7th floor.
- The score is **total damage dealt**, so harder problems are worth more. It's shown alongside the deepest floor.
- Keep a local high score table per band, with optional initials (no names required).

### 6.5 Daily Dungeon
- A seeded run that is the same for everyone on the same date: 5 floors, fixed monsters, fixed modifiers such as "Timer on" or "Crits from streak 2".
- One attempt per day for score and unlimited practice tries. It works offline because the seed is just the date.

### 6.6 Digit heroes (the player's side)
**The fiction:** the operators, led by Sigma Rex, have **cursed the digits 0–9**. Sevenstein and Octoloop were never true monsters. They are cursed digits, which is why they are the only numbers on a roster that is otherwise symbols. A curse can twist a digit into a different creature: **Octoloop is Chef Eight under a curse**, and breaking it turns the tentacled loop back into the chef. Sevenstein stays Sevenstein, just friendly. Beating a cursed digit **breaks the curse**, and it **joins your party**.

**The cast:** each hero is a digit plus a hero class plus a pun, mirroring how the monsters are named. They're drawn with the same `line()` / `solid()` chalk style.

| Digit | Hero | Class / look | Their move when summoned |
|---|---|---|---|
| 0 | **Zeroic** | Round superhero with a cape (zero + heroic) | Flies in fist-first |
| 1 | **Onesie** | Superhero in footie pajamas | Pillow bonk |
| 2 | **Twodini** | Magician; the 2's curl is the cape swirl | The damage number pops out of a top hat |
| 3 | **Threasure Hunter** | Explorer with a map and a lantern | Lantern flash |
| 4 | **Sir Fourtress** | Knight; the 4's corner is the shield | Shield bash |
| 5 | **High Five** | Sporty hero | A giant high five |
| 6 | **Sixlock Holmes** | Detective with a magnifying glass | Spots the weak point, so the hit shows a 🔍 |
| 7 | **Sevenstein** | Gentle giant, bolts and all, now friendly | Big stomp |
| 8 | **Chef Eight** | Chef in a tall hat; the 8's loops are a stacked belly and head. The pun: eight sounds like "ate." | Serves the damage on a sizzling platter |
| 9 | **Nine-ja** | Ninja | Vanishes, then strikes from behind |

**Your captain is your avatar.** When a player is set up, they pick a **starter** digit and a **chalk color**. The starter is free from the start, and the other nine are waiting to be rescued. Losing all your hearts curses the hero who led the run: they leave the team until rescued again, and you pick someone else on the team to lead, or any of the ten if nobody is left. The captain appears in "Playing as…", in the player list and in the arena, replacing the generic Apprentice character from the earlier draft. You can switch captains to any rescued hero at any time. Two siblings can both pick High Five, and their chalk colors tell them apart.

**The mechanic: your answer summons its digits.** On a correct answer, the digits of the answer burst out of the answer box and attack together. 56 sends the 5 and the 6, and 55 sends two High Fives, who high-five each other first.
- **Rescued digits** appear as their hero and add **+10% damage each** (up to +30%), with their own move.
- **Digits not yet rescued** fly as plain chalk numerals. Seeing a bare "3" fly every time is the pull to go rescue Threasure Hunter.
- **Captain's digit in the answer means a power hit (+50%)**, with a bigger animation. This stacks with crits. It's luck, not strategy, but it gets kids noticing the digits inside a number.
- Party bonuses make a player stronger as they rescue more. That is intended progress, and the cap keeps it modest. Monster HP (§5.5) does not scale with the party.
- **Later, for Master:** the heroes stand in ones, tens and hundreds spots as they attack, which makes place value visible.

**Rescue floors.** Every Wing run has one **rescue floor** in the middle (floor 3 of a 5–7 floor Wing). It holds the **next digit not yet rescued**, lowest first and skipping the captain. So every Wing clear rescues one hero, a Sprout player can rescue all nine in the Counting Cellar alone, and replaying a Wing is never wasted.
- A cursed digit is drawn as its hero in a dark, glitchy "cursed" palette, and it asks mixed problems like the prototype's `mix` monsters.
- **Cursed trait (Lucky Number):** answers containing that digit do double damage. This generalizes the old Sevenstein "Lucky 7" trait.
- When it's beaten, the curse cracks off in chalk shards. The hero says its line ("High Five is on your team!") and joins.
- Once all ten are free, the rescue floor becomes a normal monster floor for that Wing.

**Heroes page:** a page beside the Bestiary, with each hero's art, name, move and the date rescued. Unrescued heroes appear as cursed silhouettes.

**Cosmetics** (unlocked with stars and achievements, looks only and never stats): hats, capes, chalk trails and arena chalk colors for your captain.

### 6.7 Speed (fluency) for every player
Fast recall is the goal of fact practice, so speed counts **whether or not the timer is on**:
- Each fact's average answer time is already tracked, and "mastered" requires it to be fast (§5.1). An older player in a lower Wing turns easy facts into a fluency workout.
- **Speed medals per floor** (🥉🥈🥇) by clear time, and a **personal-best time per Wing**, shown on the floor-clear card. Medals scale to the problem mix, so a Sprout floor and a Tables floor are judged fairly.
- **A speed bonus with the timer on** (§3). Each player can turn their own timer on.
- **A ⚡ Lightning track** in achievements (§14.4).
- **Never sibling against sibling.** Every score, medal and best time is per player. Nothing ever shows one player's numbers beside another's, not even in the player list. A shared device must never turn into a race between a 3rd grader and a kindergartner.

### 6.8 Achievements, players and linking
Achievements are in §14. Profiles ("remember players") and linking devices are in §15. Both copy sound-box-crosswords.

---

## 7. Math content and answer input

New content changes what an "answer" looks like, so input and the damage rule need explicit design.

### 7.1 Input methods by problem type
| Problem type | Input | Notes |
|---|---|---|
| Whole numbers | Number pad (current) | Raise the 4-digit cap to 5 for Adept and above |
| Negatives | Number pad with a **±** key | ± toggles the sign anywhere during entry |
| Decimals | Number pad with a **.** key | One decimal point; answers compared with tolerance |
| Fractions | A **stacked fraction input** with numerator and denominator slots, plus a "/" key that jumps between them | Accept any equivalent fraction, then show it simplified |
| Comparison (< = >) | **Three big buttons** | Used by Chompers |
| Missing number (□) | Number pad, with the □ in the problem glowing | |

On a keyboard, `-`, `.` and `/` map to these keys.

### 7.2 Damage rule for non-whole answers
"Damage = answer" needs a rule once answers can be −6 or ¾:
- **Negatives:** damage is the **absolute value**. Fiction: Negative Zone monsters are made of "debt," and a negative answer pays it off. The hit animation shows the number flipping sign as it lands.
- **Fractions, decimals and percents** (plan, 2026-11-25): the answer is a **multiplier**. It hits for its value × 100, its percent: ¾ hits for 75, 0.3 for 30, 25% for 25, 1½ for 150. The hit shows the change ("¾ → 75!"), so every hit practices fraction = decimal = percent. Monster HP is built the same way (from the average answer, × 100), so fights last as many problems as any other. Any equivalent fraction counts (6/8 hits like ¾). This replaces the earlier plan of HP drawn in whole segments.
- **Comparisons:** each correct comparison deals a fixed "chomp" of 1 segment, and the monster has segment HP.
- **Big answers** (e.g. 144): unchanged, because the monster HP rule already scales to the problem pool.

### 7.3 Problem generators
Each problem type becomes a generator module, `{id, band, gen(level) → {q, a, hint, factKey}}`. Each generator owns:
- its own number ranges per level,
- a canonical `factKey` for mastery tracking (`7×8` and `8×7` share one key for tables but stay separate for subtraction),
- a hint renderer (dot array, number line, pie).

---

## 8. Game feel

Hitting a monster should feel good. Today there is a shake and a damage pop. The direction:

### 8.1 Attack animation
1. On submit, the typed number **lifts out of the answer box** as chalk digits.
2. It **arcs across to the monster** in about 250 ms, leaving a chalk-dust trail.
3. On impact the monster flinches (current `hit` anim), the HP bar drains, and chalk particles burst.
4. On a crit, add a brief **screen shake**, coral-colored digits and a bigger burst.
5. On a miss, the **monster attacks back** with a trait-flavored lunge (Timesaur spins, Minustaur charges), and a heart cracks and drops off.

### 8.2 Sound effects
- Sound effects are **synthesized with Web Audio**, with no audio files, like Sound Box's `chime.js` and `sfx.js`. Spoken words are recorded clips (§13).
- The palette: a soft chalk *tick* for key presses, a rising blip for correct (pitch rises with the streak), a thud plus crunch for crits, a low wobble on a miss, a jingle on a floor clear and a short melody when a boss falls.
- **Mute** by default if the OS reports reduced motion or the page is embedded. There is always a visible speaker toggle.
- **Voice:** see §13. Spoken words use recorded clips, with the device voice as a fallback.

### 8.3 Juice checklist
- Streak meter: a chalk flame next to the hearts that grows at 3, 5 and 10.
- Boss intro: the floor darkens, the boss name slams in, and there's a one-line taunt.
- Monster idle personality: each monster gets a slightly different idle motion. Octoloop sways, Timesaur rotates a few degrees and Divvy's dots orbit.
- Haptics: `navigator.vibrate(15)` on hits and `(40)` on misses where supported, and respect a settings toggle.
- `prefers-reduced-motion` keeps working: no shake, projectiles replaced by fades, no particles.

---

## 9. Grown-ups' corner (parents and teachers)

**No lock, because nothing needs one.** Any gate a kid can't pass, a strong 3rd grader can: a "hard math problem" gate is a puzzle in a math game, and a hold-to-open button is a dare. So, as in Sound Box, **nothing in settings can make progress easier or skip mastery**, and then there's nothing worth guarding:
- **Wings** unlock only through mastery (§4). There's no manual unlock to abuse.
- **Grade/band** only sets the starting Wings and help defaults. Faking a higher grade on a new player just means harder math.
- **Hints, read-aloud and the timer** are comfort settings. Hinted solves never count toward mastery (§5.3), so turning hints on is no shortcut.
- **Custom practice**, e.g. "only the 6, 7 and 8 times tables", runs as a separate Practice run outside the Wings. It builds fact mastery like any other play but never unlocks a Wing.
- **Destructive actions only ever touch this device.** Start over asks for a typed phrase (§15.5). Removing a player asks for a second tap, and the **Remove button only exists on a device with two or more players**, never for the one playing. A kid's own device, with only them on it, has no delete at all. A shared device (a parent's phone) holds players linked from the kids' devices, so if a sibling removes the other there, their own device still has them and can send them back (§15.2).

The corner holds:
- **Custom practice** (above).
- **Progress view** for each profile: a heat-map grid of facts (e.g. a 12×12 times table colored by mastery box), the most-missed facts, and time played this week.
- **Session length nudge**: optional "take a break" after N minutes, phrased kindly.
- **Export progress** as a downloaded JSON or a printable page, so data stays local unless they choose to share it.
- No leaderboards against other people and no social features.

---

## 10. Accessibility

- All monsters keep `role="img"` and `aria-label`. Problems and results stay in `aria-live` regions.
- Full keyboard play, as today, extended to the new input keys.
- Color is never the only signal. Crits use text and size as well as coral. Mastery rings use fill amount as well as color.
- Text sizes respect user zoom, with a dyslexia-friendly toggle that switches the body font and adds letter spacing.
- Timer is always optional, and timer length is adjustable in the grown-ups' corner.

---

## 11. Technical direction

- **No build step stays a goal.** When `index.html` passes about 600 lines or the second Wing arrives, split it into native ES modules loaded with `<script type="module">`:
  - `monsters/` with one file per Wing exporting monster data and SVG draw functions,
  - `problems/` for generators, fact keys and hints,
  - `learn.js` for mastery records, the selection algorithm and adaptation,
  - `game.js` for the run loop, floors, items and scoring,
  - `ui/` for arena, pad, overlays and bestiary,
  - `sfx.js` for the Web Audio synth, and `speech.js` for recorded clips with the device-voice fallback (§13),
  - `achievements.js` with no DOM (§14),
  - `store.js` for player prefixes and storage upgrades, plus `seal.js`, `merge.js` and `sync.js` for linking (§15).
- **What "no build step" means:** it applies to the code, as in Sound Box, where browser ES modules run as-is. Deploy-time steps are fine: stamping `?v=` cache-busters, recording audio and writing manifests.
- **Checks** (`npm run check`, as in Sound Box): Node tests for the pure modules (generators, learning engine, merge, seal, sync), a check that `spokenLines` matches `catalog`, and a check that every saved key is listed.
- **Data-driven monsters:** monster entries gain `wing`, `trait`, `joke` and `band` fields. The draw function stays as-is.
- **Seeded RNG** (e.g. mulberry32) replaces `Math.random` wherever reproducibility matters: Daily Dungeon, tests and bug reports.
- **Hosting:** GitHub Pages at `tools.tuley.name/sumgeon/` (§16), so every path is relative to that subfolder: the manifest's `start_url` and `scope`, the service worker's scope, and `#link=` links.
- **PWA:** add a manifest and a small service worker so the game installs to a tablet home screen and runs fully offline. Self-host the two fonts at that point.

---

## 12. Milestones

Each milestone should be playable and shippable on its own.

1. **M1 — Feel and foundations** ✅ (2026-11-23). Recorded clips: whole clips for every line in `js/lines.js` (about 1,290), on the `sumgeon-audio` Pages project.
   Split into modules, the storage upgrade plus players (§15.1), Web Audio sound effects, the Start button, `say()` with recorded clips for UI phrases and monster names (§13), the projectile attack animation, monster counterattack on a miss, and a streak flame.
2. **M2 — Learning engine** ✅ (2026-11-23). Sprout and Apprentice bands with mastery-opened levels (in place of a rolling-accuracy range), fact records, Leitner selection, the retry queue, fading hints with the classroom models, and "For grown-ups" notes. Adept and Master wait for the new answer keys (M5).
   Fact records, Leitner selection, the retry queue, hints after repeated misses, adaptive range within a band, and content bands replacing raw Easy/Medium/Hard.
3. **M3 — Wings and the Bestiary** ✅ (2026-11-24). The digit heroes (captain, summon attack, power hit, rescue floors with Lucky Number), the Counting Cellar and Tables Tower with mastery opening the Tower, the Make-Ten Golem and Starbot, monster traits, per-floor stars, and the Monsters & Heroes pages with mastery rings. The new Counting Cellar monsters (Quizard, Shoutandcomma, Slimelipsis, Trollar) need new problem types and come later.
   Split the operator monsters into the Counting Cellar and the Tables Tower, add the digit heroes (captain pick, summon attack, rescue floors, Heroes page; §6.6), the Wing map, per-floor stars, the Bestiary with mastery rings, and monster traits.
3½. **M3½ — Grade strata** (next; §4.1)
   One stratum per grade, K–3 first: restructure with today's monsters, the Crystal Caverns, then the new K–3 monsters and Tick-Tockus. The Fraction Forge and the Parenthesis Pyramid follow in M5.
4. **M4 — Replay**
   Achievements with spoken cards, the 🏆 sheet and share cards (§14), between-floor item choices, Endless Descent, Daily Dungeon, and captain cosmetics.
5. **M5 — New math**
   Extended input (±, ., fractions, comparisons), the Fraction Forge and Balance Hall, then the Negative Zone, Root Cellar and Pirate Cove.
6. **M6 — Grown-ups' corner and PWA**
   Progress heat-maps, custom practice, export, offline install with saved voice clips, device linking and sync (§15.2–15.4), and the listen check.

---

## 13. Voice: recorded speech

_Copies the voice system in sound-box-crosswords (`js/speech.js`, `scripts/audio/`, its `CLAUDE.md` "Recorded audio" notes)._

A pre-reader can't use a menu she can't hear, and the device voice is hit and miss: it sounds robotic and differs on every iPad. Every fixed line the game says is therefore **recorded ahead of time**, and the device voice is only a fallback.

### 13.1 How it works
- **Kokoro** (open-source neural TTS, voice `af_heart`) records every fixed line **at deploy time**, using the same scripts and approach as Sound Box: `build.mjs`, `generate.py`, `kokoro_core.py` and `lively.py`, running in a Linux container.
- Clips are hosted on Cloudflare Pages next to Sound Box's audio, on a `sumgeon-audio` project. The site ships an **`audio.json`** manifest that maps `"kind:text"` to a clip.
- Clip names hash model + voice + speed + method + text, so only new or changed lines are recorded.
- A single **`say(kind, text)`** plays the recorded clip, or falls back to the device voice when there's no clip, the device is offline before the clip was saved, or during local dev. The device voice is ranked the same way Sound Box does it: Premium > Enhanced > basic, en-US, no novelty voices.
- **iOS only plays sound after a tap**, so a launch shows one big **Start / Continue** button, like Sound Box's. That tap also unlocks the Web Audio context for sound effects.
- The service worker saves a band's clips in the background after launch (`saveGently`), so offline play keeps the recorded voice.
- A **listen check** page (`/listen/`, a grown-up tool, `noindex`, not linked from the game) plays every clip with ✓/✗ marks, so mispronunciations get caught by ear instead of guessed.

### 13.2 Kinds of speech
| Kind | What | Examples | Voice |
|---|---|---|---|
| `p` phrase | UI and instructions | "Tap to start.", "Pick your problems.", "Floor three!", "You found a heart!" | `af_heart`, livelier (`lift`) |
| `n` number | Numbers 0–999 and damage callouts | "Fifty-six!" on a hit | `af_heart` |
| `q` problem | A whole problem read aloud, one clip per fact | "Seven plus eight." | `af_heart`, steady |
| `m` monster / hero | Monster names, boss intros, taunts and quips; hero names and rescue lines ("High Five is on your team!") | "Sigma Rex!", Timesaur: "I multiply. You divide." | a second voice for monsters, as Sound Box uses Bella for quips; the boss gets a third |
| `a` achievement | Achievement card lines | "New achievement!", "Wing Champion!", "Counting Cellar." | `af_heart`, excited |

- **Decided by a listen test (2026-11-23): whole clips, not stitched.** Stitched numbers (cut from real sentences, joined) sounded choppy in 7 of 10 lines even after a fix, while every whole clip passed.
- **Problems are recorded per fact, not stitched from parts.** Stitching "seven" + "plus" + "eight" sounds choppy. The fact set is finite: about 800 for Sprout and Apprentice (± within 20, ×÷ to 12×12) and a few thousand by Master. Anything outside the recorded set uses the device voice.
- Following Sound Box's lesson that **Kokoro misreads short text said alone**, numbers and short words are said at the end of a carrier phrase and cut out (`generate.py`'s method).
- Number words go through one function (`spoken(n)`: 56 → "fifty-six", −3 → "negative three", ¾ → "three quarters") that the audio build and the app share, so the text keys always match.

### 13.3 When it speaks
- **Sprout:** instructions, menus, monster names, floor announcements and achievement cards are spoken automatically, and every button with words has a 🔊. Problems are spoken only when 🔊 is tapped, because she reads numbers.
- **Other bands:** instructions are off by default. Monster lines and achievement cards are on, and problems are on tap.
- **Settings** (grown-ups' corner, as in Sound Box's More sheet): read instructions aloud, read problems aloud automatically, monster voices, and sound effects. Each is a separate switch.
- **Monster quips** follow Sound Box's quip rules: at most one per floor, a chance roll, cheer the player on or be silly, never aimed at the player, not babyish. Each line is checked by ear before it's added.
- Speech never overlaps: one queue (`say` cancels or waits), and the next problem waits for a quip to end.

---

## 14. Achievements

_Copies sound-box-crosswords `js/achievements.js`: worked out from saved progress, never taken away, tiered picture stories, secrets shown as ???, a big spoken card, and a share card._

### 14.1 Rules (same as Sound Box)
- **Computed from progress** (`catalog(state)` with no DOM), and `award()` records newly met ones as `{id: time}`. Earned achievements are **never taken away**. There are **no daily streaks** to lose. The in-run 3-in-a-row crit is a combat mechanic, not an achievement.
- **Tiered tracks show only the next tier.** Each track is a **little picture story** whose emoji grows tier by tier, so a pre-reader sees progress before reading the name. The detail line says plainly what it took, for grown-ups.
- **The big card:** after the floor-clear moment, each new achievement gets its own card with the `sparkle()` chime, then **spoken lines**: "New achievement!", then its title, then its detail. `spokenLines()` lists every line so the audio build records them all, and a check keeps it in step with `catalog`.
- **🏆 sheet:** earned, next goals, and secrets as ??? with no hint. Secrets that count up show "12 of 50" once started.
- **Secrets earned outside a fight** (opening the Bestiary, sharing) wait behind a 🕵️ pill instead of interrupting.
- **Share card:** a PNG of the achievement (app name, emoji, title, detail, date, the monsters involved), shared from the card. It never includes the player's name.
- Achievements unlock **cosmetics only**: captain hats, capes, chalk trails and arena chalk colors (like Sound Box's palettes). They never unlock power.

### 14.2 Per Wing (like Sound Box's per-pack Champion / Legend)
| Achievement | Icon | Earned by |
|---|---|---|
| *Counting Cellar* **Champion** | 🏆 | Beat the Wing's boss |
| *Counting Cellar* **Legend Loading…** | ⏳ | Over 60% of the Wing's facts mastered |
| *Counting Cellar* **Legend** | 🌟 | Every fact in the Wing mastered |
| **Champion of Champions** / **Legend of Legends** | 👑 / 🌠 | Every Wing in the band |

Spoken parts are shared, as in Sound Box ("Champion!", the Wing's name, "Beat the boss of this wing"), so a new Wing only needs its name recorded.

### 14.3 Fact mastery (fits the learning engine)
- **Table Master ×N** 🧮: every ×N fact (N×1 to N×12) mastered. There's one per table, shown in the order the band teaches them.
- **Make-Ten Master** 🔟 (Sprout): every pair that makes ten, mastered.
- **Doubles Master** 👯 (Sprout): doubles to 10 + 10, mastered.

### 14.4 Tiered tracks (each a picture story)
| Track | Tiers | Story |
|---|---|---|
| Practice days (1, 3, 7, 14, 30, 60, 100) | 🕯️ First Torch → 🗝️ Key Finder → 🚪 Door Opener → 🪜 Deeper Down → 🏰 Castle Keeper → 🐉 Dragon's Den → 👑 Dungeon Royalty | Going deeper into the dungeon |
| Flawless floors, no hearts lost (1, 5, 10, 25, 50, 100) | 🪵 Wooden Shield → 🛡️ Iron Shield → ✨ Shining Shield → 💎 Crystal Shield → 🌟 Starlight Shield → 🌈 Unbreakable | A shield that gets stronger |
| Comebacks, a missed fact later right first try (1, 5, 10, 25, 50) | 🌧️ Through the Rain → 🌦️ Clearing Up → 🌈 Rainbow After → ☀️ Sunny Side → 🦅 Soaring | Weather clearing |
| Lightning solves, a correct answer in under 3 s (25, 100, 250, 500, 1000) | 🔋 Charged Up → ⚡ Quick Spark → 🌩️ Thunderclap → 🌪️ Whirlwind → ☄️ Lightning Legend | Speed for any player, any Wing (§6.7) |
| Total damage (1k, 5k, 25k, 100k, 500k) | 💨 Chalk Dust → 🌪️ Chalk Storm → ⚡ Chalk Lightning → ☄️ Chalk Comet → 🌋 Chalkcano | Bigger chalk power |
| Monsters met, the Bestiary (5, 10, 20, all) | 📓 Field Notes → 🔍 Monster Spotter → 🗺️ Explorer → 📚 Monsterologist | A growing notebook |
| Heroes rescued (1, 3, 6, 9) | 🔓 Curse Breaker → 🤝 Team-Up → 🎪 Big Band → 🎉 Full House | A party that fills up; Full House means all ten digits are free |

### 14.5 Secrets (??? until earned, card says "Secret achievement!")
- 🎯 **Exactly Zero**: the finishing hit leaves the monster at exactly 0 HP.
- 7️⃣ **Lucky Seven**: break Sevenstein's curse with an answer containing a 7.
- 🦸 **Captain's Call**: three power hits (your captain's digit) in one floor.
- 🎆 **All Hands**: an answer of three or more digits where every digit is a rescued hero.
- 🪞🖐️ **Double High Five**: summon two of the same hero at once, like 55.
- 💯 **Triple Digits**: a single hit of 100 or more.
- 🪞 **Palindrome**: an answer that reads the same backward, like 121.
- 🧊 **Ice Cold Boss**: beat a boss without losing a heart.
- ♻️ **Never Gave Up**: win a floor while on your last heart.
- 📅 **Weekend Warrior**: cleared a floor on a weekend.
- 🦃 **Gobble Gobble** / ⛄ **Snow Much Fun** / 🏖️ **Summer Sums**: holiday play, reusing Sound Box's `holidaysOn` dates.
- 📣 **Show-Off**: shared an achievement.
- 👀 **Monster Watcher**: opened the Bestiary.
- 🎨 **New Look**: changed your captain's look.

---

## 15. Players and linking

_Copies sound-box-crosswords profiles (`profilePrefix`, `OWN_KEYS`, `GRADE_KEYS`, Add a player) and linking (`seal.js`, `merge.js`, `sync.js`, `linkqr.js`, `scan.js`, the `sync/` Worker)._

### 15.1 Remembering players
- **Storage layout as in Sound Box:** `sumgeon:` holds what belongs to the device (the `profiles` list of ids and names, the `profile` currently playing, the device id and the storage version). Each player's data lives under `sumgeon:@<id>:`, with per-band keys inside it (fact records, Wing progress, stars, achievements, Bestiary, counts, days, settings).
- **Every device starts with one profile, `default`.** "Add a player" makes a new, empty profile, which asks the band question. The first time, the default player also gets a name.
- **Names belong to the device and never sync.** An empty name shows as "Default".
- A quiet line under the title, "Playing as Sam", appears once there are two or more players and opens the player picker. Each player's avatar is their **captain** in their **chalk color** (§6.6), which helps a pre-reader find herself in the list. Unlike the name, the captain and color **do sync**: they aren't identifying, and Receive's "Who is this?" shows the incoming player's captain so the grown-up can tell who it is.
- On a device with two or more players, any player except the one playing can be removed, with a second tap to confirm ("Remove from this device?"). As in Sound Box (`renderProfiles` / `removeProfile`), that wipes everything under their prefix **on this device only**. Other devices holding the player keep them and keep syncing, so a removed player comes back with Receive from any linked device.
- **Storage upgrade:** version 2 moves the prototype's `sumgeon` key (`{ops,diff,timer,best}`) into `sumgeon:@default:`, one key at a time, so an interrupted move finishes at the next launch.
- Every key saved per player or per band has to be listed (`OWN_KEYS` / `BAND_KEYS`), and a check fails on one that isn't, so sync and Start over can't miss it.

### 15.2 Linking devices
Same flow and words as Sound Box's More → Players, one task at a time:
- **Send ("Play on another device too")** shows the player's link, the site's address plus `#link=<key>`, as Sound Box's styled QR code with a copy button. Sumgeon draws it with its own colors and a monster in the middle.
- **Receive ("Get a player from another device")** scans with the camera (jsQR) or takes a pasted link. It then asks "Who is this?": **the same player as this device** (Replace, which discards this device's progress for that player) or **someone else** (Add a new, named player).
- A page opened with `#link=` drops it from the address and opens Receive.
- **Sync times:** at launch, on returning to the screen, when back online, and shortly after a floor is cleared or a setting changes (`syncSoon`).

### 15.3 Privacy and the sync service
- **End-to-end sealed, as in `seal.js`.** The 43-character link key exists only in the link. HKDF derives three things from it: the lookup ID the server sees, an AES-256-GCM key, and a request token. Records are gzipped, then sealed. **The server can't read progress and holds no names or accounts.**
- **The service is a Cloudflare Worker with one SQLite Durable Object per profile**, built on the `sync/` code: the token is checked on every request, the first save sets the owner, an out-of-date save gets 409 (fetch, merge, retry), records are deleted 90 days after the last save, and there are limits on new profiles per network, total storage and request rate.
- **Sumgeon gets its own Worker (`sumgeon-sync`)**, built from Sound Box's `sync/` code, so neither app's record format or limits can affect the other. It only accepts requests from Sumgeon's site and localhost.

### 15.4 Merge rules (`merge.js`, tested in Node)
Merging must work in either order, and merging twice must change nothing:
- **Earned things only grow:** achievements, Bestiary entries, Wings cleared, best floor, high scores and cosmetics unlocked.
- **Tallies are kept per device** inside the record: each device's share is its total minus what the others had in the last merged record. That covers practice days, damage, floors and counts. The app keeps saving plain totals.
- **Fact records:** `seen`/`correct` are per-device tallies. `box` and `avgMs` come from the device with the latest `lastSeen` for that fact, so the most recent practice wins.
- **Settings** merge by an edit counter, never by the clock.
- **The in-progress run does not sync.** It's per device, the way Sound Box doesn't sync a puzzle in progress.
- **The record format has a version (`RECORD_VERSION`).** An older app leaves a newer record alone until it updates, so it never drops fields it doesn't know.

### 15.5 Start over
Start over sits in Settings and asks the grown-up to type "start over", as in Sound Box. It clears the player's progress in the current band and **unlinks** the player, so the erased data can't sync back. Other devices keep the shared player.

---

## 16. Decisions and open questions

**Decided (2026-11-23)**
- **Hearts for Sprout:** yes. Kindergarten-age players can handle losing a run. Sprout gets 7 hearts.
- **Multiple choice:** no, in any band. Answers are always typed.
- **Names checked against existing characters (2026-11-23):** Numberjacks (BBC) has digits 0–9 as heroes vs. villains, but our names, looks and summon mechanic are our own. The 0 hero is **Zeroic**, not "Hero Zero" (too close to the classroom tradition and picture book *Zero the Hero*). The 8 hero is **Chef Eight**, not a tentacle superhero (too close to Numberblocks' Octoblock). The Pirate Cove boss is **Dread Pirate Radius**, not Captain Circumference (the *Sir Cumference* books use the same pun). The Negative Zone monster is **Negasicle**.
- **Hints follow the Missouri Learning Standards** and the models and words local curricula use (§5.3). Missouri doesn't name a method, so hints show strategy models, and a "For grown-ups" note explains each one. Sprout starts at fluency within 5, as the K standard says.
- **Mastery unlocks Wings** (boss beaten plus over 60% of facts mastered). Grade only sets the starting Wings and help defaults. Lower Wings stay open, and speed counts for every player, never compared across siblings (§4, §6.7).
- **No grown-up lock** (§9): nothing in settings makes progress easier, so there's nothing to guard. Destructive actions only affect the device they're done on. Remove only appears on devices with two or more players, so a kid's own device can't delete anyone, and linked devices can restore a player removed elsewhere.
- **Digit heroes:** the digits 0–9 are the player's heroes and the operators are the monsters. Your captain is your avatar, your answer summons its digits, and one cursed digit is rescued per Wing clear (§6.6).
- **Pre-reader support:** the target pre-reader reads numbers fluently, so only words (instructions, menus, story text) need icons and voice. Problems stay numeric.
- **Voice, achievements, players and linking copy sound-box-crosswords** (§13–15).
- **Sync service:** Sumgeon gets its own `sumgeon-sync` Worker, not Sound Box's.
- **Hosting:** GitHub Pages in the `jbtule` account, served at `tools.tuley.name/sumgeon/` next to Sound Box. Deploy works like Sound Box's: a GitHub Actions workflow (`ci.yml`) runs the check, stamps the site into `_site/` and deploys on push to `main`. The audio clips go to a separate Cloudflare Pages project, and the sync Worker deploys in its own job.

**Open**

- **Speed vs. accuracy:** how much should a fast answer be rewarded before it pressures slower thinkers? The speed bonus is timer-only for now.
- **Word problems:** Master-band "story" problems would fit the fiction ("The pirate has 3 chests of 12 coins…"), but reading load is high. Consider them later, after read-aloud exists.
- **Classroom use:** players plus linking cover home use and shared devices. A teacher's class view would need accounts or names on a server, which goes against pillar 6, so default to no.
- **Number clips:** record "fifty-six!" for damage callouts on every hit, or only on crits and finishing blows to keep it from getting noisy?

# Sumgeon — Design Direction

_Last updated 2026-11-23. Companion to `CLAUDE.md`. That file describes what the prototype is today. This file says where it's going._

---

## 1. Vision

**Sumgeon is a math-fact dungeon crawler where your answer is your weapon.** Every problem you solve becomes an attack. The number you type flies at a monster made of numbers and symbols. The game should feel like a real game first, with practice built in. A kid should want "one more floor" without anyone asking them to do math.

### Design pillars
1. **The answer is the attack.** Every system should support the idea that math is the player's power. Correct answers do damage, streaks do more, and harder problems hit harder. We never add a mechanic that lets you win without doing math.
2. **Failure teaches and never shames.** A miss always shows the right answer, and that problem comes back later. Losing a run costs a little and gives the player something to learn from. No mocking copy and no red "WRONG" screens.
3. **One game, ages 5 to 14.** The same dungeon and the same monsters work for a kindergartner doing 3 + 4 and an eighth-grader doing −3 × (4 − 9). Difficulty comes from *content bands*, not separate games.
4. **Short sessions and instant start.** A floor takes 1–2 minutes and a full run about 10–15. Opening the page gets you into play within two taps.
5. **Chalkboard charm.** The monsters are living glyphs drawn in chalk-and-slate style. New content keeps the existing look: SVG shapes, thick dark outlines, flat fills with a sheen, and the Bungee/Nunito fonts.
6. **Private, offline, free of manipulation.** No accounts, no ads, and no dark patterns such as loot boxes, energy timers or streak-shaming. Progress is saved on the device. The only network use is the recorded voice (saved on the device for offline play), and **optional** device linking, which is end-to-end encrypted so the server can't read it (§15).

---

## 2. Audience and content bands

The age range is 5–14 (kindergarten to 8th grade), which is too wide for one difficulty slider. The game instead has **four content bands**. Each band sets which problem types appear, the number ranges, the input method and the defaults for hints. A player (or parent) picks a band, and the game adapts within it (see §5).

| Band | Ages (≈ grade) | Core skills | Defaults |
|---|---|---|---|
| **Sprout** | 5–7 (K–1) | How many? (dot flash); compare; add/subtract fluently within 5, then within 10, then 20; make 10; teen numbers as 10 + ones; counting on; doubles; count by 1s and 10s, then 5s; coin names, then values | Word-free UI with spoken instructions, visual hints (dots, ten-frames), 7 hearts |
| **Apprentice** | 8–9 (2–3) | Add/subtract within 100; count by 2s; arrays up to 5×5; money with $ and ¢; times tables to 10; division as an inverse fact | Hints on, 5 hearts |
| **Adept** | 10–11 (4–5) | Multi-digit ×÷, tables to 12, fractions (equivalent, add like denominators), decimals to tenths and hundredths | 5 hearts |
| **Master** | 12–14 (6–8) | Negatives, order of operations, percents, exponents and roots, one-step equations | 5 hearts, harder bosses |

The current Easy, Medium and Hard settings become difficulty levels *inside* a band. The operation checkboxes were to become a "custom practice" option for parents and teachers, since cut (§9).

**Plan (2026-11-25): one band per grade, K through 5th.** The four bands above were drawn by age. A review against the Missouri Learning Standards and the curriculum guides of the players' school found that this mixes grades: Apprentice made a 3rd grader clear sums within 20 before multiplication, the Sprout Wing asked 2nd-grade coin counting, and 2nd grade's two-digit math hid in the Tables Tower. So Sprout, Balance and Apprentice become a band per grade, K, 1st, 2nd and 3rd, and Adept becomes 4th and 5th. Each grade's band is one stratum (§4), with its levels in the order the school teaches them. **The game tops out at 6th grade:** one stretch stratum of 6th-grade math (§4.1) replaces Master, and the 7th–8th grade strata are dropped.
- A new player picks their **grade** (K–5) instead of a band. It opens every stratum up to that grade, as the band does now. **Built (2026-11-25):** the kid picks it on the start screen ("What grade are you in?", K and 1–5) and can change it in Settings → Players. **Rebuilt by grade (M5 step 1, 2026-11-25):** K starts in the Counting Cellar, 1st in the Balance Hall, 2nd in the Crystal Mines, 3rd–5th in the Tables Tower, each with every stratum above it open.
- What each grade asks follows the guides, limited to what works as a quick typed answer (§4). Angles, graphs, the coordinate plane, measurement conversions, prime or composite (a yes/no) and word problems are left out of fights. Shapes came in (2026-11-26) as drawing them on the spell pad and counting their sides, corners, faces and parts (Polly-Gon, §4.1).
- The guides' own models and words decide how the hints teach (§5.3); the standards decide what each grade covers.

**Design rules for the youngest players (Sprout):**
- The target player is a **pre-reader who reads numbers and symbols fluently**. Problems are plain numerals and symbols, the same as in every other band. Only the *words* need help: every instruction, button and menu gets an icon, and can be read aloud with `speechSynthesis`. Reading problems aloud is available but not needed.
- Hearts stay, at 7 instead of 5. Losing a run is fine at this age as long as the copy is kind and the next run starts right away.
- **No multiple choice in any band.** Every answer is typed, so the player has to work it out rather than recognize or guess it.
- **No timer, in any band.** Pressure stops young kids from learning. Speed is used for two things only: judging fluency and the ★ all-fast star (§6.7). (Settled 2026-11-25; the prototype's countdown was removed on 2026-11-24.)
- Use bigger touch targets (≥ 64 px) and fewer buttons on screen at once.
- Show a visual model next to the numbers: dot groups for 3 + 4 and a ten-frame for make-ten.

---

## 3. Core loop (keep, then deepen)

The current loop works and stays at the center:

> See monster → read problem → type answer → hit (or get hurt) → monster falls → descend.

What changes:

| Current | Direction |
|---|---|
| Damage = answer; crit ×2 after a 3-streak | Keep both. No speed bonus: speed never changes damage (§6.7). |
| A miss costs a heart and shows the answer | Keep. Also **queue the missed problem** to come back 2–4 problems later (see §5). Getting it right the second time shows a small "Got it!" moment. |
| The answer pops up as a number | **Your answer summons its digits**: each digit is a hero that attacks (§6.6). |
| One monster per floor | Floors can sometimes have **two weak minions** or **an elite** variant, such as a gold-outlined Plusquito with more HP and a special rule. |
| Clearing a floor heals 1 heart | Keep, and add **math-locked chests** (§6.3) with money, items and clothing; the player decides something besides "next". |
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
- **Pipsqueak** (the Cellar): 🎲 *Flash*. Dots flash for a moment (a die, a five-frame, a domino, small groups): how many? Then a sum of two small numbers comes as two dice to count by sight. They stay dice (counting the dots is the point): only the 💡 hint puts each die's number beside it, and a miss's Oops card shows the fact in numbers.
- **Doublet** (the Hall): 👯 *Doubles*. Asks only doubles and taking half away (8 + 8, 16 − 8).
- **Triceraplus** (the Hall): 🦕 *Three horns*. Adds three numbers, two of which make 10 (4 + 3 + 6: find the ten first).
- **Margot-Rythm** (the Mines): 🔁 *Carry the One*. Problems that need regrouping hit double.
- **Squaresquatch** (the Mines): 🟩 *Arrays*. Rows of dots, added as equal rows (5 + 5 + 5).
- **Halfling** (the Tower): ½ *Halves*. Asks only fractions: on a number line (where's the dot? □/4; how many equal parts?), then equal fractions (1/2 = □/4), with the line from 0 to 2.
- **Polly-Gon** (every stratum): no trait. Asks only shapes; before each problem it squawks the shape it wants. (Its body flashing the shape, 🦜 *Squawk Back*, was taken out on 2026-11-27 as unnecessary.)
- **Cursed digits** (Sevenstein, Octoloop and the other eight; §6.6): 🍀 *Lucky Number*. Answers containing its digit deal double damage.

Explain each trait with a single icon and five words or fewer.

The monsters are all **operators and symbols**. Digits are on the player's side (§6.6).

---

## 4. World structure: the Wings of the Sumgeon

The dungeon is a map of **Wings**, shown in the game as **strata**. Each Wing has its own floor palette, monsters and boss. **Mastery unlocks Wings, not grade.** The Wings form a chain going down. A Wing unlocks the next one when its boss is beaten **and** over 60% of its facts are mastered, the same bar as the *Legend Loading…* achievement (§14.2). A kindergartner who masters her facts climbs into multiplication. A 3rd grader can't skip ahead without mastering the facts below.
- **The grade is a starting point, not a ceiling.** When a player is created, their grade opens every Wing up to and including theirs, so a 3rd grader doesn't have to grind through kindergarten. It also sets their help defaults (read-aloud and hints).
- **Lower Wings are always open,** so an older player can drop back for fast, easy practice (§6.7).
- **New content gets taught as it arrives.** The first time a kind of problem appears, the captain demonstrates it, and a new fact offers its model a tap away (§5.3). That's what makes working ahead possible for a young player.
- **There is no manual unlock.** See §9 for why nothing needs a grown-up lock.

### 4.1 The grade strata (plan, 2026-11-25)
One stratum per grade, in a **straight chain**: each opens only the next. The levels inside each follow the school's teaching order. The audience stops at 5th grade, but one **stretch stratum** of 6th-grade math, Pirate Cavern, sits under the Pyramid so a 5th grader who finishes it can keep going, and the game ends there. Its content follows the school's 6th-grade guide.

**Left out of fights** (they don't fit a quick typed answer): naming shapes from a list (shapes are drawn and counted instead: Polly-Gon, below), angles and symmetry, graphs and line plots, the coordinate plane, inequalities, days and seasons, sorting, word problems, and measurement conversions (for now). Writing numerals is practiced by spell casting.

| Stratum | Grade | Levels (in order) | Monsters | Boss |
|---|---|---|---|---|
| **The Counting Cellar** (built, by grade) | K | Within 5, with zero (4 + 0, 4 − 4) → within 10 → make 10 (7 + □ = 10) and number bonds → teen numbers as 10 and some more (10 + 4, 14 − 4); counting on from a number and back from 10 throughout | Plusquito (+), Minustaur (−), Trollar ($: find the coin, each coin's worth), Chompers in a K form (which is more, 7 or 4? type 7: comparing without symbols), Slimelipsis visiting (count on, count back), Pipsqueak (dice: how many at a glance, then the numbers), Polly-Gon visiting (draw and count circles, squares, triangles, rectangles, hexagons) | **Make-Ten Golem** |
| **The Balance Hall** (built, by grade) | 1st | Within 20 without crossing 10 → crossing 10 (make a ten, use a ten, doubles) → missing numbers and the equal sign → ± tens (34 + 20, 10 more, 10 less); counting to 120 and by 5s throughout | Quizard (?), Chompers (< = >), Equal Twins (=, balancing and true or false), Doublet (doubles), Slimelipsis visiting (to 120, by 5s), Triceraplus (three numbers, 4 + 3 + 6: find the ten), Tick-Tockus (hours and half hours), Polly-Gon visiting (sides and corners; halves and fourths) | **Judo Judy** (replaced The Unknown) |
| **The Crystal Mines** (built) | 2nd | Two-digit ± within 100, adding and subtracting mixed → with regrouping → three-digit place value (34 tens is 340) → ± 10 and 100 within 1000 → ± within 1000 without, then with regrouping (built); adding up to four two-digit numbers and comparing three-digit numbers as strands (built); odd and even | Haberhasher (tens and ones), Trollar (counting coins with ¢ and $), Slimelipsis (skip counting by 2s, 5s and 10s; odd and even), Squaresquatch (²: arrays up to 5 × 5 as 5 + 5 + 5), Margot-Rythm (¹+: carry the one, regrouping hits double; visiting), Tick-Tockus (to 5 minutes), Polly-Gon (⬡: sides, corners and faces, equal shares, rows and columns of squares) | **The Centipede** |
| **The Tables Tower** (built, by grade) | 3rd | ×0, 1, 2, 5, 10 and their ÷ → ×3, 4, 6 and ÷ → ×7, 8, 9 and ÷ → × tens (4 × 30) → fractions: unit fractions, on a number line, simple equivalents, comparing (1/2 ○ 1/3) → rounding to the nearest 10 and 100 → area and perimeter → ×÷ 11 and 12, kept as an extra bottom level | Timesaur (×), Divvy (÷), Starbot (*), Halfling (½: the fractions), Tick-Tockus (to the minute, and elapsed time), Polly-Gon visiting (quadrilaterals, unit fractions), Chompers visiting (comparing fractions) | **Sigma Rex** |
| **The Fraction Forge** (plan, §4.4; the order from the school's 4th grade guide) | 4th | Compare and round to a million → add and subtract to a million → × 10, 100 and 1000 → × by one digit → two-digit × two-digit (area model) → ÷ by one digit → remainders (29 ÷ 4 = □ R □) → multi-step problems and factors (6 × □ = 48) → equivalent fractions (3/4 = □/8) → comparing fractions → adding and subtracting like fractions and mixed numbers (2 1/8 + 3/8), building from unit fractions → a fraction times a whole → tenths and hundredths, comparing decimals → angles and classifying shapes → area and perimeter formulas → measurement conversions; patterns from a rule as a strand | Quarterjack (¼), Dotty (.), Boomainder (R); Timesaur, Divvy, Chompers, Margot-Rythm, Haberhasher, Slimelipsis, Polly-Gon, Squaresquatch and Tick-Tockus visiting | **The Denominator** |
| **The Parenthesis Pyramid** (new) | 5th | In the school's unit order (its guide numbers the units): **Unit 1:** ★ volume of rectangular prisms in unit cubes, V = l × w × h → **Unit 2:** place value to billions and thousandths (word, standard and expanded form) → ★ fractions as decimals (3/4 = 0.□□) → comparing decimals → powers of ten (10³ = □) → rounding decimals → adding and subtracting decimals → ★ adding and subtracting fractions and mixed numbers with unlike denominators (1/2 + 1/4 = □/4) → **Unit 3:** multiplying decimals → dividing whole numbers and decimals, two-digit divisors → ★ multiplying fractions (3 × 2/5, 1/2 × 3/4, as area) → fractions as scaling (bigger or smaller?) → dividing unit fractions and whole numbers (3 ÷ 1/2, 1/2 ÷ 4) → **Unit 4:** ★ converting measurements within a system (2 L = □ mL) → classifying shapes in a hierarchy (a square is a rectangle) → line plots (★ median) → **Unit 5:** ★ patterns from two rules → ★ order of operations ((4 + 2) × 3) → the coordinate plane, first quadrant (ordered pairs) → line graphs. ★ = the guide's priority standards | Parenthesaurus (( ), order of operations), Exponent-tron (^, a cube-bodied robot: volume, "cubed"), a fraction monster (to design) | **Shoutandcomma** (!), the mummy in the deepest chamber |
| **Pirate Cavern** (stretch) | 6th, for 5th graders who finish the Pyramid | In the school's unit order (with its weeks): GCF and LCM, and the distributive property (12 + 20 = 4 × (3 + □)) (2 wk) → dividing fractions and mixed numbers (3/4 ÷ 1/8) (1.5) → ratios and equivalent ratios (2:3 = □:12) (1.5) → rates and unit rates, unit prices (12 for $3, so □ for $1) (2) → percent, and fractions = decimals = percents (25% of 80; 3/4 = □%) (2) → rational numbers: on a number line, comparing, opposites and absolute value (|−7| = □; −3 ○ −8) (3) → the coordinate plane in all four quadrants (reflections, distances) (2) → algebraic expressions (evaluate 3x + 2 when x = 4; like terms; distributing) (3) → one-step equations (x + 7 = 15; 4x = 28) (2) → one-step inequalities (is 5 a solution of x > 3?) (1.5) → data: mean, median, mode, range (2) → area of triangles and composite shapes, and surface area from nets (3). The guide lists all 14 of its units as priority standards | Rootling (√: GCF and LCM, with factor trees for roots), Slashbuckler (/, dividing fractions), Colon-el Ratio (:, ratios and rates), % Gremlin (percent), Negasicle (−) and Absolutely (\|x\|) (negatives), an x monster for equations (to design, Quizard's grown-up cousin) | **The Dread Pi-rate Radian** (π), the cavern's captain |

- **What changes from today:** the Tower becomes × and ÷ only (its sums within 20 belong to 1st and 2nd grade, so the "alongside" level in Apprentice goes away); Haberhasher moves to the Mines; Quizard moves to the Hall, since hidden numbers are 1st grade; coin counting moves to the Mines, and the Cellar keeps finding coins and their worth, which the K guide teaches.
- **5th and 6th grade, from the school's guides (2026-11-27):** the Parenthesis Pyramid's and Pirate Cavern's levels above follow the school's 5th and 6th grade guides, in their unit order (the 5th grade guide numbers its units 1–5; the 6th grade guide lists its units with weeks). Earlier drafts put 5th grade's operations first and volume last; the guide starts with volume (Unit 1) and keeps decimals and fractions together (Units 2–3). Names are unchanged. Things the drafts didn't have: place value to billions and thousandths, fractions as decimals, measurement conversions, shape hierarchies, line plots and line graphs, patterns from two rules and the first-quadrant coordinate plane (5th); rates and unit prices, the four-quadrant plane, inequalities and surface area (6th). Which become levels, strands or are left out (data displays and graphing need new problem types) is for when each stratum is built, as for 4th grade.
- **Answers stay whole numbers where possible.** Most 4th- and 5th-grade problems hide a whole number in a box (3/4 = □/8), so the answer is still the damage, as with missing numbers. New pad keys appear only when a problem needs them: **R** for remainders, **.** for decimals, **−** for negatives (Pirate Cavern), and the stacked fraction input (§7.1) for problems whose answer is a fraction. A fraction, decimal or percent answer hits for its value as a percent (§7.2).
- **Tick-Tockus** asks time the way Trollar asks coins: one monster whose problems follow the stratum's grade.
- **Saved progress:** a dungeon version bump starts runs over and keeps what's been learned. (Done: version 5. No fact's key changed meaning.)
- **Built in step 2 (2026-11-25), with today's input and monsters:**
  - **K (Cellar):** within 5 with zero (4 + 0, 4 − 4) → within 10 → make 10 (7 + □ = 10) and number bonds of 5–9 as □ problems → 10 and some more (10 + 4, 14 − 4, 10 + □ = 14). Chompers asks "which is more, 7 or 4?" (type the bigger number), Trollar finds coins and says what each is worth, Plusquito and Minustaur ask the rest. Not yet: counting on and back, the dot flash, Slimelipsis (all built since).
  - **1st (Hall):** within 20 not crossing 10 → crossing 10 → missing numbers and the equal sign (8 + □ = 13, balance both sides) → ± tens (40 + 30, 10 more, 10 less, 34 + 20), with comparing at each step (to 10, sums, to 100). Quizard, Chompers, the Equal Twins and Minustaur. Not yet: counting to 120, three addends, true or false, hours.
  - **2nd (Mines):** two-digit ± mixed without regrouping → with regrouping → 10 and 100 more or less within 1000; counting coins with ¢. Haberhasher and Trollar, with Plusquito and Minustaur standing in, and The Centipede as its boss. Not yet: four addends, three-digit place value (34 tens), odd and even, $, arrays.
  - **3rd (Tower):** × and ÷ only, in the school's order (× 0, 1, 2, 5, 10 and ÷ → × 3, 4, 6 and ÷ → × 7, 8, 9 and ÷), then × tens, fractions as a hidden whole number (1/2 = □/4, 2/4 = □/2, 1 = □/4), rounding to the nearest 10 and 100, area and perimeter of a drawn rectangle, and × ÷ 11 and 12 last. Not yet: fractions on a number line and comparing them (Halfling), time.
- **Built in step 3 (2026-11-25): six new monsters**, with facts the game already has where it could:
  - **Pipsqueak** (Cellar, 🎲 Flash): dice sums (both numbers 1 to 6), shown as dice, which stay dice: the 💡 hint puts the numbers beside them. Floor 2 at depth 1; Minustaur stays in the pool.
  - **Doublet** (Hall, 👯 Doubles): only doubles and taking half away, from every kind the Hall has (8 + 8, 16 − 8, 40 + 40, 7 + □ = 14).
  - **Triceraplus** (Hall, 🦕 Three horns): one small new set, 20 sums of three one-digit numbers with a make-ten pair (1.OA.A.2, 1.OA.B.3), as its own strand, so the Hall's 60% doesn't wait on it. Hint: find the ten, then add the rest.
  - **Margot-Rythm** (Mines, 🔁 Carry the One): the Mines' + and −, and a problem that needs regrouping (in any place) hits double.
  - **Squaresquatch** (Mines, 🟩 Arrays): one small new set, 2 to 5 rows of 2 to 5 dots (2.OA.C.4), added as equal rows, as its own strand with keys of its own, so it never counts as the Tower's times tables.
  - **Halfling** (Tower, ½ Halves): only the Tower's fractions, from the start. Fractions on a number line (batch 2) and comparing fractions (2026-11-26) came later.
  - The Mines no longer borrow Plusquito and Minustaur, and the Hall's pool drops Minustaur. Tick-Tockus and Slimelipsis waited for problems of their own (time, patterns; built in batch 1, below). No dungeon version bump: floor counts and rescue floors are unchanged, and no fact's key changed meaning.
- **Built in batch 1 (2026-11-25): Tick-Tockus and Slimelipsis**, from the prototypes (review/proto/), each a strand per stratum (fixed samples, every problem recorded, not counted toward a stratum's 60%):
  - **Tick-Tockus** (🕒 Tick Tock: asks the time; js/clock.js): the clock is the monster, showing each problem's time. Hall (1st): hours, then half hours, with the whole time typed in two slots (□:□□, the hour, then the minutes). Mines (2nd): to 5 minutes, then the whole time. Tower (3rd): to the minute, then elapsed time, "how long?" and "minutes later", in the hour and across it. Hints: the hour hand glowing, the long hand's sweep counted by 5s round the rim (never to the end before answering), the open number line across the hour (3.MD.1).
  - **Slimelipsis** (🫧 What's Next: counts in patterns; js/patterns.js): a row of slimes, the □ one glowing. Cellar (K, visiting): count on by 1s, by 10s, back by 1s. Hall (1st, visiting): on to 120, by 5s. Mines (2nd): by 2s, by 100s, what's missing by 2s, 5s, 10s and 100s, then odd and even to 20 and to 100 ("How many even numbers?", hint: pairs of dots, then the ones digit). Hints: hops labeled with the step.
  - Floors: Tick-Tockus takes a depth-1 floor in the Hall (for Doublet), the Mines (for Squaresquatch) and the Tower (for Starbot); Slimelipsis one in the Mines (for Trollar); the moved monsters stay in their pools. Arrays' hint now counts on only to the halfway row before answering.
- **Built in batch 2 (2026-11-26): true or false, the fraction number line, place value and dollars, and stacked sums**, from the prototypes (review/proto/), with fixed samples and every problem recorded:
  - **True or false and fix it** (the Equal Twins, Hall, 1.OA.D.7; js/truefalse.js; keys "✓4+2=7", "✎4+2=7"): one equation on one scale, answered on two big keys, True ✓ and False ✗, in the number pad's place (one tap answers, after a brief press; T or F on a keyboard); the scale swings to the truth once it's answered. Fix it: the false equation shows, then its wrong number lifts above its slot and a □ takes its place; the right number drops in and the scale levels. 80 facts as sets in the Hall's band, like the balance sets: true or false to 10 in the first level, to 20 with crossing 10, fix it (to 10 and 20) with the missing numbers and the equal sign. In the band rather than a strand because the Twins also balance (a monster asks one strand or its band), and it's the equal sign the Hall is about, so it counts toward the 60%. A right true or false hits for the bigger side (the equation's total when it's true), as Chompers hits for the bigger number; fix it hits for the number. Hint: each side's dots in the pans, the scale held level until it's answered.
  - **The fraction number line** (Halfling, Tower, 3.NF.A.2; js/numberline.js; keys "↔3/4", "↔p4", "↔5/4,2"): where's the dot (□/2 … □/8, all 18), how many equal parts (5), and from 0 to 2 (past 1, and 4/4 = 1, 8/4 = 2; 12). A level of the Tower's band, "Fractions on a number line", before the equal fractions (renamed "Equal fractions"), which take the 0 to 2 line as whole numbers as fractions (3.NF.A.3c). Every Tower monster can ask it, as they can fractions; Halfling asks only these. Hint: the jumps from 0 counted partway (half of them) before answering, then "?"; every part worked.
  - **Place value with base-ten blocks** (Haberhasher, Mines, 2.NBT.A.1–4; js/placevalue.js; keys "#b345", "#e345", "#t120", "#o34,3", "#o1,14,5"): blocks to a number and expanded form, then tens in a number and the odd splits (34 tens and 3 ones; 1 hundred + 14 tens + 5 ones), on the dark place-value mat, rods in groups of ten. Two levels of the Mines' band after the two-digit work and before 10 and 100 more or less, the school's order (two-digit, then three-digit numbers, then three-digit work). Margot-Rythm asks only the + and −.
  - **Dollars and cents** (Trollar, Mines, 2.GM.D.12; js/dollars.js; keys "$20,5,1", "$10,1+1,1,0,2"): bills only ("How many dollars?", "$□"), then bills and coins in two slots, "Dollars ✓" then "Cents!" ("$□ and □¢", as a whole time is typed). The next two levels of the Mines' coin strand. Never a decimal ($3.25 is 4th grade). Bills and coins hit for the cents, the last slot (as a whole time hits for its minutes). Hint: counting on from the biggest bill, then the coins, partway before answering.
  - **Stacked sums** (2nd grade): two- and three-digit + and − are sometimes shown in columns (a quarter of the time, always on Margot-Rythm's floor), the answer typed under the line, right-aligned. The same fact and record (a flag on the problem, like Judo Judy's flipped). The hint stays the place-value strategy (tens and ones, then together); the carrying algorithm waits for 4th grade.
- **Built (2026-11-26): three-digit numbers**, with fixed samples and every problem recorded:
  - **Adding and subtracting within 1000** (Mines, 2.NBT.B.7): four new levels of the Mines' band after 10 and 100 more or less, in the school's order: add, add with regrouping (ones, tens, both), subtract, subtract with regrouping (and a few across a zero, 403 − 158); 88 facts in `twodigit.js` (they're plain + and − facts with the same keys, layout and voice, so they extend its sets rather than a new module). Shown stacked half the time, always on Margot-Rythm's floor. Hints: partial sums on a place-value mat (flats, rods, cubes); taking away each place; counting up on an open number line when a place doesn't have enough. Never the algorithm.
  - **3rd grade's fluency** (3.NBT.A.2): Margot-Rythm visits the Tables Tower's pool with these facts as her strand (`addT`, the same keys, so the Mines' learning counts), so the Tower stays × and ÷ in its band and its 60%.
  - **Comparing three-digit numbers** (2.NBT.A.4): Chompers visits the Mines with them as his strand (`cmpM`), on the < = > keys; the hint compares the hundreds, then the tens, then the ones.
  - **Adding up to four two-digit numbers** (2.NBT.B.7): Triceraplus visits the Mines with them as his strand (`sumsM`): three numbers, then four, stacked half the time; the hint finds a ten or adds the tens, then the ones. Strands rather than band levels, so a pool monster doesn't hold up the Mines' 60%.
- **Built (2026-11-26): shapes, with Polly-Gon** (js/shapes.js, from the prototype; 🦜 Squawk Back), a strand in every stratum (64 fixed facts, shared keys, not counted toward a stratum's 60%), each in the school's order:
  - **K (Cellar):** draw and count circles, squares, triangles and rectangles, then hexagons and the sides and corners of any shape (K.GM.A). **1st (Hall):** sides and corners whatever the shape (defining attributes), then halves and fourths of circles and rectangles (1.GM.A). **2nd (Mines):** shapes with a given number of sides or angles, with pentagons, a cube's faces and a square pyramid's; equal shares in 2, 3 or 4 (a priority standard); a rectangle in rows and columns of squares, counted (2.GM.A). **3rd (Tower):** quadrilaterals (a square is a rectangle and a rhombus; "draw a quadrilateral"), then unit fractions: a shape in equal parts, each part 1/□ (3.G.A).
  - **Draw it** on the spell pad (touch screens only, as spells are; a mouse or keyboard gets only the counting, and drawing is at most 40% of a level so counting still opens the next): read by the same $P recognizer with shape templates, the corners counted and the box's aspect, judged knowing the shape. Right: a hit, the clean shape glowing over the drawing. Clearly another shape: a miss. Unclear: try again, then a counting problem in its place. A drawing records the fact like any answer. A square for "rectangle" counts in every grade: it is one, and the K and 1st grade guides don't set them apart.
  - **Damage:** a drawing hits for its strand's typical answer (the mean of its counts: 4, 4, 6, 5), so a circle (no sides) isn't a wasted turn and fights last the same; a count hits for the count.
  - **Count it:** sides, corners, faces, equal parts, squares in all, and 3rd grade's "each part = 1/□", typed. Hints count partway (about half, or the first rows), never to the end before answering; a drawing's hint is its corners as dots to join, the first sides drawn.
  - **Floors by priority standards:** shapes aren't a priority in the K, 1st or 3rd grade guides, so Polly-Gon visits the Cellar, the Hall and the Tower from their pools; 2nd grade's equal shares are, so it has a depth-1 floor in the Mines, for Margot-Rythm (whose ± within 1000 is the Mines' own band, asked by Haberhasher and the boss too), who moves to the pool.
- **Built (2026-11-26): comparing fractions** (3.NF.A.3d, a priority standard): 24 fixed facts in js/third.js, "3/8 ○ 5/8" (the same denominator: same size pieces, more pieces is more), "2/3 ○ 2/6" (the same numerator: the same number of pieces, bigger pieces is more), and 4 equal fractions (2/4 ○ 1/2) so = is sometimes right; denominators 2, 3, 4, 6, 8, shown stacked, answered on the < = > keys. A level of the Tower's band after Equal fractions, since a priority standard counts toward the 60%.
  - **Who asks:** Chompers visits the Tower's pool (decided with the user: he has the flip and chomp for < = >, and eats the bigger fraction, which shrinks into his mouth; a right = is his happy bounce). With no strand in the Tower he asks the band's comparisons, which there are only fractions. Halfling, the fractions monster and a depth-1 floor, asks them too. The Tower's other monsters never compare.
  - **Damage:** a comparison hits for the bigger number; for fractions, the bigger fraction's numerator (its pieces), as the Tower's other fractions hit for a numerator.
  - **Hint:** two fraction bars of the same whole, one over the other, shaded, with the rule in words; never the symbol (or a ring round the bigger) before answering; worked, the bigger bar ringed in gold and the comparison written.
- **Built (2026-11-26): the dot flash** (K.NS.B.8; the K guide's subitizing, 1–5: dot cards, dice, five-frames, dominoes), with Pipsqueak: "How many dots?" 22 fixed facts (keys "⁙d4" a die, "⁙f3" a five-frame, "⁙o3,2" a domino, "⁙s2,2,1" small groups).
  - **Pipsqueak's strand in the Cellar** (`flashK`): dice and five-frames to 3 → to 5 → dots any way (dominoes and small groups) → his dice sums (the band's facts within 10, the same keys), so it's how many at a glance first, then the numbers, the K guide's order. A strand, like which is more (the other half of the Cellar's first step), because a monster asks one strand or its band, and a level at the front of the Cellar's band would close levels a returning player has open until the flash was learned; it doesn't count toward the Cellar's 60% (the progression plan, §4.3, would count it as a priority step).
  - **A brief look, not a test of speed:** the dots show for 1.5 s, then the card turns face down; "Show me again" peeks once more (a hint). The answer is typed, and hits for the count.
  - **Hint and miss:** the dots come back, colored by the groups they're seen in ("2 and 2 make ?"); worked, "2 and 2 make 4." Never the count before answering.
  - **Voice:** "How many dots?" as it appears; the first time, "Look quick! How many dots?".
- **Build order** (stacked PRs): (1) this plan; (2) restructure K–3 into grade strata with today's monsters (the levels in the school's order, zero facts, make-10 partners, ×0 and ×1, × tens, monsters moved), with a stand-in wall and boss for the Mines; (3) the Crystal Mines' wall, palette, the Centipede and voice lines; (4) the new K–3 monsters: Doublet, Slimelipsis, dot flash, three addends, arrays, Tick-Tockus; (5) the Fraction Forge; (6) the Parenthesis Pyramid.

### 4.2 Retired: strata past 6th grade
The first design went on to 8th grade (the Negative Zone, the Root Cellar, and Pirate Cove for percent and π). The game now ends at Pirate Cavern, and their monsters fill gaps above: Negasicle, Absolutely, Rootling, Slashbuckler, Colon-el Ratio, % Gremlin and the Dread Pi-rate Radian in Pirate Cavern, Squaresquatch in the Crystal Mines, Exponent-tron in the Pyramid. Their bosses Lord Undefined (÷0), the Hydra of Powers and Dread Pirate Radius are retired.

Endless (§6.4) has no boss of its own: the Endless Specter was dropped on 2026-11-27, since Endless is a mastered stratum that keeps going with its own bosses.

A Wing's monster list is a **pool**, which can be bigger than one run's floors. Each run draws its floors from the pool, so replays meet different monsters. **Creature types can repeat across Wings** (there are two robots, two ghosts and a few pirates), but within a Wing no two regular monsters share a creature type, and repeats need clearly different silhouettes. Pirate Cavern's pirates are the exception, because pirates are its theme.

Every Wing also has one **rescue floor** holding a cursed digit (§6.6). The prototype's operator monsters move into the Counting Cellar and the Tables Tower, and Sevenstein and Octoloop become cursed digits. New monster art follows the existing `solid()` / `line()` helper style: shapes only, no fonts inside the SVG, a dark outline, a fill and a sheen.

### Monster design notes for new glyphs
- **= Twins**: two bars that are siblings and finish each other's sentences. They pose missing-number problems (□ + 4 = 9).
- **Chompers (< >)**: a croc whose mouth opens toward the bigger number. This is the classic comparison mnemonic. Answering is a tap: <, = or >.
- **Rootling (√)**: a creature whose roots are its legs, in Pirate Cavern. *Factor trees*: GCF and LCM, its roots branching into factors.
- **% Gremlin**: two little circle-headed gremlins on a seesaw. It asks "10% of 50" and similar.
- **The Dread Pi-rate Radian** (π; named by the user, 2026-11-27, was the π Pirate): one leg on each side of the π bar and an eyepatch. Pirate Cavern's boss, the cavern's captain: it mixes the Cavern's 6th-grade problems.
- **Halfling (½)**: its body is literally split in two. In the Tables Tower, 3rd grade's fractions: unit fractions, fractions on a number line, simple equivalents and comparing.
- **Quizard (?)**: a question mark in a wizard hat, holding a wand. *Mystery*: the missing number moves around (3 + □ = 7).
- **Shoutandcomma (!)**: a mummy whose tall wrapped body is the !, with the dot as its feet. The name is a pun on Tutankhamun. The Parenthesis Pyramid's boss (5th grade): like every boss it mixes its stratum's problems, and its boss roars are the mummy rising from its tomb. *Unwrap*: at half HP its wrappings come off and its problems turn to big numbers, powers of ten and place value (10³ = □; how many zeros in 10⁵).
- **Slimelipsis (…)**: three little slimes in a row, in the Crystal Mines (2nd grade). *What comes next*: skip counting by 2s, 5s and 10s (2, 4, 6, □; 15, 20, □).
- **Doublet (+ + twins)**: two plus signs who do everything together, in the Balance Hall. *Doubles*: doubles facts and doubles to subtract (8 + 8, 16 − 8).
- **Tick-Tockus**: a clock monster whose hands are its arms. *Tell the time*: hours and half hours in the Hall, 5 minutes in the Mines, the minute in the Tower; the answer is the minutes or the hour, typed.
- **Judo Judy (⇄)**: the Balance Hall's boss, a judo fighter whose body is a big ⇄ (turnaround arrows): the top arrow (→) is the arms in a white gi sleeve, its head an open hand reaching to grab; the bottom arrow (←) is the legs in white gi pants, its head a bare foot sweeping in a throw; the black belt between them is a fraction bar; a round head with a red headband and a top-knot sits on top. *Flip*: an addition with the smaller number first (3 + 8) is thrown so it shows 8 + 3, the commutative property as a judo throw: same answer, the same fact. Everything else comes as the Hall's mix. Beaten, Judo Judy taps out and bows. Game text always uses the name, never a pronoun.
- **The Unknown (x)** (retired): the Hall's first boss, *Shapeshift* (switching between comparing and balancing). Replaced by Judo Judy; its art stays in `RETIRED` for the gallery.
- **The Centipede**: the Crystal Mines' boss. Centi- means a hundred: its legs come in tens, for counting by tens and hundreds, and it nods to cents.
- **Parenthesaurus (( ))**: a dinosaur whose ribs are brackets, a regular monster in the Parenthesis Pyramid. *Order of operations*: 3 + 4 × 2, and (3 + 4) × 2.
- **Trollar ($)**: a bridge troll with a $ on his belly who wants coins to let you pass. *Pocket change*: follows the stratum: find each coin and know its worth in the Cellar (K, as the K guide teaches), then count collections with ¢ and $ in the Crystal Mines (2nd grade).
- **Starbot (*)**: a robot with a star-burst head, since * is how computers write ×. *Stripes*: favors the ×5 and ×10 tables.
- **Boomainder (R)**: a ghost who haunts the leftovers. Division with remainders (17 ÷ 5 = 3 R2), which leads into mixed numbers (3⅖). In the Fraction Forge (§4.4): a sheet ghost whose body is the R.
- **Quarterjack (¼)**: a fraction football player (a quarterback), in the Fraction Forge: fractions.
- **Dotty (.)**: the decimal point, a round freckled creature sitting on the line, in the Fraction Forge: tenths and hundredths.
- **The Denominator**: the Fraction Forge's boss, an iron robot that is a fraction (its head the numerator, its shoulders the bar, its body the denominator).
- **Slashbuckler (/)**: a swashbuckler whose sword is the slash. Writes division as 24 / 6, so kids learn the other notation.
- **Exponent-tron (^)**: a robot whose antenna is the caret and whose body is a stack of cubes, in the Parenthesis Pyramid. *Cubed*: volume of boxes (l × w × h).
- **Squaresquatch (²)**: a bigfoot made of grid squares, in the Crystal Mines. *Arrays*: rows and columns up to 5 × 5, as repeated addition (5 + 5 + 5), which leads into area.
- **Colon-el Ratio (:)**: an officer whose medals are the colon. Ratios (2:3).
- ~~**Endless Specter (∞)**~~ (dropped 2026-11-27): a looping ghost meant for Endless Descent. Its body traces ∞, so it looks nothing like Boomainder.

---

### 4.3 Progression within a stratum (plan, 2026-11-26; built 2026-11-26)

_Decided with the user: each stratum follows its grade's teaching order, opened by mastery, and the gaps still open are placed in it._

**Built (2026-11-26)** as planned, with these choices (details in CLAUDE.md "Paths"; `PATHS` in wings.js, `openSteps` in learn.js, `scripts/paths.test.mjs`, `scripts/mega.test.mjs`):
- **Steps** are named levels of today's bands and strands, so no key changed. To keep each band's levels in its path's order (so skipping ahead climbs the path), the Hall's band is cut along its steps (within 20, crossing 10, doubles and near doubles, the equal sign, comparing, tens, two-digit adding), the Tower does all of × before ÷, and the pattern levels are reordered. A plan item that names two steps' worth (3rd grade's "× 3, 4, 6; then × 7, 8, 9") is two steps.
- **The window** counts new steps: a step stops being new at 40% learned and the next joins, so there are never more than three; a step already known joins and is done at once (strictly waiting on the oldest would let one slow strand, coins on one floor a run, hold back the rest). The most steps that ever joined stay open.
- **Chapter cuts** (new steps; ongoing and review steps are in chapter 1): Cellar [within 5, within 10, coins] [make 10, teens, shapes]; Hall [within 20, three numbers, crossing 10, doubles] [equal sign, compare, tens, two-digit adding] [shapes, time, coin values, by 5s]; Mines [two-digit ±, money, time, place value] [compare to 1000, 10 and 100 more, ± within 1000, four numbers] [shapes, arrays, odd and even]; Tower [× 0 1 2 5 10, × 3 4 6, × 7 8 9, ÷] [× tens and rounding, fractions, time] [area and perimeter, shapes, × ÷ 11 and 12].
- **Review steps** are never new: learned facts come back as due reviews to the monsters asking the stratum's band, and for a player who never learned them they're placed when a fluent player skips ahead (rather than spending a new player's first runs on facts they mostly know).
- **Monsters**: a first run in a stratum meets them in the path's order (Pipsqueak and Plusquito first, not Trollar's coins); after that, newest first. The Hall gained Plusquito, Minustaur, Haberhasher and Trollar.
- **Mega bosses**, the boss powering up, the big chest, the crowns, and the gaps (count back from 20, coin values in the Hall, two-digit adding in the Hall; the Mines keep two-digit adding too, the same keys) as planned.
- **Saved progress:** decided with the user to reset runs instead (dungeon version 6): everyone starts at chapter 1 of their grade's stratum, and what's been learned is kept, so skipping ahead carries them along.

**Where the order comes from.** The school teaches from i-Ready, and its curriculum guides give the lessons' order:
- **2nd grade:** the guide numbers all 32 lessons.
- **1st grade:** the topics are numbered, and some lesson numbers are given (data is lesson 13; shapes, time, length and coins are 22–27).
- **Kindergarten:** the units are "ongoing", so the order below follows what builds on what.
- **3rd grade:** the guide lists topics without lesson numbers. Its multiplication-before-division order is confirmed by the class (2026-11-26: no division yet this year, after the × facts).

Left out everywhere, as before: graphs and data, measuring length, word problems, and the K calendar unit (days of the week, seasons, birthdays). None of them is a quick typed number.

**The problem today.** A stratum has one ladder of levels (its band, which opens the next stratum at 60%) and strands beside it (coins, time, patterns, arrays, comparing…). Every strand is open from the first day, so a 2nd grader can meet arrays and odd and even (the year's last two lessons) before two-digit adding.

**The plan: one path per stratum.**
- **Steps:** each stratum gets a single ordered **path** of steps. A step is one of today's levels (of the band or of a strand), so fact keys and records don't change. Each step names the monster that asks it.
- **A window of three topics** (decided with the user: the kids have capacity to go ahead, but not a year's topics at once, and they want variety):
  - About **three new steps are open at once**, and problems mix across them, plus due reviews of everything learned.
  - The next step joins the window when the oldest new step in it is about **40% learned** (box 3+). That's enough to show it's sinking in, without holding a capable kid back.
  - Skipping ahead (§5) still runs a fluent kid past a step they already know in a few problems.
- **Ongoing steps:** a few steps are marked **ongoing** (counting, comparing in K; counting to 120 in 1st). They open with the path's first step and stay open, as the guides teach them all year.
- **Review:** each path starts with a **review** of the grade before (its learned facts mixed in as due reviews, never new). That's how 2nd grade's priority "fluency within 20" and 3rd grade's "fluency within 1000" are kept up.
- **Chapters, guarded by mega bosses** (§14.2):
  - Each path is split into **chapters** of 3–4 steps, and the dungeon's depth paces them: **a chapter every 5 depths**.
  - **Opening a chapter:** its steps can join the window only once **both** the mega boss at the end of the chapter before is beaten **and** that chapter's steps are partly learned (the 40% rule). So a lucky run can't skip learning, and learning alone doesn't skip the dungeon.
  - **The boss across a chapter's 5 depths** builds up to the mega boss:
    - depths 1–2: the normal boss;
    - depths 3–4: the boss **powering up**, gaining pieces of its mega form each depth (a crystal shoulder, then both; a few Σ tufts), with a little more HP and "I'm getting stronger…", but no second trait yet;
    - depth 5: the full **mega boss**, crowned, with its second trait and a big chest. Beating it opens the next chapter.
  - The pattern repeats: depth 10 is the next mega boss, then 15, and so on. Past a stratum's last chapter, mega bosses keep coming every 5 depths, with their chests.
  - On the depth map, the boss icon fills in toward the crown across a chapter, and mega depths wear a crown.
- **Monsters arrive as their step opens.**
  - A monster with no open step doesn't appear.
  - When a new step joins the window, its monster is announced on the floor-cleared or end card ("A new monster appears in the Mines: Squaresquatch!"), and it takes a depth-1 floor from the next run.
  - Depth-1 floors are the newest open steps' monsters (newest first), plus the rescue floor and the boss. Deeper, the pool is every monster with an open step.
  - The boss asks everything open.

  So a stratum visibly fills up with monsters, chapter by chapter, as the player learns and goes deeper.
- **Opening the next stratum:** it opens when the boss is beaten and the path's **priority steps** (the guide's priority standards, marked ★ below) are 60% learned. Other steps (time, patterns, shapes…) never hold it up, as strands don't today.
- **Older players start further on:** a player's grade opens every stratum at or below it (§4.1). Placement and skipping ahead carry a fluent player along a path in a run or two.

**The paths** (★ = a priority standard in the school's guide; the monster in brackets; *new* = a gap to build). Chapters (every 5 depths) group the steps about 3–4 at a time, in this order; the exact cut is set when it's built, with the balance sim.

**The Counting Cellar (K)**
1. ★ How many, and which is more, to 5: the dot flash, how many at a glance up to 5 (built 2026-11-26, Pipsqueak), and which is more to 5 (Chompers). Ongoing.
2. ★ Add and subtract within 5, with zero (Plusquito, Minustaur).
3. Count on by 1s, back by 1s from 10 (Slimelipsis). Ongoing.
4. ★ Within 10 (Plusquito, Minustaur); dice sums (Pipsqueak); which is more to 10 (Chompers).
5. ★ Coins: find the coin, then what each coin is worth (Trollar).
6. ★ Make 10 and number bonds (the Make-Ten Golem's own kind).
7. ★ 10 and some more (teens); count by 10s (Slimelipsis).
8. ★ Shapes: name and draw a circle, square, triangle, rectangle and hexagon; count sides and corners (*shapes batch*, Polly-Gon).

**The Balance Hall (1st)**
1. Review: the Cellar's facts within 10.
2. ★ Within 20, not crossing 10; count on to 120 and back from 20 (Slimelipsis; count back from 20 is *new*). Ongoing.
3. ★ Three numbers (Triceraplus).
4. ★ Crossing 10: make a ten, use a ten (Plusquito, Minustaur).
5. ★ Doubles and near doubles (Doublet).
6. ★ The equal sign: true or false, fix it, missing numbers (the Equal Twins, Quizard).
7. ★ Compare two-digit numbers with < = > (Chompers).
8. ★ Add and subtract tens; 10 more, 10 less (Haberhasher visits, or Plusquito).
9. ★ Two-digit plus one-digit, then two-digit plus two-digit, with and without regrouping (*moved* from the Mines' first levels).
10. ★ Shapes: what makes a shape; halves and fourths (*shapes batch*, Polly-Gon).
11. ★ Time to the hour and half hour (Tick-Tockus).
12. ★ Coin values (*new in the Hall*: Trollar visits with "each coin").
13. Count by 5s (Slimelipsis).

**The Crystal Mines (2nd)** (i-Ready lesson numbers)
1. ★ Review: fluency within 20, the Hall's facts (lessons 1–2; *new* as review).
2. ★ Two-digit add and subtract, then with regrouping (6–8; Haberhasher, Margot-Rythm).
3. ★ Money: counting coins, then bills, then bills and coins (10; Trollar).
4. Time to 5 minutes (11; Tick-Tockus).
5. ★ Three-digit place value: blocks, expanded form, tens in a number (12–13; Haberhasher); count by 5s, 10s and 100s (Slimelipsis).
6. ★ Compare three-digit numbers (14; Chompers).
7. ★ 10 and 100 more or less (15).
8. ★ Add and subtract within 1000 (16–18; Margot-Rythm, Haberhasher).
9. Add up to four two-digit numbers (19; Triceraplus).
10. ★ Shapes and equal shares: halves, thirds, fourths; squares in a rectangle (28–30; *shapes batch*, Polly-Gon).
11. ★ Arrays (31; Squaresquatch).
12. Even and odd; count by 2s (32; Slimelipsis).

**The Tables Tower (3rd)** (the guide gives topics, not lesson numbers; the × before ÷ order is confirmed by the class)
1. Review: add and subtract within 1000 (Margot-Rythm).
2. ★ × 0, 1, 2, 5, 10 (Timesaur, Starbot).
3. ★ × 3, 4, 6; then × 7, 8, 9 (Timesaur).
4. ★ Division: ÷ 1, 2, 5, 10, then 3, 4, 6, then 7, 8, 9 (Divvy), after all of × (the guide's topic list: "Understand the meaning of division" after × 7, 8, 9). **Confirmed** with the class on 2026-11-26: no division yet this year. Today's levels alternate × and ÷ and change to this order with the progression. A player already good at division is carried past it by placement and skipping ahead (§5).
5. ★ × tens (4 × 30); rounding to 10 and 100.
6. ★ Fractions: on a number line, then equal fractions, then **comparing fractions** with < = > (built 2026-11-26: Chompers visiting, and Halfling).
7. Time to the minute, then elapsed time (Tick-Tockus).
8. ★ Area and perimeter.
9. Shapes: quadrilaterals (rhombus, rectangle, square), shapes cut into equal parts as unit fractions (*shapes batch*, Polly-Gon).
10. × and ÷ 11 and 12 (an extra, kept last).

**The gaps, all placed above:**
- the dot flash (K 1; ✅ built 2026-11-26);
- shapes (K 8, 1st 10, 2nd 10, 3rd 9);
- count back from 20 (1st 2);
- two-digit adding moved to 1st (1st 9);
- coin values in the Hall (1st 12);
- the within-20 review (2nd 1);
- comparing fractions (3rd 6; ✅ built 2026-11-26).

Three-digit numbers (2nd 5–9) and four addends are done (PR #111).

**How it would be built:**
- **`PATHS` in wings.js:** one per stratum, listing steps as `{ band, level }` with flags `priority`, `ongoing`, `review`, and the monsters.
- **learn.js:** `openLevel` becomes `openSteps(path, recs, chapter)`: the window of three, the 40% rule, and the chapter limit. `choose` draws only from open steps.
- **wings.js / app.js:** the chapter a player has reached is the number of mega bosses beaten in the stratum (saved with its depths). The boss at each depth is normal, powering up (depths 3–4 of a chapter) or mega (depth 5).
- **runFloors:** fills depth 1 from the newest steps.
- **The stratum-open check:** uses the priority steps.
- **Saved data:** none is lost. Steps are today's levels, so records carry over and a returning player's open steps follow from what they've learned.
- **No dungeon version bump:** runs and depths stay.
- **Tests:** every fact is in exactly one step; every path's steps open in order; no monster appears before its step; and the balance sim per path.
- **Order:** this plan first, then the progression itself, then the remaining gap batches (shapes, comparing fractions, the dot flash, the Hall changes) slotted into their steps.

### 4.4 The Fraction Forge: 4th grade (plan 2026-11-27, M6)

_The fifth stratum, under the Tables Tower. Its curriculum follows the school's 4th grade guide (revised June 2025, aligned with the Missouri Learning Standards): the guide decides what is taught, in what order and how (its models and words); the standards decide what's expected. The school is never named in the repo._

**Theme.** A forge deep under the Tower, where the dungeon's numbers are hammered out: iron plates riveted together, with a faint ember glow in the seams. Fractions are the big new idea of 4th grade and they're what gets forged (a whole hammered into equal parts, parts welded back into wholes); multi-digit multiplication and division are the heavy lifting around them.
- **Wall** (`--wall-forge`, drawn by `design/walls/forge.mjs` like `mines.mjs`): dark iron plates in staggered rows, rivets at their corners, and thin amber seams that glow faintly, toned down to stay calm behind a fight. Amber, never coral-red, so a seam never reads as a button.
- **Palette** (`body[data-stratum="forge"]`): soot and iron, warm-tinted, darker and greyer than the Cellar's browns. Gold and coral stay the accents.
- **The descent**: one more layer under the Tower, with the forge's wall; the fall's timing rule (a little longer for each stratum above, at most 1.5 s) already covers it.

**What's taught, in the guide's order.** The guide's units: number and base ten (identify, write and compare to a million; place value; adding and subtracting fluency; multiplication; division), algebraic thinking (multi-step problems with variables and remainders; factors and multiples; patterns), fractions (equivalence and ordering; building from unit fractions; adding, subtracting and multiplying; decimals), then geometry and measurement. Its **priority standards**: 4.NBT.A.6 (multiply up to four digits by one digit, and two two-digit numbers), 4.NBT.A.7 (quotients and remainders), 4.RA.A.2 (multi-step problems with variables), 4.RA.A.3 (remainders), 4.NF.A.2 (equivalent fractions), 4.NF.A.3 (comparing fractions), 4.NF.B.6 (adding and subtracting like fractions and mixed numbers), 4.NF.B.8 (a fraction times a whole number), 4.GM.A.2 (classifying shapes by sides and angles), 4.GM.B.4 (angles and their measure), 4.GM.C.7 (the four operations with measurement) and 4.GM.C.8 (area and perimeter formulas).

**The band, `fourth`** (5 hearts; fluent at 8 s, plus 1 s a digit as always: 4th grade's answers are long and worked in steps). Every answer is typed, never chosen; every set is a fixed sample with stable keys, recorded on deploy.

| Level | Examples | Answer | Key |
|---|---|---|---|
| Compare to a million | 45,312 ○ 45,231 | < = > keys | `○45312,45231` |
| Round to any place | 4,672 ≈ □ (nearest 100); 38,415 ≈ □ (nearest 10,000) | typed | `≈4672,100` (3rd grade's rounding, any place) |
| Add and subtract to a million | 3,482 + 2,519; 50,206 − 18,437, stacked half the time | typed (ones first when stacked) | `+2519,3482`, `-50206,18437` |
| × 10, 100 and 1000 | 6 × 300, 40 × 70, 8 × 2,000 | typed | `×6,300`, `×40,70` |
| Multiply by one digit ★ | 243 × 6, 1,526 × 4 | typed | `×6,243` |
| Two-digit × two-digit ★ | 27 × 23 | typed | `×23,27` |
| Divide by one digit ★ | 84 ÷ 4, 936 ÷ 3, 1,248 ÷ 6 | typed | `÷936,3` |
| Remainders ★ | 29 ÷ 4 = □ R □ | **two slots**: the quotient, then the remainder | `R29,4` |
| Multi-step and variables ★ | 6 × 4 + 5 = □; n − 15 = 27, n = □; 4 × n = 36 | typed | `E6×4+5`, `En-15=27` |
| Factors and multiples | 72 = 8 × □; 96 = 4 × □ | typed | `F72,8` |
| Prime or composite | 51: prime or composite? | **two big keys, Prime and Composite** (an A or B answer, like true or false) | `P51` |
| Equivalent fractions ★ | 3/4 = □/8, 2/5 = □/10, 4/12 = □/3, 3/10 = □/100 | the hidden numerator, stacked | `/3,4,8` (3rd grade's keys, more denominators) |
| Compare fractions ★ | 2/3 ○ 3/4, 5/8 ○ 1/2, 3/5 ○ 6/10 | < = > keys | `○2/3,3/4` (3rd grade's) |
| Add and subtract fractions ★ | 3/8 + 2/8 = □/8; 7/10 − 4/10; 5/8 = 1/8 + 2/8 + □/8; 2 1/8 + 3/8 = □ □/8; 3 1/3 + 2 2/3 = □ □/3 | the numerator; a mixed number in **two slots** (the whole, then the numerator) | `ƒ3/8+2/8`, `ƒ2 1/8+3/8` |
| A fraction times a whole ★ | 3 × 2/5 = □/5 | the numerator | `ƒ3×2/5` |
| Tenths and hundredths | 0.7 = □/10; 0.47 = □/100; 7/10 = □/100; 3/10 + 4/100 = □/100 | a whole number | `d0.47/100`, `/7,10,100`, `ƒ3/10+4/100` |
| Compare decimals | 0.5 ○ 0.45 | < = > keys | `○0.5,0.45` |
| Angles ★ | an angle on a protractor (to the nearest 10°); 90° = 35° + □°; 180° = 120° + □° | typed | `∠r40`, `∠a90,35` |
| Classify shapes ★ | How many right angles? How many pairs of parallel sides? How many lines of symmetry? (a drawn shape) | typed | `∠R:trap`, `∠P:para`, `∠S:rect` |
| Area and perimeter ★ | a 12 by 7 rectangle's area; a perimeter; Area = 48, one side 6, the other □ | typed | `▭a12,7`, `▭p15,8`, `▭s48,6`, `▭q30,6` |
| Measurement ★ | 3 ft = □ in; 4 hr = □ min; 5 kg = □ g; 3 gal = □ qt; 2 m = □ cm; $4 = □¢ | typed | `u3ft:in` |
| Money with a decimal point ★ (4.GM.C.7) | $3.25 + $1.40 = $□.□□; $5.00 − $3.25 (change); $7.09 = □¢ | two slots, dollars then two-digit cents | `D3.25+1.40`, `D5.00-3.25`, `D7.09:c` |

**The earlier plan against the guide.** §4.1's first row for the Forge was written before the school's 4th grade guide; the guide decides the order now, and the names (the Forge, Quarterjack, Dotty, Boomainder, The Denominator) and §7's answer ideas stay:

| | Earlier plan (§4.1) | The school's guide (this plan) |
|---|---|---|
| Starts with | × 10, 100, 1000 | Numbers to a million: compare, round, place value; then adding and subtracting fluency |
| Multi-digit ± and rounding | after × | before ×, in the base-ten unit |
| Multiplication | 2-digit × 1-digit, then 2-digit × 2-digit | × 10/100/1000, then 1-digit × up to **4 digits** (4.NBT.A.6), then 2-digit × 2-digit |
| Division | only remainders | ÷ by one digit, then remainders (4.NBT.A.7), up to 4-digit dividends |
| Factors (6 × □ = 48) | before remainders | after division, with multi-step problems and variables (4.RA.A.2, new here) |
| Patterns | none | patterns from a rule (Slimelipsis's strand) |
| Fractions | equivalent → add and subtract → × a whole | equivalent → **comparing** (4.NF.A.3, new here) → adding and subtracting, unit fractions → × a whole |
| Decimals | tenths and hundredths, comparing | the same, after fractions |
| Geometry | area and perimeter only | angles and classifying shapes (4.GM.B.4, 4.GM.A.2, new here), then area and perimeter |
| Measurement | none | conversions and the four operations with units (4.GM.C.7, new here), last |
| Priority standards | not marked | marked ★ from the guide |

What changed: the order follows the guide's units; four priority standards the row left out are in (comparing fractions, multi-step problems, angles and shapes, measurement); division by one digit and 4-digit multiplication are added. The guide marks its units "ongoing (see pacing guide)" and the pacing guide isn't at hand, so the path follows the units' order and each unit's topics in order.

**New answer types** (§7.1's plan, kept small):
- **Two slots, generalized** (§4.1's **R** key and §7.1's stacked fraction input, as one mechanism): Tick-Tockus's hour-then-minutes and Trollar's dollars-then-cents become one mechanism, each problem naming its slots. A remainder is "29 ÷ 4 = □ R □": the R is printed between the slots, so no R key is needed, and Hit! reads "Quotient ✓", then "Remainder!" (on a keyboard, R moves on too). A mixed number is "□ □/8", "Whole ✓", then "Numerator!", the stacked fraction input with its denominator given. The voice says "Now the remainder!" and "Now the numerator!" the first two times.
- **Long numbers**: answers up to seven digits (the pad stopped at four), shown with commas from 10,000 (45,312), as the guide writes them. A long problem stays on one line on an iPhone SE.
- **No decimal key yet.** Every decimal problem hides a whole number (0.47 = □/100) or compares (< = >), so a kid never types a point. The **.** key waits for 5th grade, where decimals are added.
- **No slot for the denominator.** Like denominators stay (the size of the pieces doesn't change), so the denominator is shown and the numerator typed; a mixed number types its whole and its numerator. Answers aren't simplified (the guide's 3 1/3 + 2 2/3 = 5 3/3).
- **Damage** stays the answer: a fraction hits for its numerator (its pieces), as in the Tower; a remainder problem for its quotient; a mixed number for its numerator; an angle for its degrees. §7.2's rule (a fraction or decimal answer hits for its value as a percent) waits for the first answer typed as a fraction or a decimal, in 5th grade: every 4th grade answer is a whole number.

**Hints** (the guide's models, never the answer before answering; `scripts/hints.test.mjs` runs every one):
- × 10, 100, 1000: "6 × 3 hundreds is 18 hundreds" (the Tower's tens, a place further).
- × by one digit, and two-digit × two-digit: the **area model** with partial products, the guide's model: 243 × 6 as 200 × 6 + 40 × 6 + 3 × 6; 27 × 23 as four boxes, 20 × 20, 20 × 3, 7 × 20 and 7 × 3. Before answering, the parts but not their total.
- ÷ by one digit: **partial quotients** on the area model with a missing side (936 ÷ 3: 900 ÷ 3, 30 ÷ 3, 6 ÷ 3).
- Remainders: equal groups, as many as fit, and what's left: dots ringed in groups of 4 for small numbers ("How many 4s fit in 29? What's left?"); skip counting by the divisor partway for bigger ones. Never the quotient or the remainder before answering.
- Adding and subtracting multi-digit numbers: the **standard algorithm** (4th grade's), column by column in place-value words ("Ones: 2 + 9 = 11. Write 1, regroup 1 ten."). Before answering, the first columns worked and the rest left "?".
- Comparing big numbers: a place-value chart to the hundred thousands, the place that decides outlined. Rounding: the number line between the two, halfway marked (the Tower's, any place).
- Equivalent fractions: "Multiply the top and the bottom by the same number" (4 × 2 = 8, so 3 × 2 = ?), with fraction bars to twelfths.
- Comparing fractions: fraction bars of the same whole, or "Make the bottoms the same" (2/3 = 8/12, 3/4 = 9/12), or "Compare to 1/2".
- Adding and subtracting fractions: fraction bars, the pieces counted ("Same size pieces: add the tops. 3 + 2 = ?"); mixed numbers "Add the wholes, then the pieces".
- A fraction times a whole: unit fractions over and over, 3 × 2/5 = 2/5 + 2/5 + 2/5.
- Decimals: tenths and hundredths in a place-value chart, and a hundred grid (a tenth is a column of ten).
- Measurement: the guide's **conversion table** (1 ft = 12 in, 2 ft = 24 in, 3 ft = ?), filled partway.
- Area and perimeter: the formulas, A = l × w and P = l + w + l + w, with the rectangle labeled; a missing side as "6 × □ = 48".
- Angles: the protractor's scale counted by tens from 0, partway; a missing angle as a part-part-whole bar (90 = 35 + ?).
- Classifying shapes: each right angle marked with its little square, parallel sides with arrow marks, lines of symmetry dashed, counted partway.
- Multi-step: one step at a time ("First 6 × 4 = 24. Then 24 + 5 = ?"); a variable as its inverse ("n − 15 = 27: 27 + 15 = ?").
- Factors: the area model with a missing side, "8 × □ = 72: how many 8s make 72?".

**The path** (★ priority; the guide's unit order; 5 chapters of 3 or 4 new steps, a mega boss every 5 depths opening the next):

| Chapter | Step | Levels | Monsters |
|---|---|---|---|
| 1 | Review: × and ÷ (review) | the Tower's × and ÷ 0–10 | Timesaur, Divvy |
| 1 | Place value to a million | Compare to a million, Round to any place | Chompers, Haberhasher |
| 1 | Add and subtract to a million | that level | Margot-Rythm |
| 1 | × 10, 100 and 1000 | that level | Timesaur |
| 1 | ★ Multiply by one digit | that level | Timesaur |
| 2 | ★ Two-digit × two-digit | that level | Timesaur |
| 2 | ★ Divide by one digit | that level | **Boomainder**, Divvy |
| 2 | ★ Remainders | that level | **Boomainder** |
| 2 | ★ Multi-step problems | Multi-step and variables | Divvy, Timesaur |
| 2 | Patterns from a rule (Slimelipsis's strand, `patF`; ongoing) | "Add 6": 3, 9, 15, 21, □ | Slimelipsis |
| 3 | Factors, prime or composite | Factors and multiples, Prime or composite | Squaresquatch, Divvy |
| 3 | ★ Equivalent fractions | that level | **Quarterjack** |
| 3 | ★ Compare fractions | that level | **Quarterjack**, Chompers |
| 3 | ★ Add and subtract fractions | that level | **Quarterjack** |
| 4 | ★ A fraction times a whole | that level | **Quarterjack** |
| 4 | Decimals | Tenths and hundredths, Compare decimals | **Dotty**, Chompers |
| 4 | ★ Angles and shapes | Angles, Classify shapes | Polly-Gon |
| 5 | ★ Area and perimeter | that level | Squaresquatch |
| 5 | ★ Measurement | that level | Tick-Tockus |
| 5 | ★ Money with a decimal point | that level | Trollar |

- Factors and multiples, and prime or composite, aren't priority standards, so they're a step of their own after the multi-step problems.
- Patterns from a rule is Slimelipsis's strand, so it never holds up the Legend.
- **Band levels vs strands:** everything the guide's priority standards cover is in the band, so it counts toward the Legend (and toward opening a 5th grade stratum, once there is one); patterns, being one monster's kind, are a strand, as in the Cellar, the Hall and the Mines. Comparing and decimals stay in the band (Chompers asks the band's < = > here, as in the Tower).

**Monsters.** The three planned in §4.1, drawn in the house style (solid and line, reading at 26 px, 72 px and big), each with four looks, and returning ones visiting:
- **Quarterjack (¼)**: a fraction football player, its name a pun on quarterback. A football standing up, in a little gold helmet, its front (where the laces would be) showing each problem's fraction (as Tick-Tockus shows the time asked). Redrawn 2026-11-27: a first drawing, the ¼ itself as a player in pads and a jersey, didn't land. 🏈 *Fourth Down*: every 4th problem on its floor is a fourth down (🏈 by the problem, "Fourth down!"); a right answer on it is a touchdown and hits double. Asks only fractions (equivalent, compare, add and subtract, × a whole).
- **Dotty (.)**: the decimal point, a round little creature sitting on the line like a period, freckled with dots, a bow on top. 🔍 *On the Dot*: answers ending in 0 hit double (7/10 = 70/100). Asks only decimals.
- **Boomainder (R)**: the ghost who haunts the leftovers (§4's notes): a sheet ghost whose body is the R, its leg the R's kick. 👻 *Leftovers*: the remainder hits too (29 ÷ 4 = 7 R 1 hits for 7 + 1). Asks only division, with and without remainders.
- Visiting, as in the other strata: **Timesaur** (× by one and two digits), **Divvy** (÷, multi-step), **Chompers** (comparing big numbers, fractions and decimals: the band's < = >), **Margot-Rythm** (adding and subtracting to a million: regrouping hits double, always stacked), **Haberhasher** (place value and rounding), **Slimelipsis** (patterns from a rule, its strand), **Polly-Gon** (angles and classifying shapes: it asks them as well as its shapes), **Squaresquatch** (area and perimeter: its arrays grown into rectangles) and **Tick-Tockus** (measurement conversions: hours to minutes, and the rest of the guide's tables, which it asks as well as the time).
- No other new monsters: the plan's three cover the guide's new ideas (fractions, decimals, remainders), and geometry and measurement go to the monsters who already teach them.
- Depth-1 floors (the fallback without a path): Timesaur, Boomainder, rescue, Quarterjack, Dotty.

**The boss: The Denominator.** A great iron robot that is a fraction: its head is the numerator (a riveted box with a dark visor band), the fraction bar its wide steel shoulders and arms ending in fists, and its body the denominator box, on piston legs. 🔨 *Heavy Metal*: answers of 1000 or more hit double (the Golem's 10 and the Centipede's 100, a place further). It mixes the Forge's problems, as every boss does.
- **Mega form: The Megaminator** (every 5th depth, powering up on the two before): chrome armor plates, glowing eyes, steam vents, a crown; second trait ⚡ *Overload*: every 4th problem is charged, a miss costs 2 hearts (Minustaur's rule).
- **Legend form: the Golden Denominator** (named like the other Legends, "Golden …"), after mastery (every priority fact at box 4), with the mega trait too.

**Place in the chain and the grade picker.**
- The Forge comes `after` the Tower: it opens when the Tower's boss is beaten and 60% of its priority steps are learned, as every stratum does.
- A **new** player in grade 4 or 5 starts in the Forge, with every stratum above it open (`gradeBand`: 4 and 5 are `fourth`).
- **Players already playing** (progress is locked: no dungeon version bump, no key changes, nothing reset): a grade 4 or 5 player started in the Tower before (`start: "third"`). On load their `start` is raised to `fourth`, so the Forge opens for them, but their current stratum (`band`), depths, stars, chapters and facts don't change: they keep playing the Tower until they tap the Forge on the depth map.
- The grade picker keeps K and 1–5.

**Achievements and clothing.** *Fraction Forge* **Champion** (beat the mega boss that opens the Forge's last chapter) with the Forge's champion badge (an ember-orange rosette with a ¼ emblem), and *Fraction Forge* **Legend** with its golden Legend crown, its band in the Forge's color. Champion of Champions and Legend of Legends count every stratum, the Forge too (an earned one stays earned). Mastery (secret): **Multiplier** (every × by one digit and two digits mastered), **Remainder Ranger** (remainders), **Fraction Smith** (adding, subtracting and times a whole), **Angle Ace** (angles and shapes), **Unit Converter** (measurement).

**Added after the plan (the user's call, 2026-11-27):** prime or composite, as an A or B answer like true or false (two big keys, Prime and Composite; Squaresquatch asks it, its rectangles of squares the hint), in a step with factors (not a priority standard); and money with a decimal point (★ 4.GM.C.7, the four operations with money), typed as dollars and cents in two slots around the printed point, Trollar's. With them the path is 5 chapters.

**Left out, and why:**
- **Data** (frequency tables, line plots, bar and picture graphs, mode and range): reading a graph doesn't fit a quick typed answer in a fight; maybe a picture-graph kind later.
- **Points, lines, segments and rays; naming parallel and perpendicular lines**: naming a figure is multiple choice by nature. Counting right angles and parallel sides in a shape is in.
- **Measuring an angle to the nearest degree**: the protractor is read to the nearest 10° on a phone-sized drawing; single degrees would need a bigger picture.
- **Word problems, and interpreting remainders in context** ("29 kids, 4 to a car: how many cars?"): long text to read, and the voice would carry most of it. The remainder itself is in.
- **Reading and writing numbers in word form**: reading, not math typed on a pad.
- **Multiplicative comparison** ("3 times as many"): word problems; the facts themselves are the multiplication levels.

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
| **New** (never seen) | A **💡 hint button**, as for learning. It never opens by itself (settled 2026-11-27: opening after 3.5 s came too soon); after about 8 s with nothing typed it pulses, and the first few times the voice says "Stuck? Tap the light bulb!". The model (3 + 4 as dots on a ten-frame) appears when tapped. |
| **Learning** (box 1–2) | A **💡 hint button**. The model appears only when tapped. |
| **Review** (box 3–4) | No button. A hint comes back only after a miss. |
| **After any miss** | A **worked example** instead of just the answer, animated and read aloud. 8 + 5 → 8 + 2 = 10, then 10 + 3 = 13. The fact then goes into the **retry queue** and returns 2–4 problems later. |

**First time a new *kind* of problem appears** (Quizard's □, Trollar's coins), the player's captain shows one example. It takes about 10 seconds, is read aloud, can be skipped, and is shown once per player.

**Hints never punish:** no heart lost and full damage. A hinted solve doesn't build the crit streak and doesn't move the fact up a box, so mastery needs solves without help. Grown-ups can set hints to automatic, on tap, or off.

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
| Missing number | A number bond or balance with the □ glowing; a missing addend counts up from the number shown (7 + □ = 15: +3 to 10, +5 to 15) | 1.RA.A.4 |
| Count by 1s and 10s, then 5s, then 2s | Hops on a number line or hundred chart | K.NS.A.1, 1.NS.A.4, 2.RA.B.1 |
| Tell time and elapsed time | The short hand glowing for the hour; the long hand's sweep counted by 5s round the rim from the 12, then the little ticks by 1s; how long and minutes later round one clock in the hour, on an open number line across it (to the next quarter hour, the hour, then on) | 1.GM, 2.GM, 3.GM.B.5–6 |
| Odd and even | Each number's dots in pairs, a dot left over coral; past 20, the ones digit | 2nd grade |
| Coins | Find a coin in a mixed pile, heads and tails ("How many quarters?"); one coin, "How many cents?", with the guide's words ("A dime is small and silver"); then coin pictures with their values ("A nickel is worth five cents"), then counted biggest first | K.GM.B.5 (names), 1.GM.C.9 (values), 2.GM.D.12 (combinations with $ and ¢) |
| Add/subtract within 100 | Open number line with jumps of 10s and 1s, and "10 more, 10 less" | 1.NBT.B, 2.NBT.B |
| Add/subtract within 1000 | Partial sums on a place-value mat (hundreds, tens and ones as flats, rods and cubes: 500 + 130 + 16); taking away each place; counting up on an open number line (to the next ten, hundred, by hundreds, the rest). Never carrying or borrowing | 2.NBT.B.7, 3.NBT.A.2 |
| Compare three-digit numbers | A place-value chart of both: the hundreds first, then the tens, then the ones | 2.NBT.A.4 |
| Add up to four two-digit numbers | Find two whose ones make a ten (23 + 17 = 40), or add the tens, then the ones | 2.NBT.B.7 |
| Multiply | **Arrays** (rows of dots), **turn-around facts** (6 × 4 = 4 × 6), × 2 as a double (8 + 8), × 5 as counting by 5s, × 3 and × 6 as one more group (3 × 7 = 2 × 7 + 7, 6 × 7 = 5 × 7 + 7), × 10 as tens (7 tens is 70), × 11 and × 12 broken apart at 10 (12 × 6 = 60 + 12), **doubling**: × 4 is double × 2 and × 8 is double × 4 (8 × 7 = 28 + 28), **break apart**: 7 × 7 = 7 × 5 + 7 × 2. For ×9, use 9 × 7 = 70 − 7 (not the finger trick) | 2.RA.B.2 (arrays), 3.RA.B.1, 3.RA.C.1 |
| Divide | **Think multiplication**: 32 ÷ 8 → "how many 8s make 32?" | 3.RA.A.5, 3.RA.C.1 |
| Multi-digit × and ÷ | **Area model** (23 × 4 as 20 × 4 + 3 × 4) and partial quotients | 4.NBT.A.6–7 |
| Fractions | Fraction bars, pies and number lines | 3.NF, 4.NF |
| Compare fractions | Two fraction bars of the same whole, lined up: "Same size pieces: more pieces is more", "Same number of pieces: bigger pieces is more" | 3.NF.A.3d |
| Shapes | Drawing: the corners as dots to join, the first sides drawn. Counting sides, corners and equal parts: number each going round from the top, about halfway, then "How many?"; a cube's 3 faces you see and 3 behind; squares in rows, counted on by rows; a unit fraction as one of n equal parts, 1/n | K.GM.A, 1.GM.A, 2.GM.A, 3.G.A |

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

### 6.3 Chests, money and Trollar's shop (planned 2026-11-25)
Replaces the between-floor choice. Clearing a floor still heals 1 heart.

**Built (2026-11-25):** step 1 (math-locked chests, money and the purse) and step 2 (items, the inventory and the 3 quick-use slots, set from the start screen or the pause screen). **Built (2026-11-26):** step 3 (the clothing bag and the wardrobe, chests giving clothing) and step 4 (Trollar's shop). Details as built in CLAUDE.md, "Chests, money, items, clothing and the shop"; the rules in `js/loot.js` and `js/shop.js`.
- As built (steps 3–4): the wardrobe opens from the start screen (👕 by the hero) and the pause screen; mid-run a change shows on the hearts row at once. A chest's clothing is shown on the captain with "Put it on" beside Next. The shop sells the four items and 4 pieces of clothing not owned, new after each run. K prices are one coin (Pie a nickel, Shield and Totem a dime, Magnet and clothing a quarter); older players' are Pie 35¢, Shield 45¢, Magnet 50¢, Totem 60¢ and each piece's price hint (25–99¢). The wallet stays cents; the purse opens as the fewest coins and keeps its actual coins for the visit, so change stays the coins given. Coins go on the counter only while it's short, so at most one coin over. The Pie is drawn now, with a π vented in its crust.
- As built: the Cellar's chests hold one coin, its boss's two; the Hall's 2–50¢; the Mines' and the Tower's 6–75¢; a boss's 40–99¢, so every amount found is under a dollar and its line is recorded. The purse says the coins under a dollar and the total past it.
- The Times Two Totem shows as a gold "×2" rather than the ✖️ emoji, which reads as a thin grey cross.
- An unused Shield, Totem or Magnet still armed when a run ends goes back in the inventory.
- **No automatic refill** (changed after the iPhone test, 2026-11-25; replaces "fills it at the next floor" below): each item is one use. A used slot empties and stays empty; the player fills slots only from 🎒 Items (start screen or pause screen). An empty slot shows as a dim outline with a "+" that opens 🎒 Items. A slot holds one item, so it shows no count; the inventory card shows the counts.

**Math-locked chests.**
- **When:** after the floor's monster is beaten, about 1 floor in 3 has a chest, and every boss does. Never the rescue floor, where freeing the hero is the reward.
- **The lock** is a problem with a padlock drawn round it ("7 + 5"), answered on the number pad like any other.
  - It's a quick win, not a test: a learned fact from the stratum's band, said aloud for a pre-reader.
  - Right: the lock pops and the lid opens with a fanfare.
  - Wrong: the lock jams (a clunk, the fact goes to the retry queue), and the chest tries a second lock. A missed lock never costs anything (no heart, no streak), so a chest is always a happy moment. A second miss leaves it shut until next time.
  - A lock counts as practice: it records the fact like any answer, with no damage.
- **What's inside**, one thing a chest:
  - **Money**, about half the time: a few coins, shown as a pile (`coins.js`), and counted aloud ("Two dimes and three pennies. Twenty-three cents!"). The Cellar's chests hold single coins, the Mines' and the Tower's more.
  - **An item**, about a third of the time.
  - **Clothing**, the rest: always a piece you don't have yet (money instead once you have every piece).

**Money.**
- A kindergartner meets money first in a fight (Trollar's coin problems): until a coin problem is answered right, chests hold items and clothing, and the purse and the shop don't show.
- Kept per player in cents (`wallet`), never lost, not even on a loss.
- Shown as a coin purse: the fewest coins for the amount (quarters, dimes, nickels, pennies; dollar bills past a dollar, §4.1 2nd grade), never just a number, so it's coin practice every time you look.

**Items.** Every item found or bought goes into your inventory, with no limit, kept between runs. **Three quick-use slots** sit by the hearts in a fight: tap one to use it. You fill the slots from the inventory before a run (on the start screen), and when a slot is used, the next of that item from the inventory fills it at the next floor. The voice says what an item does the first time ("The shield blocks one miss!"). Each helps you get to the math and none replaces it:
- 🥧 **Pie:** heals a heart.
- 🛡️ **Shield:** blocks the next miss.
- ✖️ **Times Two Totem:** the next right answer hits double.
- 🧲 **Hero Magnet:** the next right answer with a team hero's digit is a Hero Moment (§8.4).
- Later: √ Shrink Ray (the monster loses a quarter of its HP), 0️⃣ Nullifier (no monster trait this floor), 💡 Hint scroll.

**Clothing.** Hats, glasses, bows and the like from the looks kit (`KIT` in `monsters.js`). A piece from a chest or the shop goes into your clothing bag (no limit). No piece comes twice until you have every piece: a chest picks from the ones you don't have yet, and the shop only sells those. Once you have them all, chests that would hold clothing hold money instead (and later perhaps new colors of pieces you have). You dress your **captain** from it, one piece per spot (head, face, neck), in a wardrobe on the start screen. A hero keeps what they're wearing after they stop being captain, and wears it on the start scene, in fights and in Hero Moments, so the team slowly gets its own looks. Saved per player (`wardrobe`: the bag, and what each hero wears).
- **The art is done (2026-11-25):** 25 pieces to find or buy (12 for the head, 7 for the face, 6 for the neck, a cape among them) and 9 special ones from §14.2 (a Champion badge and a golden Legend crown per stratum, and the Champion of Champions cape), drawn on all ten heroes at their own anchors (`js/clothes.js`, shown in the gallery's Clothing section). Drawn fresh rather than from `KIT`, bolder so they read at hearts-row size. A head piece replaces the hero's own hat (Chef Eight's toque, Twodini's top hat; Sir Fourtress keeps his helmet and a hat sits on it). Worn in the game since steps 3–4 (2026-11-26).

**Trollar's shop.** Trollar keeps a stall by the Sumgeon's door on the start screen, open outside a run.
- Items and clothing with prices in coins, read aloud: "The pie costs thirty-five cents."
- **Paying is the math:** you tap coins in your purse to put them on the counter (tap one on the counter to take it back) until there's enough. The game never pays for you. No dragging: taps are easier for a kindergartner. Trollar gives change if you put down too much ("Here's ten cents back!"). A K player pays with single coins (prices are one coin); a 2nd grader counts mixed coins.
- Prices are set so a few runs buy an item and clothing takes saving up.

**Saved per player:** `wallet` (cents), `items` (the inventory's counts and the 3 quick-use slots), `wardrobe` (what's found and what each hero wears). Each goes in `OWN_KEYS`.

### 6.4 Endless (built 2026-11-27: a stratum after its Legend)
_Settled with the user on 2026-11-27: not a separate high-score mode. Once a stratum's Legend boss is beaten (§14.2), that stratum just keeps going: normal runs, floor by floor, with its bosses, mega bosses every 5 depths, chests and depths, asking the facts the player has already mastered there, so they stay sharp. No Endless Specter, no separate score._
- **When:** a stratum whose Legend is beaten. Nothing new to unlock or enter: the same layer on the depth map, Go deeper as now.
- **What it asks:** the stratum's path facts the player has mastered, mixed across every kind (as the Legend's exam mixes them), weighted to the ones that came due, were slowest or missed most; no new facts, no probing ahead. A miss still sends a fact back to learning, which brings it back as learning until it's mastered again.
- **Why it's needed:** with every fact mastered, the learning engine has little to ask (reviews only come due after a day), so a mastered stratum otherwise runs thin.
- Everything else is as any run: hearts, stars, depth scores, Hero Moments, achievements.
- **Built** (2026-11-27): `endlessKey` in `learn.js` (the seen path facts of the monster's band or strand and kinds; half the problems for facts slipped back to learning; otherwise every kind in turn, weighted 0.2 + struggle², × 3 when due); app.js turns it on for a stratum whose Legend is beaten (`?endless` to try it), with no probing or skipping ahead. The depth map says "🌟 Legend beaten · mastered facts".

### 6.5 Daily Dungeon (maybe, §12: kept as a maybe, 2026-11-27)
- A seeded run that is the same for everyone on the same date: 5 floors, fixed monsters, fixed modifiers such as "Crits from streak 2".
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
- **Picking a captain** (the start screen, the end card's "who leads next", a free pick) the hero says a name line in the quip voice (§8.4) in place of their plain name: "Captain Twodini, reporting for duty!", "…at your service!", "Captain Twodini leads the charge!" or "Make way for Captain Twodini!". The style rotates across all picks, whichever hero, so tapping through the heroes varies; the very first captain a player picks reports for duty. Nothing is said after it.

**The mechanic: your answer summons its digits.** On a correct answer, the digits of the answer burst out of the answer box and attack together. 56 sends the 5 and the 6, and 55 sends two High Fives, who high-five each other first.
- **Rescued digits** appear as their hero, with their own move. Their bonus comes only in a Hero Moment (§8.4): **+25% for each rescued hero in it** (a team-up can have two). Until 2026-11-25 they added 10% to every answer with their digit, which nobody noticed.
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

### 6.7 Speed is for fluency, not pressure
Fast recall is the goal of fact practice, but there is no timer and speed never changes damage. Speed is used for exactly two things (settled 2026-11-25):
- **Judging fluency.** Each fact's answer time is tracked, and a fact counts as fluent only when it's right, unhinted and quick (`fluentTime`, §5.1). Fluency drives placement, skipping ahead and moving a fact up two boxes. An older player in a lower stratum turns easy facts into a fluency workout this way.
- **The ★ all-fast star** on each floor (§6.1): every answer right, quick and without a hint.

No speed medals, clear-time records, speed bonuses, countdowns or comparisons between players.

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
- **Negatives:** damage is the **absolute value**. Fiction: Pirate Cavern's Negasicle and Absolutely are made of "debt," and a negative answer pays it off. The hit animation shows the number flipping sign as it lands.
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
- **The start scene** (built): the start screen isn't a card over the fight. Behind it is the surface: a night sky, a grassy hill with the Sumgeon's arched door, your captain by the door in your chalk color and your rescued team around them. The card's title sits in the sky and its content is a sheet below the hill, so the door and team stay in view.
- **The descent** (built: `js/descent.js`): tapping Enter the dungeon, the start card falls away and, from that same scene, the camera drops past the grass and down through the strata (the depth map's layers, each in its own wall and colors) to the chosen stratum and depth, about 2 s (longer the deeper you start, at most 2.8 s), over a falling rumble and wind. "Now entering the Sumgeon!" slams in as the voice says it, and on landing a whoomp, the stratum's name and "Depth N", then the room fades in. Any tap or key skips it. Go deeper gets a short fall of one depth; reduced motion gets a quick fade with the title.
- **A stratum cleared** should be something really, really big (to design). For now it plays the same fanfare as a floor cleared.
- Monster idle personality: each monster gets a slightly different idle motion. Octoloop sways, Timesaur rotates a few degrees and Divvy's dots orbit.
- Haptics: `navigator.vibrate(15)` on hits and `(40)` on misses where supported, and respect a settings toggle.
- `prefers-reduced-motion` keeps working: no shake, projectiles replaced by fades, no particles.

### 8.4 Hero Moments (built 2026-11-25: js/moments.js, js/slowmo.js, review/moments/)
Now and then, a hero in your answer gets a slow-motion close-up and a quip before it strikes. It's a surprise, so it has to stay rare and never repeat itself.

**When it happens.** Only on a right, unhinted answer that contains the digit of a hero on your team (the captain or a rescued hero), and never in a player's first fight.
- **A chance that builds:** about 8% on each qualifying hit, plus 4% for each qualifying hit without one, and back to 8% after a moment. It never feels due, but never goes long without one. Target: roughly one moment every 2–3 floors, to be tuned by play.
- **A rest after each:** none in the next 6 problems, and at most 2 per floor.
- **A different hero next time,** when the answer has more than one hero's digit.
- **Always on two occasions:** a rescued hero's first answer after joining the team (their debut), and the blow that finishes a boss.
- **Damage:** each rescued hero in a moment adds +25% (§6.6); that's where rescued heroes' bonus now lives. The captain's power hit is unchanged.

**The animation** (about 2 s, like a video editor's jog shuttle):
1. **Wind-down:** the hit starts at normal speed, then time drags to a quarter speed, and the room dims a little.
2. **Close-up:** the hero swells toward the camera, with a slight zoom and blur at the edges.
3. **Freeze:** a beat, with the quip in a speech bubble.
4. **Snap:** time snaps back at double speed, and the hero whips into the monster with their own move (Zeroic fist-first, Nine-ja vanishing and striking from behind; see §6.6), then a screen shake and the damage number.

With reduced motion: no zoom or speed ramp, just the hero, the quip and the hit.

**Sound** (synthesized in `sfx.js`, like the boss roars):
- a tape slowdown: a sweep that drops in pitch through a closing filter;
- a slow double heartbeat under the freeze;
- a reverse-cymbal swell into the snap;
- a whip-whoosh, then a bigger impact;
- and each hero's own sound for their move (§6.6), at the hit: a punch's pow for Zeroic, a pillow fwump for Onesie, a sparkle and a pop from Twodini's hat, a lantern shimmer, a shield clang, a hand-clap smack, a glint's ding, a stomp's boom, a sizzle and a plate clink, a smoke poof and a slash. A team-up plays both heroes' sounds.

**The voice.** Quips are a new kind of line, said in a second Kokoro voice, **`af_bella`**, as Sound Box does for its quips. A different voice means a quip is never taken for an instruction. They're recorded by CI, with their own group on the listen check.

**Quips.** Math-obsessed and in each hero's character, played from a shuffled deck per hero so none repeats until all have been heard:
- **Zeroic (0):** "Zeroic, so heroic!" · "Zero to hero!" · "Times zero? You're done!" · "Nothing can stop me. Literally nothing!"
- **Onesie (1):** "One and done!" · "Times one? Still me!" · "I'm number one. Literally!"
- **Twodini (2):** "Abraca-double!" · "Now you see two, now you don't!" · "Twice the trick!"
- **Threasure Hunter (3):** "X marks the three!" · "Third time's the charm!" · "Treasure comes in threes!"
- **Sir Fourtress (4):** "Four-ward, charge!" · "Two squared, never cornered!" · "Four sides, all defended!"
- **High Five (5):** "Up top!" · "Count by fives, fight by fives!" · "Halfway to ten, all the way to victory!"
- **Sixlock Holmes (6):** "Elementary, my dear divisor!" · "One plus two plus three. A perfect six!" · "I've deduced your weak factor!"
- **Sevenstein (7):** "It's alive! And it's prime!" · "Lucky seven stomp!" · "Six, seven!"
- **Chef Eight (8):** "Bon appe-eight!" · "Two cubed, served hot!" · "Order up: one sizzling eight!"
- **Nine-ja (9):** "Nine lives, zero mercy!" · "Three threes, one strike!" · "Now you see nine…"
- **For the big moments:** "That's your final answer!" on a boss's finishing blow, and "Critical math!" on a moment that lands on the hit that turns crits on.

Respellings for the voice go in `SAY_AS` as usual (Twodini is "Toodini"; check "Bon appe-eight", "Nine-ja" and "Sixlock" on the listen check).

**Team-ups** (built 2026-11-25). Two heroes at once, for two-digit answers.
- **When:** a moment that fires by chance, on an answer with two different team heroes' digits (the captain or rescued), is a team-up half the time instead of a solo moment. It adds no moments: the rarity rules are unchanged. Doubles (33) have one hero, so they stay solo; so do debuts and boss finishes. With three or more digits, two different team heroes are picked.
- **Who's where:** the tens hero on the left, the ones hero on the right, in the answer's digit order.
- **The show:** both heroes swell in side by side under one speech bubble. At the snap they whip out to opposite sides and in again, crossing at the monster, with a second whoosh a beat after the first, and land together with one bigger slam and a bigger shake. With reduced motion: both heroes, the bubble and the hit. Each hero is a little smaller than in a solo close-up, so both fit an iPhone SE side by side.
- **Lines** (in the quip voice, their own group on the listen check). No per-pair lines.
  - From their own shuffled deck (key "team"): "Team-up!" · "Tens and ones, together!" · "Two digits, one strike!" · "Place value power!" · "The sum of us!" · "Better together!" · "Teamwork makes the dream work!"
  - An answer that is exactly one of these numbers says its own line instead: 10 "Perfect ten!" · 12 "A dozen, done!" · 13 "A baker's dozen! Chef Eight would approve!" · 25 "Five squared! High five… times five!" · 36 "Six squared! Elementary!" · 49 "Seven squared! Sevenstein's not even here!" · 64 "Eight squared! Somebody tell Chef Eight!" · 67 "Six, seven!" (Sixlock and Sevenstein; the same line and clip as Sevenstein's quip) · 81 "Nine squared! Nine-ja must be hiding!" ("Nine-ja" is said "Nine-jah" through `SAY_AS`; the "…" reads as a pause as written)
  - A team-up on the hit that turns crits on says "Critical math!", unless its number has a line.

**Collecting.** The Heroes half of Monsters & Heroes shows each hero's quips heard ("Quips: 3 of 5"), a small reason to try different captains.

**Reviewing them** (built with the feature). A grown-up page, `review/moments/` at `/sumgeon/review/moments/`, built like the listen check and the spell check: `noindex`, not linked from the game, and stamped with the deployed commit.
- **Pick and play:** pick a hero, a quip and a monster (in any stratum's colors and wall), then play the whole moment exactly as the game runs it: the same code, sounds and voice clip. **Team-up with** picks a second hero (or None), and the quip menu has the team-up lines; a number's line brings its own pair. A Captain group has the hero's name lines and the shared captain lines.
- **Controls:**
  - **Replay** and **Play all.** Play all runs every hero's quips one after another, like the listen check, then the team-ups: each general line with a sample pair, and each number's line with its own digits; then the captain lines: the five shared ones with sample heroes, and each hero's four name lines.
  - **Step through the frames** (wind-down, close-up, freeze, snap, hit).
  - **Speed:** ½× or 1×.
  - **Reduced motion:** a toggle to see that version.
- **Flags:** **⚑ Something's wrong** flags a moment (the quip's wording, the voice, the timing, the art) with tags and a note. Like the listen check, unflagged ones count as fine, and **Report** copies the flags or opens a GitHub issue.
- **Rarity:** a simulator plays a few hundred runs of answers and shows how often moments come (per floor and per run), and how often each hero and quip comes up, so the 8% + 4% rule can be tuned by feel. It also counts the team-ups, the captain lines and captains' first moments.

**Captain lines** (built 2026-11-25). The hero leading the run gets lines of their own, in the quip voice, with their own group ("Captain lines") on the listen check.
- **In a fight, shared lines only, no names:** a solo moment by chance for the captain is, half the time, one of "Captain's orders!" · "Leading digit, leading the charge!" · "The captain always counts!" · "First in line, first to strike!" · "Power hit, captain style!" (a shuffled deck of their own), and the hero's own quip otherwise. Team-ups, boss finishes, debuts and "Critical math!" keep their own lines.
- **A captain's first moment:** a captain's first qualifying hit with their digit, once past the first fight, is always a moment, with one of the shared lines. Once per captain, so picking a new captain brings a new one. A rescued hero's debut (and a boss finish) comes first on the same hit, and it counts toward the rest and the per-floor cap like a debut.
- **On picking a captain, the name lines** (§6.6): "Captain <name>, reporting for duty!" (the very first captain a player picks), "Captain <name>, at your service!", "Captain <name> leads the charge!", "Make way for Captain <name>!", the style rotating across all picks. The name goes through `SAY_AS` ("Captain Toodini", "Captain Nine-jah").
- Damage is unchanged: the captain's power hit stays as it was.

In the game, `?moments` makes every qualifying hit a moment, for testing, and `?teamup` does too, with every one that can be a team-up a team-up.

---

## 9. Grown-ups' corner: Progress (parents and teachers)

_What players see is Settings → 📈 **Progress**; "grown-ups' corner" is only this section's name._

**No lock, because nothing needs one.** Any gate a kid can't pass, a strong 3rd grader can: a "hard math problem" gate is a puzzle in a math game, and a hold-to-open button is a dare. So, as in Sound Box, **nothing in settings can make progress easier or skip mastery**, and then there's nothing worth guarding:
- **Wings** unlock only through mastery (§4). There's no manual unlock to abuse.
- **Grade/band** only sets the starting Wings and help defaults. Faking a higher grade on a new player just means harder math.
- **Hints and read-aloud** are comfort settings. Hinted solves never count toward mastery (§5.3), so turning hints on is no shortcut.
- **Progress only shows things.** It changes nothing, so it needs no lock either.
- **Destructive actions only ever touch this device.** Removing a player asks for a second tap, and the **Remove button only exists on a device with two or more players**, never for the one playing. A kid's own device, with only them on it, has no delete at all. A shared device (a parent's phone) holds players linked from the kids' devices, so if a sibling removes the other there, their own device still has them and can send them back (§15.2).

**Built (2026-11-26): the Progress tab** (`js/progress.js`, pure data tested in `scripts/progress.test.mjs`; drawn by `progressHTML` in app.js). A fourth Settings tab, for the player playing, only from the start screen (left out from the pause screen, like Players). Read-only.
- **Where they are:** each open stratum (the one being played first and open; the others fold), its path's steps in teaching order under chapter headings: the step's name, ★ for a priority step, "ongoing" and "review" tags, a bar (learned, box 3+, with mastered, box 4, brighter), "12 of 40 learned · 3 mastered · 20 seen", and a state in words: Learned ✓ (70% of its facts learned, the share that counts a skip-ahead tier as known), In progress / Up now (open), or Not started (dimmed, dashed). Above it: "Chapter 2 of 3 · next mega boss at depth 10 (deepest so far: 7)", the next stratum ("42% of 60% learned, and beat the boss", or "open"), and the Legend (locked with the share mastered, open, or beaten).
- **Needs work:** up to 8 most-missed facts (by misses, then miss rate; leaving out the ones since mastered) and up to 8 slow ones (learned, but their average time over `fluentTime`), as chips with "missed 4 of 6" or "6.2 s".
- **Fact maps:** grids of addition (a + b, 0–10 by 0–10), subtraction (laid out like its addition: a row for what's taken away, a column for the answer), times (0–12 × 0–12) and division (a row for the divisor, 1–12, a column for the answer), shown when an open stratum asks them or one has been seen. Turnarounds share a key, so both cells show one record. Every other kind (teen facts like 13 + 4, two- and three-digit ±, coins and money, time, patterns, shapes, fractions, place value, comparing, …) is a list with a bar; tapping one opens its facts as chips.
- **Colors and marks:** not seen (an empty outline), learning (striped coral, lighter with each box 0–2), learned (gold), mastered (bright gold with a ★), fluent (a dot). A legend says so. State is never color alone.
- **A fact's details** (tap a cell or chip): the fact as written ("7 × 8 = 56"), its state and box, times seen and right, average time against its fluent time, and when it was last practised ("2 days ago").
- **Fit:** the 13 × 13 times table fits an iPhone SE at 24 px a cell (with its gap), and scrolls inside its own box on anything narrower, never the page.
- **Accessibility:** the grids are tables with row and column headers and a label per cell ("7 times 8: mastered, fluent"); arrow keys move around a grid, with one cell in the tab order; the details close with × or Escape and give focus back.

**Cut** (decided with the user, 2026-11-26): custom practice (a Practice run of chosen facts), a "take a break" nudge, exporting progress, and Start over (§15.5). No leaderboards against other people and no social features. **Linking devices** (§15) stays planned, as Part B.

---

## 10. Accessibility

- All monsters keep `role="img"` and `aria-label`. Problems and results stay in `aria-live` regions.
- Full keyboard play, as today, extended to the new input keys.
- Color is never the only signal. Crits use text and size as well as coral. Mastery rings use fill amount as well as color.
- Text sizes respect user zoom, with a dyslexia-friendly toggle that switches the body font and adds letter spacing.
- There is no timer (§6.7), so no one is rushed.

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
  - *Done (2026-11-26):* `sw.js` precaches each deployed version's shell (stamped by `stamp.mjs`), the two fonts are self-hosted under `fonts/`, and the whole voice (every sprite, about 97 MB) is saved in the background in the order it's needed (CLAUDE.md "Offline").

---

## 12. Milestones

Each milestone should be playable and shippable on its own. Revised 2026-11-25 for the grade strata (§4.1): the game goes K–5, with a 6th-grade stretch, and ends there.

1. **M1 — Feel and foundations** ✅ (2026-11-23). Split into modules, the storage upgrade plus players (§15.1), Web Audio sound effects, the Start button, `say()` with whole recorded clips for every line in `js/lines.js` on the `sumgeon-audio` Pages project (§13), the projectile attack animation, the monster's counterattack on a miss, and the streak flame.
2. **M2 — Learning engine** ✅ (2026-11-23). Bands with mastery-opened levels, fact records, Leitner selection, the retry queue, and fading hints with the classroom models.
3. **M3 — Wings and the Bestiary** ✅ (2026-11-24). The digit heroes (captain, summon attack, power hit, rescue floors with Lucky Number), the Counting Cellar and the Tables Tower, the Make-Ten Golem and Starbot, monster traits, per-floor stars, and the Monsters & Heroes pages with mastery rings.
4. **M4 — More math, depth and polish** ✅ (2026-11-25). Everything since M3, as the game met its players:
   - **Math:** the Balance Hall (Chompers, the Equal Twins, Judo Judy, who replaced The Unknown); missing numbers (Quizard); coins (Trollar) and two-digit ± (Haberhasher) as strands.
   - **Learning:** placement and skipping ahead for fluent players; hints matched to the school's curriculum guides (§5.3).
   - **Replay:** depth (go deeper, the depth map, the dive), looks for every monster, and a palette and wall per stratum.
   - **Feel:** spell casting (draw the answer), boss roars, and spoken instructions for pre-readers.
   - **Housekeeping:**
     - Settings in tabs;
     - the listen check and the spell check;
     - audio sprites;
     - update checking;
     - the Home Screen icon;
     - the social card.
5. **M5 — Grade strata, K–3** (next; §4.1). One stratum per grade for the kids playing now:
   - ✅ restructure into grade bands with today's monsters, the levels in the school's order, zero facts, make-10 partners, ×0 and ×1, × tens, and monsters moved (2026-11-25; with a stand-in wall, palette and boss for the Mines);
   - ✅ the Crystal Mines' wall, palette and the Centipede (2026-11-25; the wall: blue rock that recedes and red-violet crystals that seem to jut out, by chromostereopsis);
   - the new K–3 monsters: ✅ Pipsqueak (dice sums; the dot flash itself 2026-11-26), Doublet, Triceraplus (three addends), Margot-Rythm, Squaresquatch and Halfling (2026-11-25); ✅ Slimelipsis (patterns, odd and even) and Tick-Tockus (time) in batch 1 (2026-11-26);
   - ✅ batch 2 (2026-11-26): true or false and fix it (the Equal Twins), place value with base-ten blocks (Haberhasher), dollars and cents (Trollar), fractions on a number line (Halfling), and stacked two- and three-digit sums;
   - ✅ three-digit numbers (2026-11-26): adding and subtracting within 1000 (the Mines, and Margot-Rythm visiting the Tower for 3rd grade), comparing three-digit numbers (Chompers in the Mines) and adding up to four two-digit numbers (Triceraplus in the Mines);
   - the 3rd-grade gaps: fractions, rounding, and area and perimeter (✅ as typed whole numbers in step 1; ✅ number lines in batch 2; ✅ comparing fractions, 2026-11-26: Chompers visiting the Tower, and Halfling).
   - ✅ the progression within each stratum (§4.3, 2026-11-26): one path per stratum, a window of three new steps, chapters every 5 depths guarded by mega bosses (powering up on the two depths before, with their second traits and a big chest), monsters arriving as their step opens, the review steps, and the gaps it placed (count back from 20 and coin values in the Hall, two-digit adding moved into the Hall).
   
   - **Every line in an audio sprite** (decided 2026-11-25): convert the remaining single-clip lines (phrases, problems and facts, coins, quips) into small sprites grouped by related text, each well under 25 MiB. A sprite is loaded only when it can be needed (the phrases and names always; a stratum's problem sprites when its run starts) and dropped after, so the decoded audio on a phone stays small; measure it on the iPhone. Once every line is in a sprite, stop deploying the single clips, so the audio host stays well under Cloudflare Pages' limit on files per deployment.
     - *Done (2026-11-25):* every line is in a sprite (`spriteFor` in `lines.js`; about 125 sprites, none over 3 minutes or 1.4 MB), loaded per stratum (`runSprites`) and let go on a change. A sprite is now the clips' bytes joined, held compressed (about 8 KB a second of speech) and decoded a line at a time when it's said, since decoding whole sprites would have held over 100 MB a stratum: about 16 MB is held in a new player's run. Sound check shows it.
     - *Done (2026-11-27):* the single clips aren't deployed any more, only the sprites. A line whose sprite isn't loaded comes from the sprite saved for offline, or else just its bytes are fetched from the sprite with a `Range` request (`js/ranges.js`), falling back to the whole sprite if a browser refuses the range; the listen check plays by ranges too. The build cuts the live clips back out of the live sprites, so it needs no single clips either. The way back is one constant (`DEPLOY_CLIPS` in `build.mjs`). *Still to do:* check the ranged fetch on the iPhone (Safari and the Home Screen app, online and offline) and measure memory there.
   
   A spell reader that handles real handwriting, trained on recorded drawings from the spell check, belongs here too.
6. **M6 — Grade strata, 4–6.** The new answer keys (−, ., R and the stacked fraction input) and fraction, decimal and percent answers hitting for their percent (§7.2), then:
   - the Fraction Forge (planned 2026-11-27, §4.4: it needs only two-slot answers and longer numbers; the **.** and **−** keys and percent damage wait for the Pyramid and the Cavern);
   - the Parenthesis Pyramid (Shoutandcomma with *Unwrap*);
   - Pirate Cavern (the Dread Pi-rate Radian, π).
7. **M7 — Replay.** Hero Moments, the slow-motion hero close-ups with quips in a second voice (§8.4; small enough to build any time). Achievements (§14, revised 2026-11-25: mostly secret, each with coins or an item, shown before the next descent, with spoken and share cards), math-locked chests with money and items (§6.3, built 2026-11-25), then clothing and Trollar's shop. (Endless Descent and Daily Dungeon moved to *Maybe later*, below.)
8. **M8 — Grown-ups' corner and offline.** Progress (built 2026-11-26: Settings → Progress, §9; custom practice and export cut), offline play with saved voice clips (the manifest and Home Screen icon are done), and device linking and sync (§15.2–15.4).
   - *Offline play, done (2026-11-26):* a service worker (`sw.js`) precaches each version's shell, the fonts are self-hosted, and every voice sprite is saved in the background, the ones needed first; Settings → Game says how far it's got (CLAUDE.md "Offline"). *Still to do:* confirm it on the iPhone's Home Screen app (airplane mode after "Offline: ready").


**Built:** **Endless** (§6.4), settled with the user on 2026-11-27: after a stratum's Legend is beaten, that stratum keeps going as normal runs, asking the facts already mastered there.

**Maybe later (enhancements, not planned):** decided with the user on 2026-11-26, and kept a maybe on 2026-11-27:
- **Daily Dungeon** (§6.5): the same seeded run for everyone on a date.
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
- The service worker keeps the voice for offline play: after the first tap the game saves every sprite in the background, the ones it needs first (`saveVoice` in `speech.js`, CLAUDE.md "Offline").
- A **listen check** page (`/review/listen/`, a grown-up tool, `noindex`, not linked from the game) plays every clip with ✓/✗ marks, so mispronunciations get caught by ear instead of guessed.

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

_Revised with the user on 2026-11-25. Sumgeon already rewards play in many ways (stars, depths, Hero Moments, rescued heroes, chests, clothing), so achievements are fewer than in Sound Box, where they were the big reward. They mark two things nothing else does: **learning the math** and **delightful surprises**. The mechanics still copy sound-box-crosswords `js/achievements.js`: worked out from saved progress, never taken away, secrets shown as ???, a spoken card and a share card._

**Built (2026-11-27, in two PRs):** the rules, cards, 🏆 sheet and share card (§14.1), the stratum ones (§14.2), the mastery ones (§14.3), the learning tracks (§14.4) and the surprises (§14.5), with their rewards and syncing (CLAUDE.md's Achievements section).

### 14.1 Rules
- **Computed from progress** (`catalog(state)` with no DOM), and `award()` records newly met ones as `{id: time}`. Earned achievements are **never taken away**, and there are **no daily streaks** to lose.
- **Most are secret:** ??? on the 🏆 sheet until earned, with no hint, and the card says "Secret achievement!". Only the stratum ones (§14.2) show ahead, since they're the long goals. Secrets that count up show "12 of 50" once started.
- **When they're shown: before the next descent.** An achievement earned mid-run is recorded quietly and never interrupts a fight or a floor's end. The next time the player taps Enter the dungeon (or Go deeper), every achievement not yet seen plays first, one card each, then the descent (§8.3) starts. A player who leaves without going back in sees them on the 🏆 sheet, marked new.
- **Every card is read aloud:** "New achievement!" (or "Secret achievement!"), its title, then what it took, in lines of 12 words or fewer, recorded like every other line (their own small sprite, CLAUDE.md's sprite rule).
- **Each comes with a reward:** coins for the wallet, or an item for the inventory (§6.3), shown and said on its card ("You got a shield!"). Stratum Champion and Legend also give a piece of clothing that can't be found or bought (§14.2).
- **Share card:** a PNG of the achievement (app name, emoji, title, what it took, date, the monsters or heroes involved), shared from its card or the 🏆 sheet through the share sheet. It never includes the player's name.

### 14.2 The big ones: each stratum's Champion and Legend, won against its mega and Legend bosses
The strata are deep, so these are the game's biggest moments, with the biggest card (the stratum's wall behind it, a fanfare, the boss and the captain), always shown, never secret. Each is won in a fight, not quietly:
- **The boss** ends every run, as now.
- **The mega boss** (built 2026-11-26 with §4.3) takes its place on every 5th depth (5, 10, 15 …; revised 2026-11-26 with §4.3's chapters, the boss powering up on the two depths before): a bigger, crowned form of the stratum's boss with its own name and line ("Mega Golem!"), more HP, and the boss's trait plus a second one (the Golem's Ten Smash with Second Wind armor, say). The depth map marks those depths with a crown, and the descent says "Mega boss ahead!". Each one beaten gives a big chest (§6.3).
- **The Legend boss** (built 2026-11-26; details in CLAUDE.md) appears once every fact in the stratum's band is mastered (box 4): the next run in that stratum, at any depth, ends with the boss's golden form ("A legend awaits!"). It's a final exam: every kind of problem the stratum asks, weighted to the facts that took longest to learn, no fact twice, with the boss's trait and its mega trait. Lost, it's there again on the next run until it's beaten. Afterwards the boss shows golden in Monsters & Heroes and the stratum's layer on the depth map gets a gold edge.
  - **Built** with these choices: "the stratum's band" is its path's **priority steps** (§4.3: what opens the next stratum, as the band did before the paths), drawn shapes aside (they need a touch screen); "mastered" is box 4, the top box, which already takes right answers spread over days. Once due it's saved as due, so a later slip doesn't take it away. The exam asks every kind the path's own steps ask (time, patterns and shapes too), only facts already seen, a round of every kind before any twice, weighted to the facts with the most misses and the slowest times, never one twice (no retries on its floor). Its HP is a mega boss's, or up to twice that to last about one answer of every kind. Beaten: a big chest, a bigger fanfare, a "Legend!" card with the golden boss on the stratum's wall, gold edges on its layer (the depth map and the descent) and the boss golden in Monsters & Heroes. A Legend at a mega depth counts as that mega boss too. `?legend` tries it.
  - **Built (2026-11-27):** the achievement itself (*Stratum* **Legend**, and Legend of Legends) and its golden crown, read from the saved Legend (`wings[id].legend`); the `legendBeaten` event is still sent, as a hook.

| Achievement | Icon | Earned by | Reward |
|---|---|---|---|
| *Counting Cellar* **Champion** | 🏆 | Beat the mega boss that opens the stratum's last chapter (§4.3) | coins and the stratum's champion badge, worn by the captain (a clothing piece only from here) |
| *Counting Cellar* **Legend** | 🌟 | Beat the stratum's Legend boss (every fact mastered first) | a golden crown for the captain, one per stratum in that stratum's colors |
| **Champion of Champions** / **Legend of Legends** | 👑 / 🌠 | Every stratum open to the player | a cape |

The mega and Legend forms are looks of the four bosses (new art and lines, no new monsters): Make-Ten Golem, Judo Judy, The Centipede and Sigma Rex, and each later stratum's boss.

**The mega forms are in the game** (2026-11-26, §4.3: every 5th depth, with their second traits working and a big chest), **and so are the Legend forms** (2026-11-26, after mastery, with the mega trait too) (`BOSS_FORMS` in `monsters.js`, shown on the gallery page; names, beaten and won lines recorded in the "bosses" sprite):

| Boss | Mega form (every 5th depth) | Its second trait (built) | Legend form (after mastery, built) |
|---|---|---|---|
| Make-Ten Golem | **Mega-Ten Golem**: crystal armor, its whole ten-frame lit gold, a crown | 👑 Second wind (Sigma Rex's): armors up at half HP | **Golden Golem**, smiling |
| Judo Judy | **Mega Judy**: a power burst, the black belt glowing gold, fierce brows, a crown | ⚡ Black Belt (new): every 4th problem is a big throw, a miss costs 2 hearts | **Golden Judy** |
| The Centipede | **The Megapede**: twelve rods, crystal spikes inside its curl, a crown | 🐛 Curl Up (new): at half HP it curls into a ring, hits under 20 do half damage | **Golden Centipede** |
| Sigma Rex | **Mega Sigma Rex**: a thicker Σ, a mane of Σ tufts, a gold crown | 🥋 Flip (Judo Judy's): flips times facts, same answer | **Golden Sigma Rex** |

Beaten lines: "Mega-Ten Golem crumbles into a hundred tidy pebbles.", "Mega Judy bows low and hands over the black belt.", "The Megapede drops its crystals and scuttles off.", "Mega Sigma Rex roars once more, then sums to zero."; "Golden Golem shines, bows, and crumbles into gold dust.", "Golden Judy bows to a true math master.", "Golden Centipede waves a hundred golden legs goodbye.", "Golden Sigma Rex bows to the new ruler of the Tower." Built with the mega bosses: the second traits' rules and lines, and "Mega boss ahead!". Built with the Legend: "A legend awaits!" and "Legend!".

### 14.3 Mastery (secret)
_Built 2026-11-27. Each kind's facts are fixed sets from the band pools (achievements.js `MASTERY`); coins, time, patterns and shapes count any one stratum's strand, so each grade can earn them; drawn shapes are left out. Rewards: a Times Two Totem per table and for doubles, a pie for Make-Ten and fractions, a shield for bonds and shapes, a Hero Magnet for patterns and area, 50¢ for coins, time and rounding. The stratum ones: Champion a badge and 50¢, Legend a crown and 99¢, Champion of Champions the cape and 99¢ (needing all four strata), Legend of Legends two of every item._
One per kind of math, earned when every fact of it is mastered. They come up as the learning engine fills in, so they're a surprise: "Secret achievement! Table Master: the 7s!"
- **Table Master ×N** 🧮, one per table (×0 to ×12, in the Tower's teaching order).
- **Make-Ten Master** 🔟, **Doubles Master** 👯, **Number Bonds** 🔗 (K and 1st).
- **Coin Counter** 🪙 (the coin strands), **Time Teller** 🕒, **Pattern Finder** 🫧, **Shape Spotter** 🔷 (the shape strands).
- **Fraction Finder** ½, **Rounder** 🎯, **Area Ace** ▭ (3rd).

### 14.4 Learning tracks (secret, counting up once started)
_Built 2026-11-27. Fluent facts are counted from the fact records (learned and quick on average), comebacks are a missed fact later right without a hint (a tally), practice days a set of local dates (a union, the earliest 100), the depth track the deepest depth opened. Rewards are items, a whole set at each track's top. The sheet lists a track's earned tiers and its next one, ??? with its count once started, named once a tier is earned._
| Track | Tiers | Story |
|---|---|---|
| Fluent facts, known by heart: right, unhinted and quick (25, 100, 250, 500, 1000) | 🔋 Charged Up → ⚡ Quick Spark → 🌩️ Thunderclap → 🌪️ Whirlwind → ☄️ Lightning Legend | Fluency, for any player in any stratum |
| Comebacks, a missed fact later right first try (1, 5, 10, 25, 50) | 🌧️ Through the Rain → 🌦️ Clearing Up → 🌈 Rainbow After → ☀️ Sunny Side → 🦅 Soaring | Weather clearing, for bouncing back |
| Practice days (1, 3, 7, 14, 30, 60, 100), never a streak | 🕯️ First Torch → 🗝️ Key Finder → 🚪 Door Opener → 🪜 Deeper Down → 🏰 Castle Keeper → 🐉 Dragon's Den → 👑 Dungeon Royalty | Going deeper into the dungeon |
| Spelunking: deepest depth reached (10, 25, 50, 100) | 🔦 Cave Crawler → ⛏️ Deep Delver → 🦇 Bat Cave → 🌋 Core Explorer | Down past where the voice counts, caving rather than diving (renamed 2026-11-27; the ids `deep:<n>` unchanged) |

### 14.5 Surprises (secret)
_Built 2026-11-27. The ones seen in play are recorded as they happen (no event map: straight into earned); Piggy Bank and Every Quip are worked out from the state. Palindromes count from two digits (44), since a kindergartner's answers rarely reach three. Double High Five is any team hero's digit twice in the answer, not only 5s. Lucky Seven is the finishing hit of the win that frees the cursed 7. Rewards are items._
- 🎯 **Exactly Zero**: the finishing hit leaves the monster at exactly 0 HP.
- 🪞 **Palindrome**: an answer that reads the same backward, like 121.
- 💯 **Triple Digits**: a single hit of 100 or more.
- 👀 **Seeing Double**: two of the same hero at once, like 55 or 77 (it was Double High Five, which only fit 55; same id).
- 🎆 **All Hands**: an answer of three or more digits where every digit is a rescued hero.
- 7️⃣ **Lucky Seven**: break Sevenstein's curse with an answer containing a 7.
- 🧊 **Ice Cold Boss**: beat a boss without losing a heart.
- ♻️ **Never Gave Up**: win a floor while on your last heart.
- 🪙 **Exact Change**: pay Trollar with no change back.
- 🐷 **Piggy Bank**: a whole dollar in the purse at once.
- 💬 **Quip Fan**: heard all of one hero's quips (it was called Every Quip at first; same id).
- 🎙️ **Every Quip**: heard every quip of all ten heroes, a long goal counting up on the sheet ("Heroes heard in full: 3 of 10"); one of every item.
- 🦃 **Gobble Gobble** / ⛄ **Snow Much Fun** / 🏖️ **Summer Sums**: holiday play, reusing Sound Box's `holidaysOn` dates.

### 14.6 Left out (they repeat something the game already shows)
Flawless floors (the ★ for no hearts lost), monsters met and heroes rescued (Monsters & Heroes fills up), total damage (a number with no learning behind it), and Monster Watcher, Show-Off and Weekend Warrior (filler).

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

_Built 2026-11-26 (CLAUDE.md "Linking and sync"): linking, sealing, merging and the `sumgeon-sync` Worker, deliberately lazy and with low caps (3 new players a day per network, 50 in all, 10 MB stored, 32 KB a record, 60 requests a minute per network), since it shares the Cloudflare account's free plan with Sound Box. Start over (§15.5) was cut; removing a player stays local._

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

### 15.5 Start over (cut, 2026-11-26)
_Cut with the rest of the grown-ups' corner's tools (§9); kept here as it was planned._ Start over sat in Settings and asks the grown-up to type "start over", as in Sound Box. It clears the player's progress in the current band and **unlinks** the player, so the erased data can't sync back. Other devices keep the shared player.

---

## 16. Decisions and open questions

**Decided (2026-11-23)**
- **Hearts for Sprout:** yes. Kindergarten-age players can handle losing a run. Sprout gets 7 hearts.
- **Multiple choice:** no, in any band. Answers are always typed.
- **Names checked against existing characters (2026-11-23):** Numberjacks (BBC) has digits 0–9 as heroes vs. villains, but our names, looks and summon mechanic are our own. The 0 hero is **Zeroic**, not "Hero Zero" (too close to the classroom tradition and picture book *Zero the Hero*). The 8 hero is **Chef Eight**, not a tentacle superhero (too close to Numberblocks' Octoblock). The old Pirate Cove boss was **Dread Pirate Radius**, not Captain Circumference (the *Sir Cumference* books use the same pun); Pirate Cavern's boss is now **Dread Pi-rate Radian** (π). The negatives monster is **Negasicle**.
- **Hints follow the Missouri Learning Standards** and the models and words local curricula use (§5.3). Missouri doesn't name a method, so hints show strategy models, and a "For grown-ups" note explains each one. Sprout starts at fluency within 5, as the K standard says.
- **Mastery unlocks Wings** (boss beaten plus over 60% of facts mastered). Grade only sets the starting Wings and help defaults. Lower Wings stay open. Speed only judges fluency and earns the all-fast star, and is never compared across siblings (§4, §6.7).
- **No grown-up lock** (§9): nothing in settings makes progress easier, so there's nothing to guard. Destructive actions only affect the device they're done on. Remove only appears on devices with two or more players, so a kid's own device can't delete anyone, and linked devices can restore a player removed elsewhere.
- **Digit heroes:** the digits 0–9 are the player's heroes and the operators are the monsters. Your captain is your avatar, your answer summons its digits, and one cursed digit is rescued per Wing clear (§6.6).
- **Pre-reader support:** the target pre-reader reads numbers fluently, so only words (instructions, menus, story text) need icons and voice. Problems stay numeric.
- **Voice, achievements, players and linking copy sound-box-crosswords** (§13–15).
- **Sync service:** Sumgeon gets its own `sumgeon-sync` Worker, not Sound Box's.
- **Hosting:** GitHub Pages in the `jbtule` account, served at `tools.tuley.name/sumgeon/` next to Sound Box. Deploy works like Sound Box's: a GitHub Actions workflow (`ci.yml`) runs the check, stamps the site into `_site/` and deploys on push to `main`. The audio clips go to a separate Cloudflare Pages project, and the sync Worker deploys in its own job.

**Open**

- **Speed vs. accuracy** (settled 2026-11-25): speed only judges fluency and earns the ★ all-fast star. There's no timer and no speed bonus (§6.7).
- **Word problems:** Master-band "story" problems would fit the fiction ("The pirate has 3 chests of 12 coins…"), but reading load is high. Consider them later, after read-aloud exists.
- **Classroom use:** players plus linking cover home use and shared devices. A teacher's class view would need accounts or names on a server, which goes against pillar 6, so default to no.
- **Number clips:** record "fifty-six!" for damage callouts on every hit, or only on crits and finishing blows to keep it from getting noisy?

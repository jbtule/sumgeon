// The monsters: data and inline SVG art. No DOM, so the check can run it in Node.
import { clockMonster, TENTACLE } from "./clock.js";
// Art is simple shapes, no fonts: solid() and line() draw a dark outline, then the color,
// then a white sheen gradient.
export const DK='#0c171c';
export const eye=(x,y,r=9)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${DK}" stroke-width="3"/><circle cx="${x+1.5}" cy="${y+1}" r="${r*.45}" fill="${DK}"/>`;
export const defs=`<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
export const solid=(s,c)=>`<g fill="${DK}" stroke="${DK}" stroke-width="9" stroke-linejoin="round">${s}</g><g fill="${c}">${s}</g><g fill="url(#sh)">${s}</g>`;
export const line=(s,c,w)=>`<g fill="none" stroke="${DK}" stroke-width="${w+9}" stroke-linecap="round" stroke-linejoin="round">${s}</g><g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${s}</g><g fill="none" stroke="url(#sh)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
export const foot=(x,y,rx=13)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="7" fill="${DK}"/>`;
export const ds=`stroke="${DK}" stroke-width="4" stroke-linecap="round" fill="none"`;

export const MON=[
 {n:'Plusquito',op:'+',c:'#ff6b5e',hits:3,quip:'buzzes off in a puff of chalk dust.',
  d:c=>`<path d="M92 32 Q84 10 70 12 M108 32 Q116 10 130 12" ${ds}/><circle cx="70" cy="12" r="5" fill="${c}" stroke="${DK}" stroke-width="3"/><circle cx="130" cy="12" r="5" fill="${c}" stroke="${DK}" stroke-width="3"/>${foot(88,174)}${foot(112,174)}`+solid(`<rect x="80" y="28" width="40" height="142" rx="14"/><rect x="28" y="78" width="144" height="40" rx="14"/>`,c)+`<circle cx="24" cy="98" r="11" fill="${c}" stroke="${DK}" stroke-width="4"/><circle cx="176" cy="98" r="11" fill="${c}" stroke="${DK}" stroke-width="4"/>${eye(91,92,8)}${eye(110,92,8)}<path d="M92 106 Q100 113 108 106" ${ds} stroke-width="3"/>`},
 {n:'Minustaur',op:'-',c:'#4f8dff',hits:3,quip:'loses its footing and its horns.',
  d:c=>`<path d="M48 88 Q28 60 42 36 Q52 62 68 86Z M152 88 Q172 60 158 36 Q148 62 132 86Z" fill="#f3efe4" stroke="${DK}" stroke-width="4" stroke-linejoin="round"/><path d="M70 126 V162 M130 126 V162" stroke="${DK}" stroke-width="12" stroke-linecap="round"/>${foot(64,166,15)}${foot(136,166,15)}`+solid(`<rect x="26" y="82" width="148" height="46" rx="18"/>`,c)+`${eye(82,101,9)}${eye(118,101,9)}<path d="M68 88 L93 94 M132 88 L107 94" ${ds}/><circle cx="100" cy="117" r="6" fill="none" stroke="#ffc93c" stroke-width="3"/>`},
 {n:'Sevenstein',op:'mix',c:'#8fe06a',hits:4,quip:'comes unbolted. Six, seven, gone.',
  d:c=>`<rect x="12" y="38" width="20" height="16" rx="3" fill="#b9c4c7" stroke="${DK}" stroke-width="3"/><rect x="168" y="38" width="20" height="16" rx="3" fill="#b9c4c7" stroke="${DK}" stroke-width="3"/>${foot(92,182,17)}`+line(`<path d="M42 46 H158 L96 170"/>`,c,36)+`${eye(76,42,8)}${eye(104,42,8)}<path d="M128 46 l6 4 l6 -4 l6 4" ${ds} stroke-width="3"/><path d="M124 88 L148 98 M130 84 L127 95 M140 88 L137 99" ${ds} stroke-width="3"/>`},
 {n:'Timesaur',op:'×',c:'#ffb22e',hits:4,quip:'multiplies into nothing at all.',
  d:c=>`${foot(36,168,15)}${foot(164,168,15)}<path d="M30 30 l-14 -6 l6 14 M170 30 l14 -6 l-6 14" ${ds}/>`+solid(`<rect x="16" y="82" width="168" height="36" rx="16" transform="rotate(45 100 100)"/><rect x="16" y="82" width="168" height="36" rx="16" transform="rotate(-45 100 100)"/>`,c)+`${eye(89,93,9)}${eye(112,93,9)}<path d="M88 109 L93 116 L98 109 L103 116 L108 109 L113 116" ${ds} stroke-width="3"/>`},
 {n:'Octoloop',op:'mix',c:'#ff7ac8',hits:5,quip:'unloops into a sad little zero.',
  d:c=>line(`<path d="M72 160 q-8 22 -26 20 M90 168 q-2 20 -16 26 M110 168 q2 20 16 26 M128 160 q8 22 26 20"/>`,c,10)+line(`<circle cx="100" cy="62" r="32"/><circle cx="100" cy="128" r="40"/>`,c,24)+`${eye(89,62,9)}${eye(111,62,9)}<path d="M80 122 Q100 148 120 122 Z" fill="${DK}"/><path d="M93 135 Q100 128 107 135 Q100 141 93 135" fill="#ff5a4e"/>`},
 {n:'Divvy',op:'÷',c:'#45d6e6',hits:5,quip:'splits into remainders and flees.',
  d:c=>`${foot(88,186)}${foot(112,186)}`+solid(`<circle cx="100" cy="52" r="30"/><rect x="22" y="96" width="156" height="30" rx="15"/><circle cx="100" cy="158" r="22"/>`,c)+`${eye(89,50,8)}${eye(111,50,8)}<path d="M90 66 Q100 73 110 66" ${ds} stroke-width="3"/><path d="M60 90 l-6 -10 M140 90 l6 -10" ${ds} stroke-width="3"/>`},
 {n:'Sigma Rex',op:'mix',c:'#ffd23c',hits:7,boss:1,quip:'the sum of all fears, summed to zero.',
  d:c=>`<path d="M62 26 L70 2 L85 17 L100 -2 L115 17 L130 2 L138 26 Z" fill="#ff5a4e" stroke="${DK}" stroke-width="4" stroke-linejoin="round"/>${foot(60,180,18)}${foot(140,180,18)}`+line(`<path d="M152 42 H48 L106 104 L48 166 H152"/>`,c,30)+`${eye(74,42,8)}${eye(102,42,8)}<path d="M126 36 L144 42 L126 48" ${ds} stroke-width="3"/><path d="M96 112 l5 11 l5 -11 M108 112 l4 9 l4 -9" fill="#fff" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`},
 {n:'Make-Ten Golem',op:'+',c:'#b9c4c7',hits:6,boss:1,quip:'crumbles into ten tidy pebbles.',
  d:c=>`${foot(70,186,18)}${foot(130,186,18)}`+solid(`<rect x="58" y="148" width="30" height="34" rx="6"/><rect x="112" y="148" width="30" height="34" rx="6"/><rect x="12" y="78" width="26" height="62" rx="8"/><rect x="162" y="78" width="26" height="62" rx="8"/>`,c)+solid(`<rect x="70" y="6" width="60" height="52" rx="10"/>`,c)+solid(`<rect x="40" y="66" width="120" height="82" rx="12"/>`,'#7e8b8e')+[0,1,2,3,4,5,6,7,8,9].map(i=>`<rect x="${47+(i%5)*22}" y="${73+Math.floor(i/5)*36}" width="18" height="30" rx="5" fill="${i<7?c:'#ffc93c'}" stroke="${DK}" stroke-width="3"/>`).join('')+`<rect x="80" y="24" width="14" height="10" rx="3" fill="#ffc93c" stroke="${DK}" stroke-width="3"/><rect x="106" y="24" width="14" height="10" rx="3" fill="#ffc93c" stroke="${DK}" stroke-width="3"/><path d="M86 46 H114" ${ds} stroke-width="3"/><path d="M78 6 L84 -4 L92 6 M108 6 L116 -4 L122 6" fill="#ff5a4e" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`},
 {n:'Quizard',op:'mix',c:'#9b7bff',hits:3,blank:1,quip:'vanishes in a puff of question marks.',
  d:c=>`${foot(100,198,20)}`+line(`<path d="M54 80 Q54 30 100 30 Q148 30 148 72 Q148 104 114 116 Q100 122 100 140"/>`,c,38)+solid(`<circle cx="100" cy="176" r="18"/>`,c)+line(`<path d="M158 96 L188 64"/>`,'#c98a4a',7)+solid(`<circle cx="192" cy="58" r="10"/>`,'#ffc93c')+`${eye(88,30,8)}${eye(112,30,8)}<path d="M94 43 Q100 47 106 43" ${ds}/>`+solid(`<path d="M60 16 L92 -16 L120 12 Z"/>`,'#6a4fd8')+solid(`<ellipse cx="90" cy="14" rx="34" ry="7"/>`,'#6a4fd8')+`<circle cx="86" cy="2" r="3.5" fill="#ffc93c"/><circle cx="100" cy="-4" r="2.5" fill="#ffc93c"/>`},
 {n:'Trollar',op:'¢',c:'#7cc47f',hits:3,quip:'grumbles, pockets his coins and lets you pass.',
  d:c=>`${foot(78,196,16)}${foot(122,196,16)}`+line(`<path d="M100 2 V190"/>`,'#4f8f52',12)+line(`<path d="M148 56 Q142 30 100 30 Q56 30 56 64 Q56 94 100 100 Q144 106 144 138 Q144 172 100 172 Q58 172 52 146"/>`,c,32)+`<path d="M76 18 l-8 -14 l14 8 M124 18 l8 -14 l-14 8" ${ds}/>${eye(88,28,8)}${eye(112,28,8)}<path d="M90 40 Q100 46 110 40" ${ds}/><path d="M91 41 l2 -7 l3 7z M109 41 l-2 -7 l-3 7z" fill="#f3efe4" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`},
 {n:'Haberhasher',op:'mix',c:'#e2a24c',hits:3,quip:'tips his hat and crumbles into tens and ones.',
  d:c=>`${foot(70,190,16)}${foot(122,190,16)}`+line(`<path d="M82 22 L66 180 M136 22 L120 180"/>`,c,24)+line(`<path d="M30 70 H172 M24 132 H166"/>`,c,24)+`${eye(88,66,7)}${eye(112,66,7)}<path d="M94 76 Q100 80 106 76" ${ds}/>`+solid(`<rect x="72" y="-22" width="64" height="44" rx="6"/>`,'#3a4a8c')+`<rect x="72" y="8" width="64" height="9" fill="#ff5a4e"/>`+solid(`<ellipse cx="104" cy="24" rx="50" ry="9"/>`,'#3a4a8c')},
 {n:'Chompers',op:'○',c:'#6cc24a',hits:3,quip:'snaps shut and slinks off to the swamp.',
  d:(c,m)=>chompersArt(c,m&&m.jaw,m&&m.head)},
 {n:'Equal Twins',op:'=',c:'#ff7ac8',hits:4,quip:'agree, for once, to call it even.',
  d:c=>`${foot(74,176,15)}${foot(126,176,15)}`+solid(`<rect x="26" y="50" width="148" height="40" rx="20"/>`,c)+solid(`<rect x="26" y="112" width="148" height="40" rx="20"/>`,'#8ab4ff')+`${eye(86,68,8)}${eye(110,68,8)}<path d="M92 80 Q98 85 104 80" ${ds}/>${eye(90,130,8)}${eye(114,130,8)}<path d="M96 142 Q102 147 108 142" ${ds}/><path d="M150 46 l14 -12 l2 16 z M150 46 l-14 -12 l-2 16 z" fill="#ffc93c" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/><path d="M30 112 Q40 92 70 104 L70 112 Z" fill="#3a4a8c" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`},
 {n:'Starbot',op:'×',c:'#9fb6c9',hits:4,quip:'powers down with a sparkly fizzle.',
  d:c=>`${foot(78,182,16)}${foot(122,182,16)}<path d="M70 168 V178 M130 168 V178" stroke="${DK}" stroke-width="10" stroke-linecap="round"/>`+line(`<path d="M44 108 L22 132 M156 108 L178 132"/>`,c,12)+solid(`<rect x="50" y="86" width="100" height="84" rx="16"/>`,c)+line(`<path d="M100 8 V72 M72 24 L128 56 M128 24 L72 56"/>`,'#ffc93c',16)+`<rect x="66" y="100" width="68" height="44" rx="10" fill="#0c171c"/><circle cx="86" cy="118" r="7" fill="#45d6e6"/><circle cx="114" cy="118" r="7" fill="#45d6e6"/><path d="M88 132 Q100 139 112 132" stroke="#45d6e6" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="100" cy="160" r="4" fill="#ff5a4e"/>`}
];
// The Balance Hall's boss: a judo fighter whose body is a big ⇄ (turnaround arrows) in a white
// gi, with a black belt between the arrows that is a fraction bar. Trait 🥋 Flip (traits.js).
MON.push({n:'Judo Judy',op:'+',sym:'⇄',c:'#ffa94d',hits:6,boss:1,quip:'taps out and bows.',d:(c)=>judy(c)});
// The Crystal Mines' boss. Its art comes from NEW_MON's Centipede, swapped in below; this
// Golem-shaped stand-in is only the fallback.
MON.push({n:'The Centipede',op:'mix',c:'#a78bfa',hits:6,boss:1,quip:'curls up into a hundred pieces.',
  d:(c)=>MON.find((m)=>m.n==='Make-Ten Golem').d(c)});

// Retired monsters: out of the game, kept so the gallery can show them under "Retired". A saved
// bestiary entry for one is simply not listed (bestiary.js roster reads the Wings).
// The Unknown was the Balance Hall's boss (🌀 Shapeshift) until Judo Judy took its place.
export const RETIRED=[
 {n:'The Unknown',op:'mix',sym:'x',stratum:'hall',c:'#7b5cd6',hits:6,boss:1,retired:1,trait:{icon:'🌀',name:'Shapeshift',text:'Switched between comparing and balancing'},quip:'is solved at last.',
  d:c=>`${foot(70,186,18)}${foot(130,186,18)}`+solid(`<path d="M100 10 L176 182 H24 Z"/>`,'#2a2050')+line(`<path d="M46 40 Q130 100 46 166 M154 40 Q70 100 154 166"/>`,c,26)+solid(`<circle cx="100" cy="58" r="22"/>`,'#2a2050')+`<ellipse cx="91" cy="58" rx="6" ry="4" fill="#ffc93c"/><ellipse cx="109" cy="58" rx="6" ry="4" fill="#ffc93c"/>`}
];

// Judo Judy (MON above): a creature whose body is a big ⇄. The top arrow, pointing right, is the
// arms in a white gi sleeve, its head an open hand reaching to grab; the bottom arrow, pointing
// left, is the legs in white gi pants, its head a bare foot sweeping in a throw. Between the two
// arrows the black belt is a fraction bar, knotted in the middle. On top sits a round head with a
// top-knot and a red headband.
function judy(c) {
  const GI = '#f6f3ea', BELT = '#23232b', HAIR = '#3b2a4d';
  return foot(100,186,62)
  // Headband tails flying out behind the head.
  +line(`<path d="M124 22 Q146 12 158 22 M124 26 Q142 32 152 42"/>`,CORAL,7)
  // The bottom arrow (←): the legs. White pants, a cuff, and a foot for the arrowhead.
  +solid(`<rect x="44" y="134" width="148" height="32" rx="14"/>`,GI)
  +solid(`<path d="M60 118 Q62 112 56 114 L10 144 Q4 150 10 156 L56 186 Q62 188 60 182 Z"/>`,c)
  +solid(`<circle cx="15" cy="141" r="6"/><circle cx="24" cy="134" r="6.5"/><circle cx="34" cy="127" r="7"/>`,c)
  +`<path d="M60 134 V166" ${ds} stroke-width="3"/>`
  // The belt between the arrows: a fraction bar, with its knot and two short tails.
  +solid(`<rect x="58" y="112" width="88" height="14" rx="4"/>`,BELT)
  +solid(`<path d="M94 122 L86 146 L95 148 L100 126 Z M106 122 L114 146 L105 148 L100 126 Z"/>`,BELT)
  +solid(`<rect x="90" y="108" width="20" height="22" rx="5"/>`,BELT)
  // The top arrow (→): the arms. A white sleeve with the gi's lapels at the neck, a cuff, and an
  // open hand for the arrowhead.
  +solid(`<rect x="8" y="72" width="148" height="32" rx="14"/>`,GI)
  +solid(`<path d="M140 56 Q138 50 144 52 L190 82 Q196 88 190 94 L144 124 Q138 126 140 120 Z"/>`,c)
  +solid(`<ellipse cx="156" cy="58" rx="8" ry="11" transform="rotate(-30 156 58)"/>`,c)
  +`<path d="M140 72 V104" ${ds} stroke-width="3"/><path d="M160 82 H180 M160 92 H180 M160 102 H172" ${ds} stroke-width="2.5"/>`
  +`<path d="M80 72 L100 96 L120 72 M100 96 V104" ${ds} stroke-width="3"/>`
  // The head: top-knot, face, hair cap, headband.
  +solid(`<circle cx="100" cy="2" r="12"/>`,HAIR)
  +solid(`<circle cx="100" cy="40" r="30"/>`,c)
  +solid(`<path d="M70 38 Q70 10 100 10 Q130 10 130 38 Q115 26 100 26 Q85 26 70 38 Z"/>`,HAIR)
  +solid(`<path d="M70 32 Q100 20 130 32 L130 40 Q100 28 70 40 Z"/>`,CORAL)
  +`<path d="M80 46 L94 50 M120 46 L106 50" ${ds} stroke-width="4"/>${eye(88,55,8)}${eye(112,55,8)}`
  +`<path d="M91 63 Q100 72 109 63 Z" fill="${DK}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="78" cy="63" rx="5.5" ry="3.5" fill="#ff7a6e" opacity=".7"/><ellipse cx="122" cy="63" rx="5.5" ry="3.5" fill="#ff7a6e" opacity=".7"/>`;
}

/* ---------- new monsters, drawn but not in the game yet ----------
   The grade strata's new monsters (DESIGN.md §4.1). Same shape as MON, plus sym (the symbol its
   body is), stratum and trait (the plan, for the gallery page), so they can be reviewed before
   they're wired into wings.js, traits.js and lines.js. Nothing in the game reads NEW_MON.
   Every one drawn so far is in the game now (MON); the list stays for the next ones. */
const CREAM = '#f3efe4', GOLD = '#ffc93c', CORAL = '#ff5a4e';
const thin = (w) => `stroke="${DK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
// Points on a circle, for the Centipede's coil and Tick-Tockus's clock.
const at = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const f1 = (n) => Math.round(n * 10) / 10;
// One slime of Slimelipsis: a round, drippy dome standing on (x, y), scaled by sx and sy.
const slime = (x, y, sx = 1, sy = 1) => `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M-26 -2 C-34 -24 -20 -50 0 -50 C20 -50 34 -24 26 -2 Q18 4 10 1 Q0 5 -10 1 Q-18 4 -26 -2Z"/>`;
// Squaresquatch's square: left, top, right, bottom, leaving room for the ² at its top right.
const SQUATCH = [32, 46, 162, 168];
// The Centipede's body: ten tens rods in a U, from the neck (i 0, up on the left) round the
// bottom to the tail (i 9, up on the right). It curls into a full ring only at half HP.
const CENTI = { cx: 102, cy: 98, r: 60 };
const rodAt = (i) => 194 - i * 23.6;

export const NEW_MON=[
 {n:'The Centipede',op:'mix',sym:'¢ 100',stratum:'mines',c:'#ff7a45',hits:6,boss:1,
  trait:{icon:'🐛',name:'Hundred legs',text:'At half HP it curls up into a ring'},
  quip:'counts its hundred legs and scuttles off.',
  d:c=>{const {cx,cy,r}=CENTI,rods=[],legs=[],tips=[],spine=[];
   for(let i=0;i<10;i++){const a=rodAt(i),[x,y]=at(cx,cy,r,a).map(f1);spine.push(`${x} ${y}`);
    const [ox,oy]=at(cx,cy,r+20,a);
    for(const s of [-1,1]){const [lx,ly]=at(cx,cy,r+36,a+s*7);legs.push(`<path d="M${f1(ox)} ${f1(oy)} L${f1(lx)} ${f1(ly)}"/>`);
     const [qx,qy]=at(lx,ly,5,a);tips.push(`<path transform="rotate(${f1(a+90)} ${f1(qx)} ${f1(qy)})" d="M${f1(qx)} ${f1(qy-6)} l4.5 6 l-4.5 6 l-4.5 -6 Z"/>`);}
    rods.push(`<g transform="rotate(${f1(a)} ${x} ${y})">${solid(`<rect x="${f1(x-23)}" y="${f1(y-9.5)}" width="46" height="19" rx="5"/>`,c)}<path d="${[1,2,3,4,5,6,7,8,9].map((k)=>`M${f1(x-23+k*4.6)} ${f1(y-7.5)} v15`).join(' ')}" stroke="${DK}" stroke-width="1.3" opacity=".42"/></g>`);}
   const [ex,ey]=at(cx,cy,r,rodAt(9)-14).map(f1),[hx,hy]=at(cx,cy,r,rodAt(0)+12).map(f1);
   return line(legs.join(''),DK,1)+`<g fill="#9ef0ff" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round">${tips.join('')}</g>`
   +line(`<path d="M${hx} ${hy} L${spine.join(' L')} L${ex} ${ey}"/>`,'#c4532a',20)+line(`<path d="M${ex} ${ey} l-4 -16 M${ex} ${ey} l12 -10"/>`,'#c4532a',5)
   +rods.join('')
   +line(`<path d="M30 22 Q18 2 4 2 M60 22 Q72 0 88 -2"/>`,'#c4532a',5)+`<g fill="#9ef0ff" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"><path d="M0 -6 l5 8 l-5 8 l-5 -8Z"/><path d="M92 -10 l5 8 l-5 8 l-5 -8Z"/></g>`
   +solid(`<circle cx="46" cy="54" r="34"/>`,c)+solid(`<path d="M10 52 Q10 12 46 12 Q82 12 82 52 Z"/>`,GOLD)
   +`<path d="M55 23 Q46 18 40 25 Q35 32 40 39 Q46 45 55 41 M46 16 V48" ${thin(3.5)} fill="none"/>`
   +`${eye(34,62,9)}${eye(58,62,9)}<path d="M32 78 Q46 88 60 78" ${ds} stroke-width="3"/><path d="M37 81 l2 7 l3 -6 M55 81 l-2 7 l-3 -6" fill="${CREAM}" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`}}
];
// Polly-Gon ("Polly want a…"), the shape monster (js/shapes.js), in every stratum's pool and on
// the Mines' depth-1 floors: a parrot built from shapes a kid can count. A flat-topped hexagon
// body (all six sides showing: the head, wings and tail tuck behind it), a circle head with a
// triangle crest and beak, triangle wings, a fan of long triangle tail feathers, and square feet.
{
  const hex = (cx, cy, r) => [0, 60, 120, 180, 240, 300].map((a) => at(cx, cy, r, a).map(f1).join(' ')).join(' L');
  MON.push(
 {n:'Polly-Gon',op:'◇',sym:'⬡',stratum:'cellar, hall, mines, tower',c:'#3fcf62',hits:3,
  quip:'squawks once for every side and flaps away.',
  d:(c)=>{const RED='#ff4f5e',BLUE='#3d8bff',tri=(p)=>`<path d="M${p} Z"/>`;
   return solid(tri('92 138 L36 186 L54 202')+tri('108 138 L164 186 L146 202'),RED)+solid(tri('100 138 L90 208 L110 208'),GOLD)
   +solid(tri('74 104 L2 52 L26 128'),BLUE)+solid(tri('126 116 L196 140 L150 168'),BLUE)
   +solid(tri('60 100 L20 70 L32 114')+tri('136 122 L176 138 L150 154'),GOLD)
   +line(`<path d="M80 160 V180 M120 160 V180"/>`,'#ffa04a',5)
   +solid(`<rect x="68" y="176" width="22" height="20" rx="3"/><rect x="110" y="176" width="22" height="20" rx="3"/>`,'#ffa04a')
   +`<path d="M75 190 v6 M83 190 v6 M117 190 v6 M125 190 v6" ${ds} stroke-width="2.5"/>`
   +solid(tri('84 26 L74 2 L96 18')+tri('104 18 L118 0 L114 24'),GOLD)+solid(tri('92 18 L96 -6 L106 16'),BLUE)
   +solid(`<circle cx="100" cy="46" r="34"/>`,RED)
   +solid(`<path d="M${hex(100,120,50)} Z"/>`,c)
   +`<ellipse cx="80" cy="56" rx="7" ry="4" fill="#ffb3c8" opacity=".85"/><ellipse cx="120" cy="56" rx="7" ry="4" fill="#ffb3c8" opacity=".85"/>`
   +eye(86,40,11)+eye(114,40,11)
   +solid(tri('89 52 L111 52 L100 72'),GOLD)}});
}
// The new monsters in the game (M5 step 3, DESIGN.md §4.1): their traits are in traits.js, and they
// keep sym and stratum for the gallery.
MON.push(
 {n:'Pipsqueak',op:'+',sym:'⚄',stratum:'cellar',c:'#f6f3ea',hits:3,
  quip:'rolls away with a tiny squeak.',
  // A white die showing five. Two of its pips are eyes, each looking its own way.
  d:c=>{const pip=(x,y,rx=7.5,ry=7.5)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${DK}"/>`;
   const peek=(x,y,dx,dy)=>`<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${DK}" stroke-width="3.5"/><circle cx="${x+dx}" cy="${y+dy}" r="5.5" fill="${DK}"/><circle cx="${x+dx+1.5}" cy="${y+dy-2}" r="1.6" fill="#fff"/>`;
   return `${foot(74,182,13)}${foot(118,182,13)}<path d="M74 160 V176 M118 160 V176" stroke="${DK}" stroke-width="10" stroke-linecap="round"/>`
   +line(`<path d="M46 116 Q30 118 26 134 M164 104 Q180 108 184 124"/>`,c,9)
   +`<path d="M162 146 q14 12 24 2 q6 -6 12 -2" ${ds} stroke-width="4"/>`+solid(`<circle cx="74" cy="38" r="12"/><circle cx="134" cy="38" r="12"/>`,c)+`<circle cx="74" cy="37" r="6" fill="#ffc6de"/><circle cx="134" cy="37" r="6" fill="#ffc6de"/>`
   +solid(`<path d="M144 62 L166 40 V138 L144 160 Z"/>`,'#d9d3c4')+solid(`<path d="M46 62 L68 40 H166 L144 62 Z"/>`,'#ffffff')
   +solid(`<rect x="46" y="62" width="98" height="98" rx="16"/>`,c)
   +pip(106,51,8,4)+pip(151,76,3.5,7)+pip(159,122,3.5,7)
   +pip(124,82)+pip(95,111)+pip(66,140)
   +peek(66,82,3.5,1)+peek(124,140,-3,-3)}},
 {n:'Doublet',op:'mix',sym:'+ +',stratum:'hall',c:'#ffd84d',hits:3,
  quip:'bows twice and skips away.',
  d:c=>{const one=(x)=>solid(`<rect x="${x-17}" y="34" width="34" height="118" rx="15"/>`,c);
   const tie=(x)=>`<path d="M${x} 116 l-12 -7 v14 z M${x} 116 l12 -7 v14 z" fill="${CORAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x}" cy="116" r="4" fill="${CORAL}" stroke="${DK}" stroke-width="3"/>`;
   const face=(x)=>`${eye(x-9,82,8)}${eye(x+9,82,8)}<path d="M${x-7} 96 Q${x} 102 ${x+7} 96" ${ds} stroke-width="3"/>`;
   return `${foot(48,160,13)}${foot(70,160,13)}${foot(130,160,13)}${foot(152,160,13)}`
   // Two whole pluses side by side, a small gap between their arms (2026-11-27: their arms used to
   // meet in clasped hands, which read as a drawing error at game size).
   +solid(`<rect x="21" y="74" width="76" height="30" rx="13"/><rect x="103" y="74" width="76" height="30" rx="13"/>`,c)+one(59)+one(141)
   +face(59)+face(141)+tie(59)+tie(141)}},
 {n:'Triceraplus',op:'Σ',sym:'+ + +',stratum:'hall',c:'#ff9a4a',hits:3,
  quip:'stomps off to find a bigger sum.',
  d:c=>{const plus=(x,y,h,w,r=w/2.4)=>`<rect x="${x-w/2}" y="${y-h}" width="${w}" height="${2*h}" rx="${r}"/><rect x="${x-h}" y="${y-w/2}" width="${2*h}" height="${w}" rx="${r}"/>`;
   return `${foot(114,176,10)}${foot(136,176,10)}${foot(164,176,10)}${foot(190,176,10)}`
   +line(`<path d="M108 100 Q124 116 150 118 Q174 120 182 116 Q198 110 202 92 M124 112 L114 172 M130 114 L136 172 M170 118 L164 172 M176 117 L190 172"/>`,c,9)
   +solid(plus(70,90,52,42,14),c)
   +solid(plus(32,52,13,11,3)+plus(70,22,13,11,3)+plus(108,52,13,11,3),CREAM)
   +`${eye(58,86,10)}${eye(82,86,10)}<path d="M60 104 Q70 112 80 104" ${ds} stroke-width="3"/>`}},
 {n:'Squaresquatch',op:'▦',sym:'²',stratum:'mines',c:'#7f9cff',hits:4,
  quip:'stomps back into the woods, one square at a time.',
  d:c=>{const [x0,y0,x1,y1]=SQUATCH,t=8,n=7,w=(x1-x0)/n,h=(y1-y0)/n,pts=[];
   // A furry square: tufts all along its edges, going round clockwise from the top left.
   for(let i=0;i<n;i++)pts.push(`L${f1(x0+i*w+w/2)} ${y0-t} L${f1(x0+(i+1)*w)} ${y0}`);
   for(let i=0;i<n;i++)pts.push(`L${x1+t} ${f1(y0+i*h+h/2)} L${x1} ${f1(y0+(i+1)*h)}`);
   for(let i=0;i<n;i++)pts.push(`L${f1(x1-i*w-w/2)} ${y1+t} L${f1(x1-(i+1)*w)} ${y1}`);
   for(let i=0;i<n;i++)pts.push(`L${x0-t} ${f1(y1-i*h-h/2)} L${x0} ${f1(y1-(i+1)*h)}`);
   return solid(`<path d="M50 166 h36 v20 q0 8 -8 8 h-32 q-14 0 -14 -10 q0 -12 18 -18 Z M108 166 h36 q18 6 18 18 q0 10 -14 10 h-32 q-8 0 -8 -8 Z"/>`,'#5a6fd0')
   +`<path d="M38 190 v-7 M48 192 v-7 M146 192 v-7 M156 190 v-7" ${ds} stroke-width="2.5"/>`
   +solid(`<path d="M36 96 l-28 52 l9 -1 l-1 10 l9 -6 l4 9 l8 -14 Z M158 96 l28 52 l-9 -1 l1 10 l-9 -6 l-4 9 l-8 -14 Z"/>`,c)
   +solid(`<path d="M${x0} ${y0} ${pts.join(' ')} Z"/>`,c)
   +`<path d="M68 72 Q78 64 90 68 M104 68 Q116 64 126 72" ${ds} stroke-width="5"/>${eye(84,86,9)}${eye(110,86,9)}<ellipse cx="97" cy="99" rx="7" ry="4.5" fill="${DK}"/><path d="M84 108 Q97 116 110 108" ${ds} stroke-width="3"/>`
   +`<path d="M58 134 q4 8 8 0 q4 8 8 0 M118 140 q4 8 8 0 q4 8 8 0 M86 150 q4 8 8 0 q4 8 8 0" ${ds} stroke-width="3" opacity=".35"/>`
   +line(`<path d="M156 12 Q156 -2 171 -2 Q186 -2 186 10 Q186 20 158 38 H190"/>`,'#a9bcff',10)
   +`${eye(166,8,4)}${eye(178,8,4)}`}},
 {n:'Halfling',op:'/',sym:'½',stratum:'tower',c:'#a47dff',hits:4,
  quip:'splits in half and tiptoes home.',
  d:c=>solid(`<ellipse cx="56" cy="186" rx="24" ry="11"/><ellipse cx="150" cy="186" rx="24" ry="11"/>`,'#f2b483')+`<path d="M38 181 q3 -6 6 0 M48 179 q3 -6 6 0 M150 179 q3 -6 6 0 M160 181 q3 -6 6 0" ${ds} stroke-width="2.5"/>`
   +line(`<path d="M60 142 Q60 120 100 120 Q140 120 140 142 Q140 160 64 180 H146"/>`,c,19)
   +line(`<path d="M76 40 L102 22 V82"/>`,c,32)
   +line(`<path d="M86 12 q-6 -14 6 -18 q12 0 6 10 M104 8 q2 -14 14 -12 q8 4 0 12"/>`,'#6b4bc4',6)
   +solid(`<rect x="28" y="90" width="144" height="20" rx="10"/>`,'#6b4bc4')
   +solid(`<circle cx="24" cy="100" r="12"/><circle cx="176" cy="100" r="12"/>`,c)
   +`<rect x="88" y="88" width="26" height="24" rx="5" fill="${GOLD}" stroke="${DK}" stroke-width="3.5"/>`
   +`${eye(93,50,8)}${eye(111,50,8)}<path d="M96 66 Q102 71 108 66" ${ds} stroke-width="3"/>`});
// Margot-Rythm (the Mines, "algorithm"): an old desktop computer, its screen scrolling with code
// (it used to show 27 + 15 and a carried 1, which kids read as a problem to answer). GLYPH and
// glyph() draw digits as strokes in unit coordinates (x, y pairs from 0 to 1), placed in a box.
const GLYPH = { 1: "M.15 .22 L.55 0 L.55 1", 2: "M0 .26 Q0 0 .5 0 Q1 0 1 .3 Q1 .52 0 1 L1 1", 4: "M.72 1 L.72 0 L0 .66 L1 .66",
  5: "M.95 0 L.12 0 L.05 .44 Q.5 .3 .85 .5 Q1.05 .75 .8 .94 Q.4 1.08 0 .86", 7: "M0 0 L1 0 L.35 1", "+": "M0 .5 L1 .5 M.5 0 L.5 1" };
const glyph = (k, x, y, w, h) => { let i = 0; return GLYPH[k].replace(/-?\d*\.?\d+/g, (v) => f1(i++ % 2 ? y + h * v : x + w * v)); };
MON.push(
 {n:'Margot-Rythm',op:'+',sym:'¹+',stratum:'mines',c:'#e6d29e',hits:4,
  quip:'carries the one and shuts down for the night.',
  d:c=>{const SCR='#173a2e',PH='#7dffa0',CAB='#b49a5e',dig=(k,x,y,w=12,h=17)=>`<path d="${glyph(k,x,y,w,h)}"/>`;
   // Drawn a little big, then shrunk to fit the frame with its waving plug and the CRT's back.
   return `<g transform="translate(100 100) scale(.9) translate(-100 -96)">`+line(`<path d="M72 160 Q62 172 74 180 Q84 186 78 192 M128 160 Q138 172 126 180 Q116 186 122 192"/>`,CAB,7)
   +solid(`<rect x="62" y="186" width="30" height="13" rx="4"/><rect x="108" y="186" width="30" height="13" rx="4"/>`,'#5b5f73')
   +line(`<path d="M24 76 Q2 86 12 108 Q20 126 6 136 M176 70 Q200 62 192 40 Q186 24 198 12"/>`,CAB,7)
   +solid(`<rect x="-8" y="134" width="26" height="34" rx="13" transform="rotate(-12 5 151)"/><rect x="186" y="-6" width="24" height="18" rx="4"/>`,'#cbb784')
   +`<path d="M-6 146 L16 141 M5 143 L3 134" ${thin(2.5)} fill="none" transform="rotate(-12 5 151)"/><path d="M192 -6 V-14 M204 -6 V-14" ${thin(4)}/>`
   +solid(`<path d="M50 6 L62 -14 H138 L150 6 Z"/>`,'#cbb784')+`<path d="M80 -8 H120 M84 -2 H116" ${thin(3)}/>`
   +`<path d="M38 118 Q100 130 162 118 L168 142 H32 Z" fill="${DK}"/><path d="M82 138 Q82 126 100 126 Q118 126 118 138 Z" fill="#ff7a8a" stroke="${DK}" stroke-width="3"/>`
   +solid(`<rect x="22" y="-2" width="156" height="126" rx="16"/>`,c)
   +solid(`<path d="M32 138 H168 L182 164 H18 Z"/>`,'#cbb784')
   +[0,1,2,3,4,5,6,7].map(i=>`<rect x="${34+i*17}" y="142" width="13" height="8" rx="2" fill="${CREAM}" stroke="${DK}" stroke-width="2"/>`).join('')
   +[0,1,2,3,4,5,6,7,8].map(i=>`<rect x="${26+i*17}" y="153" width="13" height="7" rx="2" fill="${CREAM}" stroke="${DK}" stroke-width="2"/>`).join('')
   +`<rect x="36" y="8" width="128" height="100" rx="16" fill="${SCR}" stroke="${DK}" stroke-width="4"/>`
   +`<rect x="132" y="112" width="28" height="5" rx="2" fill="${DK}"/><circle cx="42" cy="115" r="4" fill="${PH}" stroke="${DK}" stroke-width="1.5"/>`
   +[[80,3],[120,-3]].map(([x,dx])=>`<path d="M${x-6} 19 H${x-11} V43 H${x-6} M${x+6} 19 H${x+11} V43 H${x+6}" fill="none" stroke="${PH}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="${x+dx-4.5}" y="31" width="9" height="9" rx="1" fill="${PH}"/>`).join('')
   // Its screen scrolls with code: lines of glowing dashes and a cursor, never digits a kid could
   // read as the problem (it used to show 27 + 15 with a carried 1, which read as a sum to answer).
   +`<g stroke="${PH}" stroke-width="4.5" stroke-linecap="round" opacity=".85"><path d="M52 58 H86 M96 58 H112 M122 58 H146 M62 70 H100 M110 70 H132 M62 82 H78 M88 82 H124 M134 82 H146 M52 94 H74"/></g>`
   +`<rect x="82" y="89" width="9" height="11" rx="1.5" fill="${PH}"/></g>`}});
// The Crystal Mines' boss gets its real art: the approved Centipede replaces the stand-in above
// (the Golem's shape), keeping its game data, and leaves NEW_MON, since it's in the game now.
{
  const real = NEW_MON.find((m) => m.n === "The Centipede"), i = MON.findIndex((m) => m.n === "The Centipede");
  if (real && i >= 0) { MON[i] = Object.assign({}, MON[i], { c: real.c, d: real.d, quip: real.quip }); NEW_MON.splice(NEW_MON.indexOf(real), 1); }
}

// Batch 1 of the strands (DESIGN.md §4.1): Tick-Tockus (time, js/clock.js) and Slimelipsis (what
// comes next, js/patterns.js) leave NEW_MON. Tick-Tockus is the prototype's clock with its
// tentacles, showing the time asked (m.at, set by app.js for each problem); the problem's slimes
// are drawn by patterns.js, and Slimelipsis keeps its own drawing here.
MON.push(
 {n:'Tick-Tockus',op:'⌚',sym:'🕒',stratum:'hall, mines, tower',c:TENTACLE,hits:3,
  quip:'runs out of time and wriggles away.',
  d:(c,m)=>clockMonster(c,m&&m.at)},
 {n:'Slimelipsis',op:'…',sym:'…',stratum:'cellar, hall, mines',c:'#3fd6d0',hits:3,
  quip:'slide off one, two, three, leaving a sticky trail.',
  d:c=>{const X=[30,100,170],B=142,face=(x,i)=>`${eye(x-10,B-34,8)}${eye(x+10,B-34,8)}`+(i===1?`<ellipse cx="${x}" cy="${B-19}" rx="4" ry="4.5" fill="${DK}"/>`:`<path d="M${x-7} ${B-20} Q${x} ${B-14} ${x+7} ${B-20}" ${ds} stroke-width="3"/>`);
   return line(`<path d="M-4 ${B+4} Q8 ${B-4} 26 ${B+4} Q48 ${B+12} 70 ${B+4} Q86 ${B-4} 104 ${B+4} Q126 ${B+12} 150 ${B+4}"/>`,'#8eeae4',13)
   +solid(`<path d="M10 ${B+8} q3 10 -1 14 q-5 -4 1 -14z M58 ${B+10} q4 12 -1 17 q-6 -5 1 -17z M128 ${B+10} q3 9 -1 13 q-5 -4 1 -13z"/>`,'#8eeae4')
   +`<path d="M0 ${B+1} h10 M42 ${B+6} h12 M84 ${B+1} h8 M114 ${B+6} h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>`
   +solid(X.map((x)=>slime(x,B,.94,1.06)).join(''),c)
   +X.map(face).join('')
   +X.map((x)=>`<circle cx="${x-14}" cy="${B-47}" r="3.5" fill="#fff" opacity=".7"/>`).join('')}});

// The Fraction Forge's three (4th grade, DESIGN.md §4.4): Quarterjack (¼, fractions), Dotty (.,
// decimals) and Boomainder (R, remainders). Their traits are in traits.js.
MON.push(
 // A jack-in-the-box: a round head cut into quarters, one shaded gold, in a jester's cap with
 // bells, popping up on its spring out of a box with a ♦ on it, white gloves on the rim.
 {n:'Quarterjack',op:'mix',sym:'¼',stratum:'forge',c:'#2ec4a6',hits:3,
  quip:'springs back into the box with a pop.',
  d:c=>`<path d="M100 146 L80 138 L120 128 L80 118 L120 108 L100 100" fill="none" stroke="${DK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 146 L80 138 L120 128 L80 118 L120 108 L100 100" fill="none" stroke="#c9d1d8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
   +solid(`<path d="M48 146 L22 114 L66 104 L92 146 Z"/>`,'#1d8f79')
   +solid(`<rect x="46" y="142" width="108" height="56" rx="7"/>`,c)
   +`<path d="M46 156 H154" stroke="${DK}" stroke-width="3" opacity=".35"/>`
   +solid(`<path d="M100 158 L112 174 L100 190 L88 174 Z"/>`,CORAL)
   +solid(`<ellipse cx="52" cy="142" rx="13" ry="10"/><ellipse cx="148" cy="142" rx="13" ry="10"/>`,CREAM)
   +`<path d="M46 140 v6 M52 139 v7 M142 139 v7 M148 140 v6" ${ds} stroke-width="2.5"/>`
   +solid(`<path d="M66 50 Q46 10 14 18 Q42 30 70 64 Z M134 50 Q154 10 186 18 Q158 30 130 64 Z"/>`,'#9b7bff')
   +solid(`<path d="M100 20 Q90 0 100 -6 Q110 0 100 20 Z"/>`,CORAL)
   +solid(`<circle cx="100" cy="66" r="38"/>`,CREAM)
   +`<path d="M100 28 A38 38 0 0 1 138 66 L100 66 Z" fill="${GOLD}"/><path d="M100 29 V103 M63 66 H137" stroke="${DK}" stroke-width="3" opacity=".55"/>`
   +`<circle cx="100" cy="66" r="38" fill="none" stroke="${DK}" stroke-width="4"/>`
   +solid(`<path d="M60 52 Q100 18 140 52 Q100 34 60 52 Z"/>`,c)
   +solid(`<circle cx="14" cy="18" r="9"/><circle cx="186" cy="18" r="9"/><circle cx="100" cy="-6" r="7"/>`,GOLD)
   +`${eye(86,64,9)}${eye(114,64,9)}<path d="M84 82 Q100 96 116 82" ${ds} stroke-width="3.5"/><ellipse cx="74" cy="80" rx="6" ry="3.5" fill="#ff9ab8" opacity=".85"/><ellipse cx="126" cy="80" rx="6" ry="3.5" fill="#ff9ab8" opacity=".85"/>`},
 // The decimal point: a round little dot sitting on the line like a period, freckled with dots,
 // a bow on top.
 {n:'Dotty',op:'mix',sym:'.',stratum:'forge',c:'#ff6fa8',hits:3,
  quip:'rolls off the line and out of sight.',
  d:c=>line(`<path d="M4 182 H196"/>`,'#c9d1d8',5)
   +line(`<path d="M44 128 Q26 120 22 102 M156 128 Q174 120 178 102"/>`,c,8)
   +`${foot(80,178,14)}${foot(120,178,14)}`
   +solid(`<circle cx="100" cy="116" r="62"/>`,c)
   +[[62,104,5],[70,138,4],[138,96,4.5],[134,142,5],[100,160,4],[150,120,3.5],[54,124,3.5],[118,150,3],[82,150,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#d9467f"/>`).join('')
   +`${eye(84,102,11)}${eye(116,102,11)}<path d="M88 124 Q100 134 112 124" ${ds} stroke-width="3.5"/><ellipse cx="70" cy="120" rx="7" ry="4" fill="#ffd0e2" opacity=".9"/><ellipse cx="130" cy="120" rx="7" ry="4" fill="#ffd0e2" opacity=".9"/>`
   +solid(`<path d="M100 56 L70 40 L72 72 Z M100 56 L130 40 L128 72 Z"/>`,GOLD)+solid(`<circle cx="100" cy="56" r="8"/>`,GOLD)},
 // The ghost who haunts the leftovers: a sheet ghost whose body is an R, the R's bowl its head,
 // its stem a sheet with a wavy hem, its kick the leg, curling into a wisp.
 {n:'Boomainder',op:'R',sym:'R',stratum:'forge',c:'#e4e0ff',hits:4,
  quip:'fades away with nothing left over.',
  d:c=>line(`<path d="M104 100 L156 172 Q166 188 184 180"/>`,c,30)
   +line(`<path d="M46 132 Q26 128 18 110 M82 132 Q96 140 110 132"/>`,c,10)
   +solid(`<path d="M38 22 Q38 12 50 12 H112 Q160 12 160 58 Q160 104 112 104 H86 V178 Q79 192 72 178 Q65 192 58 178 Q51 192 44 178 Q38 190 38 176 Z"/>`,c)
   +`<path d="M44 46 Q46 26 62 20" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>`
   +`<ellipse cx="94" cy="54" rx="9" ry="13" fill="${DK}"/><ellipse cx="124" cy="54" rx="9" ry="13" fill="${DK}"/><circle cx="96" cy="49" r="3" fill="#fff"/><circle cx="126" cy="49" r="3" fill="#fff"/>`
   +`<ellipse cx="110" cy="82" rx="8" ry="9" fill="${DK}"/><ellipse cx="110" cy="85" rx="4.5" ry="4" fill="#ff7a8a"/>`
   +`<ellipse cx="80" cy="72" rx="7" ry="4" fill="#c9b8ff" opacity=".8"/><ellipse cx="140" cy="72" rx="7" ry="4" fill="#c9b8ff" opacity=".8"/>`});
// The Fraction Forge's boss (DESIGN.md §4.4): The Denominator, a great iron robot that is a
// fraction. Its head is the numerator (a riveted box with a dark visor and amber eyes), the
// fraction bar its wide steel shoulders and arms ending in fists, its body the denominator box, on
// piston legs. 🔨 Heavy Metal (traits.js).
const IRON = '#5d6873', EMBER = '#ffb347';
const rivets = (pts) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#dfe5ea" stroke="${DK}" stroke-width="1.8"/>`).join('');
function denominator(c, eyes = EMBER) {
  return `${foot(76,190,17)}${foot(124,190,17)}`
   +solid(`<rect x="68" y="150" width="16" height="36" rx="4"/><rect x="116" y="150" width="16" height="36" rx="4"/>`,IRON)
   +`<path d="M68 166 H84 M116 166 H132" stroke="${DK}" stroke-width="3"/>`
   +solid(`<rect x="50" y="112" width="100" height="46" rx="8"/>`,c)
   +`<rect x="70" y="124" width="60" height="20" rx="5" fill="${IRON}" stroke="${DK}" stroke-width="3"/><path d="M80 130 v8 M92 130 v8 M104 130 v8 M116 130 v8" stroke="${EMBER}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`
   +rivets([[58,120],[142,120],[58,150],[142,150]])
   +solid(`<rect x="90" y="82" width="20" height="16" rx="3"/>`,IRON)
   +solid(`<rect x="10" y="92" width="180" height="18" rx="9"/>`,IRON)
   +solid(`<circle cx="6" cy="101" r="15"/><circle cx="194" cy="101" r="15"/>`,c)
   +`<path d="M0 95 h10 M0 103 h10 M190 95 h10 M190 103 h10" stroke="${DK}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`
   +solid(`<rect x="94" y="8" width="12" height="16" rx="3"/>`,IRON)+solid(`<circle cx="100" cy="6" r="6"/>`,EMBER)
   +solid(`<rect x="60" y="22" width="80" height="60" rx="9"/>`,c)
   +`<rect x="66" y="38" width="68" height="22" rx="7" fill="${DK}"/>`
   +`<rect x="76" y="44" width="16" height="10" rx="4" fill="${eyes}"/><rect x="108" y="44" width="16" height="10" rx="4" fill="${eyes}"/>`
   +`<path d="M80 70 H120" stroke="${DK}" stroke-width="4" stroke-linecap="round"/><path d="M86 66 v8 M100 66 v8 M114 66 v8" stroke="${DK}" stroke-width="2.5"/>`
   +rivets([[67,29],[133,29],[67,76],[133,76]]);
}
MON.push({n:'The Denominator',op:'mix',sym:'▭/▭',stratum:'forge',c:'#8e9aa6',hits:6,boss:1,quip:'clanks to pieces, every piece the same size.',d:(c)=>denominator(c)});

/* ---------- Chompers' jaws ----------
   Chompers' mouth is the < symbol: two jaws hinged at (44, 100). jaw.o is how open they are (1,
   the drawing's <, down to 0, closed flat) and jaw.gap how far apart (24 is "=", the mouth shut as
   two level bars). The head (the eye bump, eye and nostrils, and a look's extras on the head, head)
   rides on the top jaw. The game turns him to face > by mirroring the whole drawing (app.js). */
const CHOMP_ANGLE = 25.1;
export const CHOMP_SHUT = { o: 0, gap: 24 };
export const chompersArt = (c, jaw, head) => {
  const o = jaw && jaw.o != null ? jaw.o : 1, gap = (jaw && jaw.gap) || 0, a = f1(CHOMP_ANGLE * (1 - o));
  const tt = `translate(0 ${-gap}) rotate(${a} 44 100)`, tb = `translate(0 ${gap}) rotate(${-a} 44 100)`;
  const tooth = `fill="#f3efe4" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"`;
  // The legs reach up to the bottom jaw wherever it is, so they stay on as it snaps shut.
  const legY = (x) => f1(100 + gap + (x - 44) * Math.tan(CHOMP_ANGLE * o * Math.PI / 180) + 4);
  return `<path d="M82 ${legY(82)} V150 M128 ${legY(128)} V170" stroke="${DK}" stroke-width="10" stroke-linecap="round"/>${foot(84,154,14)}${foot(130,174,14)}`
  +line(`<path d="M44 100 L172 160" transform="${tb}"/><path d="M44 100 L172 40" transform="${tt}"/>`,c,30)
  // Teeth only while the mouth is open: shut, it's a plain "=".
  +(o > .3 ? `<path transform="${tt}" d="M92 86 l8 12 l6 -16 M120 73 l8 12 l6 -16 M148 60 l8 12 l6 -16" ${tooth}/><path transform="${tb}" d="M92 114 l8 -12 l6 16 M120 127 l8 -12 l6 16 M148 140 l8 -12 l6 16" ${tooth}/>` : '')
  +`<g transform="${tt}">`+solid(`<circle cx="74" cy="72" r="15"/>`,c)+`${eye(76,70,8)}<circle cx="170" cy="38" r="3" fill="${DK}"/><circle cx="162" cy="42" r="3" fill="${DK}"/>${head || ''}</g>`;
};

/* ---------- looks: the same monster with different extras ----------
   Each regular monster has four more looks with alliterative names (Minustaur's Mom, Mighty
   Minustaur). A look is the same drawing plus accessories placed on its face and head, so kids
   always know which symbol it is. Bosses and cursed digits have none. */

// Where each monster's features are, in its 200 × 200 drawing: eyes [x, y, r], the mouth, the top
// of its head (and whether it already wears a hat), its neck, the ground, and the eyelid color.
export const ANCHOR = {
  Plusquito: { eyes: [[91, 92, 8], [110, 92, 8]], mouth: [100, 106], top: [100, 36], neck: [100, 128], ground: 184 },
  Minustaur: { eyes: [[82, 101, 9], [118, 101, 9]], mouth: [100, 116], top: [100, 84], neck: [100, 128], ground: 180 },
  Quizard: { eyes: [[88, 30, 8], [112, 30, 8]], mouth: [100, 44], top: [100, -4], hat: true, neck: [100, 62], ground: 204 },
  Trollar: { eyes: [[88, 28, 8], [112, 28, 8]], mouth: [100, 41], top: [100, 14], neck: [100, 54], ground: 202 },
  Chompers: { eyes: [[76, 70, 8]], mouth: [150, 100], top: [74, 56], neck: [58, 112], ground: 178, jaw: true },
  "Equal Twins": { eyes: [[86, 68, 8], [110, 68, 8]], mouth: [98, 82], top: [100, 50], neck: [100, 100], ground: 182 },
  Timesaur: { eyes: [[89, 93, 9], [112, 93, 9]], mouth: [100, 108], top: [100, 76], neck: [100, 124], ground: 174 },
  Divvy: { eyes: [[89, 50, 8], [111, 50, 8]], mouth: [100, 66], top: [100, 22], neck: [100, 88], ground: 192 },
  Starbot: { eyes: [[86, 118, 7], [114, 118, 7]], mouth: [100, 134], top: [100, 86], neck: [100, 152], ground: 188, lid: DK },
  Haberhasher: { eyes: [[88, 66, 7], [112, 66, 7]], mouth: [100, 78], top: [104, -22], hat: true, neck: [100, 100], ground: 194 },
  // Judo Judy is a boss (no looks); its anchors are here for its art checks. The top is its top-knot.
  "Judo Judy": { eyes: [[88, 55, 8], [112, 55, 8]], mouth: [100, 66], top: [100, -10], hat: true, neck: [100, 74], ground: 190 },
  // The new monsters. Doublet's are its left twin's face, with both twins' eyes; Slimelipsis's
  // are its middle slime's.
  Pipsqueak: { eyes: [[66, 82, 11], [124, 140, 11]], mouth: [95, 126], top: [104, 40], neck: [95, 150], ground: 188 },
  Triceraplus: { eyes: [[58, 86, 10], [82, 86, 10]], mouth: [70, 107], top: [70, 38], neck: [70, 124], ground: 182 },
  Doublet: { eyes: [[50, 82, 8], [68, 82, 8], [132, 82, 8], [150, 82, 8]], mouth: [59, 98], top: [59, 36], neck: [59, 116], ground: 166 },
  // Tick-Tockus's face is the clock, kept clear: its looks wear only things on the case (the top
  // between its bells, the bottom of the case). Its eyes are where its 10 and 2 are, never used.
  "Tick-Tockus": { eyes: [[76, 70, 6], [124, 70, 6]], mouth: [100, 120], top: [100, 26], neck: [100, 162], ground: 190 },
  Slimelipsis: { eyes: [[90, 108, 8], [110, 108, 8]], mouth: [100, 123], top: [100, 88], neck: [100, 134], ground: 150 },
  Squaresquatch: { eyes: [[84, 86, 9], [110, 86, 9]], mouth: [97, 110], top: [97, 40], neck: [97, 124], ground: 196 },
  "The Centipede": { eyes: [[34, 62, 9], [58, 62, 9]], mouth: [46, 82], top: [46, 12], hat: true, neck: [46, 92], ground: 200 },
  Halfling: { eyes: [[93, 50, 8], [111, 50, 8]], mouth: [102, 68], top: [102, 4], neck: [102, 82], ground: 196 },
  // Margot-Rythm's mouth is the gap above its keyboard jaw; its neck is the keyboard.
  "Margot-Rythm": { eyes: [[82, 41, 10], [118, 41, 10]], mouth: [100, 129], top: [100, 1], neck: [100, 148], ground: 193 },
  // The Fraction Forge's three. Quarterjack's top is its cap's band; Dotty's its bow; Boomainder's
  // the top of its R.
  Quarterjack: { eyes: [[86, 64, 9], [114, 64, 9]], mouth: [100, 88], top: [100, 28], hat: true, neck: [100, 106], ground: 198 },
  Dotty: { eyes: [[84, 102, 11], [116, 102, 11]], mouth: [100, 128], top: [100, 58], neck: [100, 150], ground: 182 },
  Boomainder: { eyes: [[94, 54, 9], [124, 54, 9]], mouth: [110, 82], top: [100, 12], neck: [100, 104], ground: 192 },
  // Polly-Gon (NEW_MON): its mouth is the beak, its top the head under the crest.
  "Polly-Gon": { eyes: [[86, 40, 11], [114, 40, 11]], mouth: [100, 62], top: [100, 12], neck: [100, 80], ground: 196 }
};
const st = `stroke="${DK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
// Each accessory: (anchor, color) → SVG drawn over the monster.
const KIT = {
  crown: (a) => `<path d="M${a.top[0] - 22} ${a.top[1] + 2} l-4 -24 l13 11 l13 -18 l13 18 l13 -11 l-4 24 z" fill="#ffc93c" ${st}/><circle cx="${a.top[0]}" cy="${a.top[1] - 8}" r="3" fill="#ff5a4e"/>`,
  bow: (a) => { const x = a.top[0] - 20, y = a.top[1] + 4; return `<path d="M${x} ${y} l-14 -9 l0 18 z M${x} ${y} l14 -9 l0 18 z" fill="#ff7ac8" ${st}/><circle cx="${x}" cy="${y}" r="4.5" fill="#ff7ac8" ${st}/>`; },
  lashes: (a) => a.eyes.map(([x, y, r]) => `<path d="M${x - r * .7} ${y - r * .9} l-4 -5 M${x} ${y - r - 1} l0 -6 M${x + r * .7} ${y - r * .9} l4 -5" ${st}/>`).join(""),
  // Each face's pair of eyes: a cheek outside each (by pair, so two faces, the Twinkle Twins and
  // the Party Twins, each get theirs; it was outside the first eye only, so a second face's left cheek
  // sat on its mouth).
  blush: (a) => a.eyes.map(([x, y, r], i) => `<ellipse cx="${x + (i % 2 ? 1 : -1) * (r + 3)}" cy="${y + r + 4}" rx="6" ry="3.5" fill="#ff7ac8" opacity=".75"/>`).join(""),
  mustache: (a) => { const [x, y] = a.mouth; return `<path d="M${x} ${y - 3} q-8 -6 -16 -1 q-6 4 -10 -2 q2 10 14 8 q8 -1 12 -5 q4 4 12 5 q12 2 14 -8 q-4 6 -10 2 q-8 -5 -16 1 z" fill="#f3efe4" ${st}/>`; },
  glasses: (a) => a.eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="#ffffff22" ${st}/>`).join("") + (a.eyes.length > 1 ? `<path d="M${a.eyes[0][0] + a.eyes[0][2] + 4} ${a.eyes[0][1]} L${a.eyes[1][0] - a.eyes[1][2] - 4} ${a.eyes[1][1]}" ${st}/>` : ""),
  monocle: (a) => { const [x, y, r] = a.eyes[a.eyes.length - 1]; return `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="#ffffff22" stroke="#ffc93c" stroke-width="3"/><path d="M${x + r + 3} ${y + 2} q6 14 -2 26" stroke="#ffc93c" stroke-width="2" fill="none"/>`; },
  sunglasses: (a) => a.eyes.map(([x, y, r]) => `<rect x="${x - r - 4}" y="${y - r + 1}" width="${2 * r + 8}" height="${2 * r - 2}" rx="5" fill="${DK}"/><path d="M${x - r} ${y - r + 5} l5 0" stroke="#ffffff66" stroke-width="2"/>`).join("") + (a.eyes.length > 1 ? `<path d="M${a.eyes[0][0] + a.eyes[0][2] + 4} ${a.eyes[0][1] - 2} L${a.eyes[1][0] - a.eyes[1][2] - 4} ${a.eyes[1][1] - 2}" stroke="${DK}" stroke-width="3"/>` : ""),
  eyepatch: (a) => { const [x, y, r] = a.eyes[0]; return `<path d="M${x - r - 14} ${y - r - 8} L${x + r + 30} ${y - r - 6}" stroke="${DK}" stroke-width="2.5"/><ellipse cx="${x}" cy="${y}" rx="${r + 3}" ry="${r + 2}" fill="${DK}"/>`; },
  bandana: (a) => { const [x, y] = a.top; return `<path d="M${x - 26} ${y + 6} Q${x} ${y - 16} ${x + 26} ${y + 6} Z" fill="#ff5a4e" ${st}/><path d="M${x + 24} ${y + 4} l12 6 l-4 -10 z" fill="#ff5a4e" ${st}/><circle cx="${x - 6}" cy="${y - 2}" r="2" fill="#fff"/><circle cx="${x + 6}" cy="${y - 1}" r="2" fill="#fff"/>`; },
  tophat: (a) => { const [x, y] = a.top; return `<rect x="${x - 15}" y="${y - 30}" width="30" height="30" rx="3" fill="${DK}" ${st}/><rect x="${x - 15}" y="${y - 9}" width="30" height="5" fill="#ff5a4e"/><ellipse cx="${x}" cy="${y}" rx="24" ry="5" fill="${DK}" ${st}/>`; },
  nightcap: (a) => { const [x, y] = a.top; return `<path d="M${x - 22} ${y + 4} Q${x - 6} ${y - 34} ${x + 26} ${y - 22} Q${x + 10} ${y - 10} ${x + 20} ${y + 4} Z" fill="#8ab4ff" ${st}/><circle cx="${x + 28}" cy="${y - 22}" r="6" fill="#f3efe4" ${st}/>`; },
  headband: (a) => { const y = Math.min(...a.eyes.map((e) => e[1] - e[2])) - 7, x0 = Math.min(...a.eyes.map((e) => e[0])) - 22, x1 = Math.max(...a.eyes.map((e) => e[0])) + 22; return `<path d="M${x0} ${y} L${x1} ${y}" stroke="${DK}" stroke-width="10" stroke-linecap="round"/><path d="M${x0} ${y} L${x1} ${y}" stroke="#ff5a4e" stroke-width="6" stroke-linecap="round"/><path d="M${x1} ${y} l10 8 M${x1} ${y} l12 -2" stroke="#ff5a4e" stroke-width="4" stroke-linecap="round"/>`; },
  lids: (a, c) => a.eyes.map(([x, y, r]) => `<path d="M${x - r - 1} ${y} A${r + 1} ${r + 1} 0 0 1 ${x + r + 1} ${y} Z" fill="${a.lid || c}" stroke="${DK}" stroke-width="3"/>`).join("") + `<path d="M${a.eyes[a.eyes.length - 1][0] + 16} ${a.eyes[0][1] - 22} h8 l-8 8 h8" stroke="#f3efe4" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`,
  spiral: (a) => a.eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${DK}" stroke-width="3"/><path d="M${x} ${y} m0 -1 a1.5 1.5 0 1 1 -1.5 1.5 a3.5 3.5 0 1 1 3.5 3.5 a5.5 5.5 0 1 1 -5.5 -5.5" stroke="${DK}" stroke-width="1.6" fill="none"/>`).join(""),
  sparkles: (a) => [[-34, 6, 1], [36, -4, .8], [24, 26, .6]].map(([dx, dy, k]) => { const x = a.top[0] + dx, y = a.top[1] + dy; return `<path d="M${x} ${y - 9 * k} L${x + 2.5 * k} ${y - 2.5 * k} L${x + 9 * k} ${y} L${x + 2.5 * k} ${y + 2.5 * k} L${x} ${y + 9 * k} L${x - 2.5 * k} ${y + 2.5 * k} L${x - 9 * k} ${y} L${x - 2.5 * k} ${y - 2.5 * k} Z" fill="#ffc93c"/>`; }).join(""),
  scarf: (a) => { const [x, y] = a.neck; return `<path d="M${x - 24} ${y - 4} Q${x} ${y + 8} ${x + 24} ${y - 4} L${x + 24} ${y + 4} Q${x} ${y + 16} ${x - 24} ${y + 4} Z" fill="#45d6e6" ${st}/><path d="M${x + 12} ${y + 6} l4 22 l10 -2 l-4 -20" fill="#45d6e6" ${st}/>`; },
  bowtie: (a) => { const [x, y] = a.neck; return `<path d="M${x} ${y} l-14 -8 l0 16 z M${x} ${y} l14 -8 l0 16 z" fill="#ff5a4e" ${st}/><circle cx="${x}" cy="${y}" r="4" fill="#ff5a4e" ${st}/>`; },
  medal: (a) => { const [x, y] = a.neck; return `<path d="M${x - 8} ${y - 12} L${x} ${y + 2} L${x + 8} ${y - 12}" stroke="#ff5a4e" stroke-width="5" fill="none"/><circle cx="${x}" cy="${y + 8}" r="8" fill="#ffc93c" ${st}/>`; }
};
// The looks: [name, accessories, he/she]. "mini" draws the monster smaller. Names are anything
// fun. A look with "he" or "she" gets "his" or "her" in its lines (Minustaur's Mom loses her
// footing); the rest keep the monster's own words.
export const LOOKS = {
  Plusquito: [["Captain Plunderquito", ["bandana", "eyepatch"]], ["Sir Plusington", ["tophat", "monocle"], "he"], ["Plusquito Jr.", ["mini"]], ["Coach Plusquito", ["headband", "sunglasses"]]],
  Minustaur: [["Minustaur's Mom", ["bow", "lashes", "blush"], "she"], ["King Minus", ["crown"], "he"], ["Baby Minustaur", ["mini"]], ["Professor Minustaur", ["mustache", "glasses"]]],
  Quizard: [["The Quizard Queen", ["lashes", "blush", "sparkles"], "she"], ["Quizard of Cool", ["sunglasses"]], ["Snoozard", ["lids"]], ["Professor Quizzle", ["monocle", "mustache"]]],
  Trollar: [["Trollar Jr.", ["mini"]], ["Mr. Moneybags", ["tophat", "monocle"]], ["Bridge Bandit", ["headband", "eyepatch"]], ["Snoozy Trollar", ["nightcap", "lids"]]],
  Chompers: [["King of the Swamp", ["crown", "medal"], "he"], ["Chompette", ["bow", "blush"], "she"], ["Frostbite", ["scarf", "nightcap"]], ["Shades", ["sunglasses"]]],
  "Equal Twins": [["The Fancy Pair", ["bowtie", "monocle"]], ["Party Twins", ["sparkles", "blush"]], ["The Nap Twins", ["lids"]], ["Dizzy Twins", ["spiral"]]],
  Timesaur: [["Timesaur Tot", ["mini"]], ["The Ringmaster", ["tophat"]], ["Karate Kross", ["headband"]], ["Snoozasaur", ["nightcap", "lids"]]],
  Divvy: [["Lord Divington", ["tophat", "bowtie"], "he"], ["Dizzy Divvy", ["spiral"]], ["Captain Split", ["bandana", "eyepatch"]], ["Divvy Belle", ["bow", "lashes"], "she"]],
  Starbot: [["Glitterbot", ["sparkles"]], ["Low Battery", ["lids"]], ["Super Starbot", ["scarf", "medal"]], ["Turbo Starbot", ["headband"]]],
  Haberhasher: [["Jolly Hasher", ["blush", "sparkles"]], ["DJ Hashtag", ["sunglasses"]], ["Sir Hashalot", ["monocle", "mustache"]], ["Snoozehash", ["lids"]]],
  // The grade strata's new monsters (M5 step 3).
  Pipsqueak: [["Lucky Pipsqueak", ["sparkles", "blush"]], ["High Roller", ["tophat", "bowtie"]], ["Teeny Pipsqueak", ["mini"]], ["Sleepy Squeak", ["nightcap", "lids"]]],
  Doublet: [["Double Trouble", ["headband", "sunglasses"]], ["Twinkle Twins", ["sparkles", "blush"]], ["Little Doublet", ["mini"]], ["The Snooze Twins", ["lids"]]],
  Triceraplus: [["Tricera-tot", ["mini"]], ["Captain Triceraplus", ["bandana", "eyepatch"]], ["Queen Triceraplus", ["crown", "lashes"], "she"], ["Triceracool", ["sunglasses"]]],
  Squaresquatch: [["Baby Squatch", ["mini"]], ["Snowsquatch", ["scarf", "nightcap"]], ["Sir Squarington", ["tophat", "monocle"], "he"], ["Disco Squatch", ["sunglasses", "sparkles"]]],
  Halfling: [["Half Pint", ["mini"]], ["Lady Halfling", ["bow", "lashes"], "she"], ["Dizzy Halfling", ["spiral"]], ["Halfling Hero", ["headband", "medal"]]],
  "Margot-Rythm": [["Sleep Mode", ["lids"]], ["Glitchy Margot", ["spiral"]], ["Mini Margot", ["mini"]], ["Margot Plus", ["sunglasses"]]],
  // Batch 1 (time and patterns). Tick-Tockus's extras sit on its case, never its face.
  "Tick-Tockus": [["Tick-Tock Tot", ["mini"]], ["Grandfather Tockus", ["tophat", "bowtie"], "he"], ["Bedtime Tockus", ["nightcap", "scarf"]], ["Cuckoo Tockus", ["bow", "sparkles"]]],
  Slimelipsis: [["Slimelets", ["mini"]], ["Slime Time", ["sunglasses"]], ["Snoozelipsis", ["nightcap", "lids"]], ["Gooey Belle", ["bow", "lashes"], "she"]],
  // The Fraction Forge's. Quarterjack keeps its jester's cap, so no hats.
  Quarterjack: [["Jack Jr.", ["mini"]], ["Jolly Jack", ["blush", "sparkles"]], ["Snoozejack", ["lids"]], ["Cool Jack", ["sunglasses"]]],
  Dotty: [["Tiny Dot", ["mini"]], ["Polka Dotty", ["sparkles", "blush"]], ["Dizzy Dotty", ["spiral"]], ["Dotty in Shades", ["sunglasses", "medal"]]],
  Boomainder: [["Little Boo", ["mini"]], ["Count Boomainder", ["tophat", "monocle"], "he"], ["Sleepy Boo", ["nightcap", "lids"]], ["Boomainder Belle", ["bow", "lashes"], "she"]],
  // Shapes: a pirate's parrot, of course.
  "Polly-Gon": [["Captain Squawkbeard", ["bandana", "eyepatch"], "he"], ["Baby Polly", ["mini"]], ["Queen Polly-Gon", ["crown", "lashes"], "she"], ["Disco Polly", ["sunglasses", "sparkles"]]]
};
// A monster in look i (0 is itself): the same monster, renamed, with its base name kept for its
// trait and kind of math.
export function lookOf(m, i) {
  const l = i && (LOOKS[m.n] || [])[i - 1];
  if (!l) return m;
  const his = l[2] === "she" ? "her" : l[2] === "he" ? "his" : null;
  const quip = his ? m.quip.replace(/\b(its|his|her)\b/g, his) : m.quip;
  return Object.assign({}, m, { n: l[0], base: m.n, look: l[1], quip });
}
export const allLooks = () => MON.flatMap((m) => (LOOKS[m.n] || []).map((_, i) => lookOf(m, i + 1)));
const NECK = ["scarf", "bowtie", "medal"];
function dress(m) {
  const a = ANCHOR[m.base], kit = m.look.filter((k) => KIT[k]);
  // A monster whose head moves (Chompers' top jaw, a.jaw) wears what's on its head on it; what's
  // on its neck stays put.
  const onHead = (k) => a.jaw && !NECK.includes(k), draw = (ks) => ks.map((k) => KIT[k](a, m.c)).join("");
  const art = m.d(m.c, a.jaw ? Object.assign({}, m, { head: draw(kit.filter(onHead)) }) : m), extras = draw(kit.filter((k) => !onHead(k)));
  if (!m.look.includes("mini")) return art + extras;
  // Smaller, standing on the same ground.
  return `<g transform="translate(100 ${a.ground}) scale(.72) translate(-100 ${-a.ground})">${art}${extras}</g>`;
}
export const svg=(m,cls='')=>`<svg viewBox="-10 -10 220 220" class="${cls}" role="img" aria-label="${m.n}">${defs}${m.look ? dress(m) : m.d(m.c, m)}</svg>`;

/* ---------- boss forms: mega and Legend (DESIGN.md §14.2) ----------
   Each boss has two more forms, drawn here as data, both in the game (wings.js bossAt).
   - mega, on every 5th depth (wings.js bossAt): the same boss powered up, crowned, with its own
     name and a second trait (trait2, traits.js), after two depths of powering up (form "power").
   - legend, once every fact in its stratum is mastered (wings.js legendDue): the boss in gold,
     with a warm glow and sparkles, the golden language of the gold-outlined mastery rings.
     Celebratory, not scary. It keeps the mega form's second trait (a final exam).
   A form is the boss's own drawing with parts added (mega) or its colors turned to gold
   (legend), so it's clearly the same character. bossForm(m, "mega") gives a monster to draw
   with svg(), its base the boss (so traits.js still finds the boss's trait). */
const ICE = '#9ef0ff', ICE3 = '#56c8e8';
// A big gold crown with three gems: its band's middle at (x, y), w wide, its points h tall.
const bigCrown = (x, y, w, h, gem = CORAL) => {
  const l = x - w / 2, r = x + w / 2, k = w / 4;
  return solid(`<path d="M${l} ${y} L${l - 3} ${y - h} L${f1(l + k)} ${f1(y - h * .45)} L${x} ${y - h - 4} L${f1(r - k)} ${f1(y - h * .45)} L${r + 3} ${y - h} L${r} ${y} Z"/>`, GOLD)
    + `<path d="M${l + 1} ${f1(y - 5)} H${r - 1}" stroke="${DK}" stroke-width="2.5" opacity=".45"/>`
    + `<circle cx="${x}" cy="${f1(y - h * .5)}" r="4.5" fill="${gem}" stroke="${DK}" stroke-width="2.5"/><circle cx="${f1(l + k * .55)}" cy="${f1(y - h * .28)}" r="3" fill="${ICE}" stroke="${DK}" stroke-width="2"/><circle cx="${f1(r - k * .55)}" cy="${f1(y - h * .28)}" r="3" fill="${ICE}" stroke="${DK}" stroke-width="2"/>`;
};
// A crystal: a shard from (x, y) pointing at angle deg, len long and w wide, with a darker face
// and a glint.
const shard = (x, y, deg, len, w) => {
  const a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, p = (s, t) => `${f1(x + ux * s + px * t)} ${f1(y + uy * s + py * t)}`;
  return { body: `<path d="M${p(0, -w / 2)} L${p(len * .78, -w / 2)} L${p(len, 0)} L${p(len * .78, w / 2)} L${p(0, w / 2)} Z"/>`,
    face: `<path d="M${p(0, 0)} L${p(len, 0)} L${p(len * .78, w / 2)} L${p(0, w / 2)} Z" fill="${ICE3}" opacity=".55"/><path d="M${p(len * .1, -w / 4)} L${p(len * .7, -w / 4)}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>` };
};
const shards = (list) => { const s = list.map(([x, y, d, l, w]) => shard(x, y, d, l, w)); return solid(s.map((q) => q.body).join(''), ICE) + s.map((q) => q.face).join(''); };
// A four-point sparkle, light with a gold edge so it shows on gold and on every wall.
const twinkle = (x, y, r) => `<path d="M${x} ${y - r} Q${f1(x + r * .18)} ${f1(y - r * .18)} ${x + r} ${y} Q${f1(x + r * .18)} ${f1(y + r * .18)} ${x} ${y + r} Q${f1(x - r * .18)} ${f1(y + r * .18)} ${x - r} ${y} Q${f1(x - r * .18)} ${f1(y - r * .18)} ${x} ${y - r} Z" fill="#fffbe6" stroke="#c98a1a" stroke-width="1.5" stroke-linejoin="round"/>`;

// The gold of a Legend: the boss's own color becomes polished metal (one gradient across the
// whole figure), and every other color a shade of gold by how light it was. Outlines (DK) and eye
// whites stay, so it never loses its edges against the gold.
const GOLD_DEFS = `<defs><linearGradient id="bf-gold" gradientUnits="userSpaceOnUse" x1="20" y1="-10" x2="120" y2="210"><stop offset="0" stop-color="#fff2b0"/><stop offset=".3" stop-color="#ffd23f"/><stop offset=".5" stop-color="#ffe892"/><stop offset=".72" stop-color="#f4b625"/><stop offset="1" stop-color="#d48d17"/></linearGradient>`
  + `<radialGradient id="bf-glow"><stop offset="0" stop-color="#ffd84d" stop-opacity=".55"/><stop offset=".6" stop-color="#ffc93c" stop-opacity=".22"/><stop offset="1" stop-color="#ffc93c" stop-opacity="0"/></radialGradient></defs>`;
export const GOLDS = ['#8a5a14', '#b97a16', '#e0a222', '#ffc93c', '#ffdc6e', '#ffeeb0'];
const lumOf = (h) => { const v = h.length === 4 ? h.slice(1).split('').map((x) => parseInt(x + x, 16)) : [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return (.3 * v[0] + .59 * v[1] + .11 * v[2]) / 255; };
export const goldify = (s) => s.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g, (h) => {
  const k = h.toLowerCase();
  if (k === DK || k === '#fff' || k === '#ffffff') return h;
  return GOLDS[Math.min(GOLDS.length - 1, Math.floor(lumOf(k) * GOLDS.length))];
});
// The Legend's stage: a warm glow and a thin gold ring behind, sparkles in front.
// extra is drawn over it as it is (not turned gold): a happier face, say.
const legend = (art, twinkles, extra = '') => GOLD_DEFS + `<circle cx="100" cy="100" r="112" fill="url(#bf-glow)"/><circle cx="100" cy="100" r="104" fill="none" stroke="${GOLD}" stroke-width="3" opacity=".55"/>`
  + goldify(art) + extra + twinkles.map(([x, y, r]) => twinkle(x, y, r)).join('');

const bossArt = (n) => (c) => MON.find((m) => m.n === n).d(c);
const golemArt = bossArt('Make-Ten Golem'), rexArt = bossArt('Sigma Rex'), centiArt = bossArt('The Centipede');

export const BOSS_FORMS = {
  'Make-Ten Golem': {
    mega: { n: 'Mega-Ten Golem', c: '#a9b6ba',
      trait2: { icon: '👑', name: 'Second wind', text: 'Armors up at half HP' },
      quip: 'crumbles into a hundred tidy pebbles.',
      d: (c) => megaGolem(c, 3), power: (c, k) => megaGolem(c, k) },
    legend: { n: 'Golden Golem', quip: 'shines, bows, and crumbles into gold dust.',
      // Its flat mouth turned up into a smile, and its eyes shining.
      d: () => legend(golemArt('url(#bf-gold)').replace('<path d="M86 46 H114"', '<path d="M86 43 Q100 54 114 43"'), [[16, 30, 11], [184, 34, 9], [190, 156, 7], [10, 164, 8], [150, 4, 6]],
        `<rect x="80" y="24" width="14" height="10" rx="3" fill="#fffbe6" stroke="${DK}" stroke-width="3"/><rect x="106" y="24" width="14" height="10" rx="3" fill="#fffbe6" stroke="${DK}" stroke-width="3"/><path d="M84 29 h4 M110 29 h4" stroke="${DK}" stroke-width="3" stroke-linecap="round"/>`) }
  },
  'Judo Judy': {
    mega: { n: 'Mega Judy',
      trait2: { icon: '⚡', name: 'Black Belt', text: 'Every 4th problem is a big throw: a miss costs 2 hearts' },
      quip: 'bows low and hands over the black belt.',
      d: (c) => megaJudy(c, 3), power: (c, k) => megaJudy(c, k) },
    legend: { n: 'Golden Judy', quip: 'bows to a true math master.',
      d: () => legend(judy('url(#bf-gold)'), [[20, 34, 10], [176, 150, 9], [186, 22, 7], [28, 192, 7], [150, 196, 6]]) }
  },
  'The Centipede': {
    mega: { n: 'The Megapede', c: '#ff5a3a',
      trait2: { icon: '🐛', name: 'Curl Up', text: 'Curls into a ring at half HP: hits under 20 do half damage' },
      quip: 'drops its crystals and scuttles off.',
      d: (c) => megapede(c, 3), power: (c, k) => megapede(c, k) },
    legend: { n: 'Golden Centipede', quip: 'waves a hundred golden legs goodbye.',
      d: () => legend(centiArt('url(#bf-gold)'), [[150, 12, 10], [190, 60, 7], [104, 100, 9], [12, 120, 7], [200, 186, 6]]) }
  },
  'The Denominator': {
    mega: { n: 'The Megaminator', c: '#b8c6d2',
      trait2: { icon: '⚡', name: 'Overload', text: 'Every 4th problem is charged: a miss costs 2 hearts' },
      quip: 'vents its last steam and powers down.',
      d: (c) => megaminator(c, 3), power: (c, k) => megaminator(c, k) },
    legend: { n: 'Golden Denominator', quip: 'bows, polished and proud, to a fraction master.',
      d: () => legend(denominator('url(#bf-gold)', '#fffbe6'), [[20, 30, 10], [184, 40, 8], [186, 170, 7], [14, 160, 8], [150, 4, 6]]) }
  },
  'Sigma Rex': {
    mega: { n: 'Mega Sigma Rex',
      trait2: { icon: '🥋', name: 'Flip', text: 'Flips your times facts: same answer' },
      quip: 'roars once more, then sums to zero.',
      d: (c) => megaRex(c, 3), power: (c, k) => megaRex(c, k) },
    legend: { n: 'Golden Sigma Rex', quip: 'bows to the new ruler of the Tower.',
      d: () => legend(rexArt('url(#bf-gold)'), [[20, 100, 10], [176, 100, 8], [180, 196, 7], [30, 192, 6], [186, 12, 7]]) }
  }
};

/* Each mega form is drawn in stages k (DESIGN.md §4.3, §14.2): 3 is the full mega boss; 1 and 2
   are the boss powering up on the two depths before it (bossForm(m, "power", k)), with about a
   third, then two thirds, of the parts the mega form adds, and never its crown. */
// Mega-Ten Golem: crystal armor (shards jutting from its back and shoulders, crystal pauldrons,
// gauntlets and knee guards), all ten of its ten-frame lit gold (it made ten), angry brows, a crown.
// Powering up: one crystal shoulder and a few shards and cells, then both shoulders and gauntlets.
function megaGolem(c, k) {
  const SH = [[34, 82, -128, 46, 18], [50, 70, -105, 34, 14], [166, 82, -52, 46, 18], [150, 70, -75, 34, 14], [24, 84, -160, 30, 12], [176, 84, -20, 30, 12]];
  const lit = k === 1 ? 2 : k === 2 ? 5 : 7;
  return shards(k === 1 ? SH.slice(0, 2) : k === 2 ? SH.slice(0, 4) : SH)
    + golemArt(c)
    + [0, 1, 2, 3, 4, 5, 6].slice(0, lit).map((i) => `<rect x="${47 + (i % 5) * 22}" y="${73 + Math.floor(i / 5) * 36}" width="18" height="30" rx="5" fill="${GOLD}" stroke="${DK}" stroke-width="3"/>`).join('')
    + (k === 3 ? `<path d="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `M${52 + (i % 5) * 22} ${79 + Math.floor(i / 5) * 36} v9`).join(' ')}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>` : '')
    + solid(k === 1 ? `<path d="M6 76 L25 64 L44 76 L40 98 L10 98 Z"/>` : `<path d="M6 76 L25 64 L44 76 L40 98 L10 98 Z M156 76 L175 64 L194 76 L190 98 L160 98 Z"/>`, ICE)
    + (k === 1 ? `<path d="M25 66 V96" stroke="${ICE3}" stroke-width="3" opacity=".7"/><path d="M14 78 L25 70" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`
      : `<path d="M25 66 V96 M175 66 V96" stroke="${ICE3}" stroke-width="3" opacity=".7"/><path d="M14 78 L25 70 M164 78 L175 70" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`)
    + (k >= 2 ? solid(`<path d="M8 120 H42 V144 L25 152 L8 144 Z M158 120 H192 V144 L175 152 L158 144 Z"/>`, ICE)
      + `<path d="M25 122 V150 M175 122 V150" stroke="${ICE3}" stroke-width="3" opacity=".7"/><path d="M13 126 h8 M163 126 h8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>` : '')
    + (k === 3 ? solid(`<path d="M56 154 L73 146 L90 154 L86 168 L60 168 Z M110 154 L127 146 L144 154 L140 168 L114 168 Z"/>`, ICE) : '')
    + (k >= 2 ? `<path d="M76 16 L96 22 M124 16 L104 22" stroke="${DK}" stroke-width="4.5" stroke-linecap="round"/>` : '')
    + (k === 3 ? bigCrown(100, 10, 54, 18) : '');
}
// Mega Judy: fiercer, a burst of power behind, steeper brows, a crown on the top-knot, and the
// black belt glowing gold with longer, flying tails. Powering up: the belt starts to glow, then
// half the burst and the brows.
function megaJudy(c, k) {
  const rays = [];
  for (let i = 0; i < 16; i++) { if (k === 2 && i % 2) continue; const a = i * 22.5 + 11, [x1, y1] = at(100, 102, i % 2 ? 90 : 102, a), [xl, yl] = at(100, 102, 66, a - 8), [xr, yr] = at(100, 102, 66, a + 8); rays.push(`M${f1(xl)} ${f1(yl)} L${f1(x1)} ${f1(y1)} L${f1(xr)} ${f1(yr)} Z`); }
  // The belt's glow: soft gold halos round the belt and its tails.
  const belt = `<path d="M62 119 H134 M88 124 L80 154 M112 124 L120 154"/>`;
  return (k >= 2 ? solid(`<path d="${rays.join(' ')}"/>`, CORAL) + `<circle cx="100" cy="102" r="70" fill="${GOLD}" opacity="${k === 3 ? '.28' : '.16'}"/>` : '')
    + judy(c)
    + `<g fill="none" stroke="${GOLD}" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="34" opacity="${k === 1 ? '.1' : '.18'}">${belt}</g><g stroke-width="24" opacity="${k === 1 ? '.2' : '.3'}">${belt}</g></g>`
    + (k >= 2 ? solid(`<path d="M94 122 L80 158 L91 160 L100 126 Z M106 122 L120 158 L109 160 L100 126 Z"/>`, '#23232b') : '')
    + solid(`<rect x="58" y="112" width="80" height="14" rx="4"/>`, '#23232b')
    + `<path d="M62 116 H136${k >= 2 ? ' M84 154 L95 126 M116 154 L105 126' : ''}" stroke="${GOLD}" stroke-width="2.5" stroke-linecap="round"/>`
    + solid(`<rect x="90" y="108" width="20" height="22" rx="5"/>`, '#23232b') + `<rect x="94" y="112" width="12" height="14" rx="3" fill="none" stroke="${GOLD}" stroke-width="2.5"/>`
    + (k >= 2 ? `<path d="M76 42 L95 50 M124 42 L105 50" stroke="${DK}" stroke-width="5.5" stroke-linecap="round"/>` : '')
    + (k === 3 ? bigCrown(100, 16, 40, 18) : '');
}
// The Megapede: the Centipede with twelve rods instead of ten, crystal spikes on every rod's
// back, angry brows and a crown on its miner's helmet. Powering up: ten rods with a third of the
// spikes, then eleven with two thirds and the brows.
function megapede(c, k = 3) {
  const cx = 102, cy = 100, r = 62, N = 9 + k, step = 212 / (N - 1), rodA = (i) => 194 - i * step, rods = [], legs = [], tips = [], spine = [], spikes = [];
  for (let i = 0; i < N; i++) {
    const a = rodA(i), [x, y] = at(cx, cy, r, a).map(f1); spine.push(`${x} ${y}`);
    const [ox, oy] = at(cx, cy, r + 20, a);
    for (const s of [-1, 1]) {
      const [lx, ly] = at(cx, cy, r + 34, a + s * 6); legs.push(`<path d="M${f1(ox)} ${f1(oy)} L${f1(lx)} ${f1(ly)}"/>`);
      const [qx, qy] = at(lx, ly, 5, a); tips.push(`<path transform="rotate(${f1(a + 90)} ${f1(qx)} ${f1(qy)})" d="M${f1(qx)} ${f1(qy - 6)} l4.5 6 l-4.5 6 l-4.5 -6 Z"/>`);
    }
    if (i && (k === 3 || (k === 2 ? i % 3 : i % 3 === 1))) { const [sx, sy] = at(cx, cy, r - 18, a); spikes.push([f1(sx), f1(sy), a + 180, i % 2 ? 26 : 17, 12]); }
    rods.push(`<g transform="rotate(${f1(a)} ${x} ${y})">${solid(`<rect x="${f1(x - 23)}" y="${f1(y - 9)}" width="46" height="18" rx="5"/>`, c)}<path d="${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => `M${f1(x - 23 + k * 4.6)} ${f1(y - 7)} v14`).join(' ')}" stroke="${DK}" stroke-width="1.3" opacity=".42"/></g>`);
  }
  const [ex, ey] = at(cx, cy, r, rodA(N - 1) - 12).map(f1), [hx, hy] = at(cx, cy, r, rodA(0) + 12).map(f1);
  return line(legs.join(''), DK, 1) + `<g fill="${ICE}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round">${tips.join('')}</g>`
    + shards(spikes)
    + line(`<path d="M${hx} ${hy} L${spine.join(' L')} L${ex} ${ey}"/>`, '#c4532a', 20) + line(`<path d="M${ex} ${ey} l-4 -16 M${ex} ${ey} l12 -10"/>`, '#c4532a', 5)
    + rods.join('')
    + line(`<path d="M30 24 Q18 4 4 4 M60 24 Q72 2 88 0"/>`, '#c4532a', 5) + `<g fill="${ICE}" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"><path d="M0 -4 l5 8 l-5 8 l-5 -8Z"/><path d="M92 -8 l5 8 l-5 8 l-5 -8Z"/></g>`
    + solid(`<circle cx="46" cy="58" r="34"/>`, c) + solid(`<path d="M10 56 Q10 16 46 16 Q82 16 82 56 Z"/>`, GOLD)
    + `<path d="M55 27 Q46 22 40 29 Q35 36 40 43 Q46 49 55 45 M46 20 V52" ${thin(3.5)} fill="none"/>`
    + (k >= 2 ? `<path d="M24 56 L42 62 M68 56 L50 62" stroke="${DK}" stroke-width="4.5" stroke-linecap="round"/>` : '') + `${eye(34, 66, 9)}${eye(58, 66, 9)}<path d="M32 82 Q46 92 60 82" ${ds} stroke-width="3"/><path d="M36 84 l2 9 l4 -7 M56 84 l-2 9 l-4 -7" fill="${CREAM}" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`
    + (k === 3 ? bigCrown(46, 18, 36, 14) : '');
}

// Mega Sigma Rex: a coral mane round the back of its head, each tuft marked with a Σ, a big
// gold crown in place of its red one, angrier brows and a third fang. Powering up: a Σ tuft or
// two, then three and a thicker body, keeping its own red crown.
function megaRex(c, k = 3) {
  const tufts = [138, 172, 206, 240].slice(0, k === 1 ? 2 : k === 2 ? 3 : 4).map((d) => at(62, 52, 44, d).map(f1)), spikes = [];
  for (const [d, len] of [[122, 70], [155, 74], [189, 72], [222, 70], [252, 60]].slice(0, k === 1 ? 2 : k === 2 ? 4 : 5)) { const [x, y] = at(62, 52, len, d), [xl, yl] = at(62, 52, 34, d - 12), [xr, yr] = at(62, 52, 34, d + 12); spikes.push(`M${f1(xl)} ${f1(yl)} L${f1(x)} ${f1(y)} L${f1(xr)} ${f1(yr)} Z`); }
  return solid(`<path d="${spikes.join(' ')}"/>`, '#d9433a') + solid(tufts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16"/>`).join(''), CORAL)
    + `<g fill="none" stroke="${DK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${tufts.map(([x, y]) => `<path d="M${f1(x + 6)} ${f1(y - 7.5)} H${f1(x - 6)} L${f1(x + 1.5)} ${y} L${f1(x - 6)} ${f1(y + 7.5)} H${f1(x + 6)}"/>`).join('')}</g>`
    // Its body drawn thicker (the Σ's stroke 38, not 30), and its red crown left off.
    + (k === 1 ? rexArt(c) : k === 2 ? rexArt(c).replace(/stroke-width="39"/, 'stroke-width="43"').replace(/stroke-width="30"/g, 'stroke-width="34"')
      : rexArt(c).replace(/<path d="M62 26 L70 2[^>]*>/, '').replace(/stroke-width="39"/, 'stroke-width="47"').replace(/stroke-width="30"/g, 'stroke-width="38"'))
    + (k === 3 ? `<path d="M120 112 l4 9 l4 -9" fill="#fff" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>` : '')
    + (k >= 2 ? `<path d="M64 27 L84 35 M112 27 L94 35" stroke="${DK}" stroke-width="4.5" stroke-linecap="round"/>` : '')
    + (k === 3 ? bigCrown(100, 22, 62, 22) : '');
}
// The Megaminator: chrome plates on its shoulders and chest, steam puffing from vents on its
// shoulders, coral eyes glowing, sparks round its fists, and a crown on its numerator head.
// Powering up: one steam vent and a chest plate, then both vents, the shoulder plates and coral eyes.
function megaminator(c, k = 3) {
  const puff = (x, y) => solid(`<circle cx="${x}" cy="${y}" r="9"/><circle cx="${x + 10}" cy="${y - 8}" r="7"/><circle cx="${x - 6}" cy="${y - 14}" r="6"/>`, '#f3efe4');
  return (k >= 1 ? puff(34, 76) : '') + (k >= 2 ? puff(160, 76) : '')
    + denominator(c, k >= 2 ? CORAL : EMBER)
    + (k >= 1 ? solid(`<rect x="72" y="114" width="56" height="8" rx="4"/>`, ICE) : '')
    + (k >= 2 ? solid(`<path d="M18 86 Q40 76 58 88 V112 H18 Z M182 86 Q160 76 142 88 V112 H182 Z"/>`, ICE) : '')
    + (k === 3 ? `<path d="M-6 80 l6 8 l-8 2 l6 8 M206 80 l-6 8 l8 2 l-6 8" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` + bigCrown(100, 22, 64, 22) : '');
}
// Boss m in its mega or legend form (null when it has none): a monster to draw with svg(), named
// for the form, its base the boss, with the form's own color, drawing, beaten line (quip) and,
// for a mega, its second trait (traits.js). form "power", stage 1 or 2: the boss powering up on
// the two depths before a mega boss (DESIGN.md §4.3), still itself (its name, color, lines and
// trait) with some of its mega form's parts.
export function bossForm(m, form, stage) {
  const forms = BOSS_FORMS[m.base || m.n] || {};
  if (form === "power") {
    if (!forms.mega || !forms.mega.power) return null;
    const k = Math.max(1, Math.min(2, stage || 1));
    return Object.assign({}, m, { base: m.base || m.n, form, stage: k, d: (c) => forms.mega.power(c, k) });
  }
  const f = forms[form];
  if (!f) return null;
  // The Legend fights with its mega form's second trait too (DESIGN.md §14.2).
  const trait2 = f.trait2 || (form === "legend" && forms.mega && forms.mega.trait2) || null;
  return Object.assign({}, m, { n: f.n, base: m.base || m.n, form, c: f.c || m.c, d: f.d, quip: f.quip, trait2 });
}

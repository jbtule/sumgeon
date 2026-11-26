// The monsters: data and inline SVG art. No DOM, so the check can run it in Node.
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
  d:c=>`<path d="M82 124 V150 M128 146 V170" stroke="${DK}" stroke-width="10" stroke-linecap="round"/>${foot(84,154,14)}${foot(130,174,14)}`+line(`<path d="M172 40 L44 100 L172 160"/>`,c,30)+`<path d="M92 86 l8 12 l6 -16 M120 73 l8 12 l6 -16 M148 60 l8 12 l6 -16 M92 114 l8 -12 l6 16 M120 127 l8 -12 l6 16 M148 140 l8 -12 l6 16" fill="#f3efe4" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`+solid(`<circle cx="74" cy="72" r="15"/>`,c)+`${eye(76,70,8)}<circle cx="170" cy="38" r="3" fill="${DK}"/><circle cx="162" cy="42" r="3" fill="${DK}"/>`},
 {n:'Equal Twins',op:'=',c:'#ff7ac8',hits:4,quip:'agree, for once, to call it even.',
  d:c=>`${foot(74,176,15)}${foot(126,176,15)}`+solid(`<rect x="26" y="50" width="148" height="40" rx="20"/>`,c)+solid(`<rect x="26" y="112" width="148" height="40" rx="20"/>`,'#8ab4ff')+`${eye(86,68,8)}${eye(110,68,8)}<path d="M92 80 Q98 85 104 80" ${ds}/>${eye(90,130,8)}${eye(114,130,8)}<path d="M96 142 Q102 147 108 142" ${ds}/><path d="M150 46 l14 -12 l2 16 z M150 46 l-14 -12 l-2 16 z" fill="#ffc93c" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/><path d="M30 112 Q40 92 70 104 L70 112 Z" fill="#3a4a8c" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/>`},
 {n:'The Unknown',op:'mix',c:'#7b5cd6',hits:6,boss:1,quip:'is solved at last.',
  d:c=>`${foot(70,186,18)}${foot(130,186,18)}`+solid(`<path d="M100 10 L176 182 H24 Z"/>`,'#2a2050')+line(`<path d="M46 40 Q130 100 46 166 M154 40 Q70 100 154 166"/>`,c,26)+solid(`<circle cx="100" cy="58" r="22"/>`,'#2a2050')+`<ellipse cx="91" cy="58" rx="6" ry="4" fill="#ffc93c"/><ellipse cx="109" cy="58" rx="6" ry="4" fill="#ffc93c"/>`},
 {n:'Starbot',op:'×',c:'#9fb6c9',hits:4,quip:'powers down with a sparkly fizzle.',
  d:c=>`${foot(78,182,16)}${foot(122,182,16)}<path d="M70 168 V178 M130 168 V178" stroke="${DK}" stroke-width="10" stroke-linecap="round"/>`+line(`<path d="M44 108 L22 132 M156 108 L178 132"/>`,c,12)+solid(`<rect x="50" y="86" width="100" height="84" rx="16"/>`,c)+line(`<path d="M100 8 V72 M72 24 L128 56 M128 24 L72 56"/>`,'#ffc93c',16)+`<rect x="66" y="100" width="68" height="44" rx="10" fill="#0c171c"/><circle cx="86" cy="118" r="7" fill="#45d6e6"/><circle cx="114" cy="118" r="7" fill="#45d6e6"/><path d="M88 132 Q100 139 112 132" stroke="#45d6e6" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="100" cy="160" r="4" fill="#ff5a4e"/>`}
];
// The Crystal Mines' boss. Its art comes from NEW_MON's Centipede, swapped in below; this
// Golem-shaped stand-in is only the fallback.
MON.push({n:'The Centipede',op:'mix',c:'#a78bfa',hits:6,boss:1,quip:'curls up into a hundred pieces.',
  d:(c)=>MON.find((m)=>m.n==='Make-Ten Golem').d(c)});

/* ---------- new monsters, drawn but not in the game yet ----------
   The grade strata's new monsters (DESIGN.md §4.1). Same shape as MON, plus sym (the symbol its
   body is), stratum and trait (the plan, for the gallery page), so they can be reviewed before
   they're wired into wings.js, traits.js and lines.js. Nothing in the game reads NEW_MON. */
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
 {n:'Pipsqueak',op:'+',sym:'⚄',stratum:'cellar',c:'#f6f3ea',hits:3,
  trait:{icon:'🎲',name:'Flash',text:'Shows dots for a moment: how many? (up to 5)'},
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
 {n:'Triceraplus',op:'+',sym:'+ + +',stratum:'hall',c:'#ff9a4a',hits:3,
  trait:{icon:'🦕',name:'Three horns',text:'Adds three numbers: 4 + 3 + 6'},
  quip:'stomps off to find a bigger sum.',
  d:c=>{const plus=(x,y,h,w,r=w/2.4)=>`<rect x="${x-w/2}" y="${y-h}" width="${w}" height="${2*h}" rx="${r}"/><rect x="${x-h}" y="${y-w/2}" width="${2*h}" height="${w}" rx="${r}"/>`;
   return `${foot(114,176,10)}${foot(136,176,10)}${foot(164,176,10)}${foot(190,176,10)}`
   +line(`<path d="M108 100 Q124 116 150 118 Q174 120 182 116 Q198 110 202 92 M124 112 L114 172 M130 114 L136 172 M170 118 L164 172 M176 117 L190 172"/>`,c,9)
   +solid(plus(70,90,52,42,14),c)
   +solid(plus(32,52,13,11,3)+plus(70,22,13,11,3)+plus(108,52,13,11,3),CREAM)
   +`${eye(58,86,10)}${eye(82,86,10)}<path d="M60 104 Q70 112 80 104" ${ds} stroke-width="3"/>`}},
 {n:'Doublet',op:'+',sym:'+ +',stratum:'hall',c:'#ffd84d',hits:3,
  trait:{icon:'👯',name:'Doubles',text:'Doubles and halves: 8 + 8 and 16 − 8'},
  quip:'take a bow together and skip away.',
  d:c=>{const one=(x)=>solid(`<rect x="${x-17}" y="34" width="34" height="118" rx="15"/>`,c);
   const tie=(x)=>`<path d="M${x} 116 l-12 -7 v14 z M${x} 116 l12 -7 v14 z" fill="${CORAL}" stroke="${DK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x}" cy="116" r="4" fill="${CORAL}" stroke="${DK}" stroke-width="3"/>`;
   const face=(x)=>`${eye(x-9,82,8)}${eye(x+9,82,8)}<path d="M${x-7} 96 Q${x} 102 ${x+7} 96" ${ds} stroke-width="3"/>`;
   return `${foot(48,160,13)}${foot(70,160,13)}${foot(130,160,13)}${foot(152,160,13)}`
   +solid(`<rect x="8" y="72" width="94" height="34" rx="15"/><rect x="98" y="72" width="94" height="34" rx="15"/>`,c)+one(59)+one(141)
   +solid(`<circle cx="94" cy="89" r="12"/><circle cx="106" cy="89" r="12"/>`,c)+`<path d="M100 79 v20" ${ds} stroke-width="3"/>`
   +face(59)+face(141)+tie(59)+tie(141)}},
 {n:'Tick-Tockus',op:'mix',sym:'🕒',stratum:'hall, mines, tower',c:'#e8679f',hits:4,
  trait:{icon:'⏰',name:'Tell the time',text:'Hours and half hours, then 5 minutes, then the minute'},
  quip:'runs out of time and wriggles away.',
  d:c=>{const legs=[[58,118,'q-26 10 -34 36 q-4 14 8 14'],[74,128,'q-12 24 -6 44 q4 10 12 2'],[92,132,'q-4 26 -16 42'],[108,132,'q4 26 16 42'],[126,128,'q12 24 6 44 q-4 10 -12 2'],[142,118,'q26 10 34 36 q4 14 -8 14']];
   const ticks=[0,30,60,90,120,150,180,210,240,270,300,330].map((a)=>{const big=a%90===0,[x0,y0]=at(100,72,big?34:37,a-90),[x1,y1]=at(100,72,42,a-90);return `<path d="M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)}" ${thin(big?4:2.5)}/>`;}).join('');
   return line(legs.map(([x,y,p])=>`<path d="M${x} ${y} ${p}"/>`).join(''),c,13)
   +legs.map(([x,y],i)=>`<circle cx="${x+(i<3?-6:6)}" cy="${y+16}" r="2.5" fill="#ffd0e3"/>`).join('')
   +solid(`<path d="M50 34 a22 22 0 0 1 30 -22 Z" transform="rotate(-10 62 24)"/><path d="M150 34 a22 22 0 0 0 -30 -22 Z" transform="rotate(10 138 24)"/>`,GOLD)
   +solid(`<circle cx="100" cy="76" r="60"/>`,c)
   +`<circle cx="100" cy="72" r="45" fill="${CREAM}" stroke="${DK}" stroke-width="4"/>${ticks}`
   +line(`<path d="M100 72 Q88 64 80 50 M100 72 Q118 60 128 58"/>`,c,8)+`<circle cx="100" cy="72" r="5" fill="${GOLD}" stroke="${DK}" stroke-width="3"/>`
   +`${eye(86,94,8)}${eye(114,94,8)}<path d="M94 106 Q100 111 106 106" ${ds} stroke-width="3"/>`}},
 {n:'Slimelipsis',op:'mix',sym:'…',stratum:'mines',c:'#3fd6d0',hits:3,
  trait:{icon:'🫧',name:'What comes next',text:'Skip counting: 15, 20, 25, □'},
  quip:'slide off one, two, three, leaving a sticky trail.',
  d:c=>{const X=[30,100,170],B=142,face=(x,i)=>`${eye(x-10,B-34,8)}${eye(x+10,B-34,8)}`+(i===1?`<ellipse cx="${x}" cy="${B-19}" rx="4" ry="4.5" fill="${DK}"/>`:`<path d="M${x-7} ${B-20} Q${x} ${B-14} ${x+7} ${B-20}" ${ds} stroke-width="3"/>`);
   return line(`<path d="M-4 ${B+4} Q8 ${B-4} 26 ${B+4} Q48 ${B+12} 70 ${B+4} Q86 ${B-4} 104 ${B+4} Q126 ${B+12} 150 ${B+4}"/>`,'#8eeae4',13)
   +solid(`<path d="M10 ${B+8} q3 10 -1 14 q-5 -4 1 -14z M58 ${B+10} q4 12 -1 17 q-6 -5 1 -17z M128 ${B+10} q3 9 -1 13 q-5 -4 1 -13z"/>`,'#8eeae4')
   +`<path d="M0 ${B+1} h10 M42 ${B+6} h12 M84 ${B+1} h8 M114 ${B+6} h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".75"/>`
   +solid(X.map((x)=>slime(x,B,.94,1.06)).join(''),c)
   +X.map(face).join('')
   +X.map((x)=>`<circle cx="${x-14}" cy="${B-47}" r="3.5" fill="#fff" opacity=".7"/>`).join('')}},
 {n:'Squaresquatch',op:'×',sym:'²',stratum:'mines',c:'#7f9cff',hits:4,
  trait:{icon:'🟩',name:'Arrays',text:'Rows and columns up to 5 × 5, as 5 + 5 + 5'},
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
   +`${eye(34,62,9)}${eye(58,62,9)}<path d="M32 78 Q46 88 60 78" ${ds} stroke-width="3"/><path d="M37 81 l2 7 l3 -6 M55 81 l-2 7 l-3 -6" fill="${CREAM}" stroke="${DK}" stroke-width="2" stroke-linejoin="round"/>`}},
 {n:'Halfling',op:'mix',sym:'½',stratum:'tower',c:'#a47dff',hits:4,
  trait:{icon:'½',name:'Halves',text:'Unit fractions, on a number line, and equal fractions'},
  quip:'splits in half and tiptoes home.',
  d:c=>solid(`<ellipse cx="56" cy="186" rx="24" ry="11"/><ellipse cx="150" cy="186" rx="24" ry="11"/>`,'#f2b483')+`<path d="M38 181 q3 -6 6 0 M48 179 q3 -6 6 0 M150 179 q3 -6 6 0 M160 181 q3 -6 6 0" ${ds} stroke-width="2.5"/>`
   +line(`<path d="M60 142 Q60 120 100 120 Q140 120 140 142 Q140 160 64 180 H146"/>`,c,19)
   +line(`<path d="M76 40 L102 22 V82"/>`,c,32)
   +line(`<path d="M86 12 q-6 -14 6 -18 q12 0 6 10 M104 8 q2 -14 14 -12 q8 4 0 12"/>`,'#6b4bc4',6)
   +solid(`<rect x="28" y="90" width="144" height="20" rx="10"/>`,'#6b4bc4')
   +solid(`<circle cx="24" cy="100" r="12"/><circle cx="176" cy="100" r="12"/>`,c)
   +`<rect x="88" y="88" width="26" height="24" rx="5" fill="${GOLD}" stroke="${DK}" stroke-width="3.5"/>`
   +`${eye(93,50,8)}${eye(111,50,8)}<path d="M96 66 Q102 71 108 66" ${ds} stroke-width="3"/>`}
];
// The Crystal Mines' boss gets its real art: the approved Centipede replaces the stand-in above
// (the Golem's shape), keeping its game data, and leaves NEW_MON, since it's in the game now.
{
  const real = NEW_MON.find((m) => m.n === "The Centipede"), i = MON.findIndex((m) => m.n === "The Centipede");
  if (real && i >= 0) { MON[i] = Object.assign({}, MON[i], { c: real.c, d: real.d, quip: real.quip }); NEW_MON.splice(NEW_MON.indexOf(real), 1); }
}

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
  Chompers: { eyes: [[76, 70, 8]], mouth: [150, 100], top: [74, 56], neck: [58, 112], ground: 178 },
  "Equal Twins": { eyes: [[86, 68, 8], [110, 68, 8]], mouth: [98, 82], top: [100, 50], neck: [100, 100], ground: 182 },
  Timesaur: { eyes: [[89, 93, 9], [112, 93, 9]], mouth: [100, 108], top: [100, 76], neck: [100, 124], ground: 174 },
  Divvy: { eyes: [[89, 50, 8], [111, 50, 8]], mouth: [100, 66], top: [100, 22], neck: [100, 88], ground: 192 },
  Starbot: { eyes: [[86, 118, 7], [114, 118, 7]], mouth: [100, 134], top: [100, 86], neck: [100, 152], ground: 188, lid: DK },
  Haberhasher: { eyes: [[88, 66, 7], [112, 66, 7]], mouth: [100, 78], top: [104, -22], hat: true, neck: [100, 100], ground: 194 },
  // NEW_MON, ready for looks once they're in the game. Doublet's are its left twin's face, with
  // both twins' eyes; Slimelipsis's are its middle slime's.
  Pipsqueak: { eyes: [[66, 82, 11], [124, 140, 11]], mouth: [95, 126], top: [104, 40], neck: [95, 150], ground: 188 },
  Triceraplus: { eyes: [[58, 86, 10], [82, 86, 10]], mouth: [70, 107], top: [70, 38], neck: [70, 124], ground: 182 },
  Doublet: { eyes: [[50, 82, 8], [68, 82, 8], [132, 82, 8], [150, 82, 8]], mouth: [59, 98], top: [59, 36], neck: [59, 116], ground: 166 },
  "Tick-Tockus": { eyes: [[86, 94, 8], [114, 94, 8]], mouth: [100, 108], top: [100, 16], neck: [100, 134], ground: 190 },
  Slimelipsis: { eyes: [[90, 108, 8], [110, 108, 8]], mouth: [100, 123], top: [100, 88], neck: [100, 134], ground: 150 },
  Squaresquatch: { eyes: [[84, 86, 9], [110, 86, 9]], mouth: [97, 110], top: [97, 40], neck: [97, 124], ground: 196 },
  "The Centipede": { eyes: [[34, 62, 9], [58, 62, 9]], mouth: [46, 82], top: [46, 12], hat: true, neck: [46, 92], ground: 200 },
  Halfling: { eyes: [[93, 50, 8], [111, 50, 8]], mouth: [102, 68], top: [102, 4], neck: [102, 82], ground: 196 }
};
const st = `stroke="${DK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
// Each accessory: (anchor, color) → SVG drawn over the monster.
const KIT = {
  crown: (a) => `<path d="M${a.top[0] - 22} ${a.top[1] + 2} l-4 -24 l13 11 l13 -18 l13 18 l13 -11 l-4 24 z" fill="#ffc93c" ${st}/><circle cx="${a.top[0]}" cy="${a.top[1] - 8}" r="3" fill="#ff5a4e"/>`,
  bow: (a) => { const x = a.top[0] - 20, y = a.top[1] + 4; return `<path d="M${x} ${y} l-14 -9 l0 18 z M${x} ${y} l14 -9 l0 18 z" fill="#ff7ac8" ${st}/><circle cx="${x}" cy="${y}" r="4.5" fill="#ff7ac8" ${st}/>`; },
  lashes: (a) => a.eyes.map(([x, y, r]) => `<path d="M${x - r * .7} ${y - r * .9} l-4 -5 M${x} ${y - r - 1} l0 -6 M${x + r * .7} ${y - r * .9} l4 -5" ${st}/>`).join(""),
  blush: (a) => a.eyes.map(([x, y, r], i) => `<ellipse cx="${x + (i ? 1 : -1) * (r + 3)}" cy="${y + r + 4}" rx="6" ry="3.5" fill="#ff7ac8" opacity=".75"/>`).join(""),
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
  Haberhasher: [["Jolly Hasher", ["blush", "sparkles"]], ["DJ Hashtag", ["sunglasses"]], ["Sir Hashalot", ["monocle", "mustache"]], ["Snoozehash", ["lids"]]]
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
function dress(m) {
  const a = ANCHOR[m.base], art = m.d(m.c), extras = m.look.filter((k) => KIT[k]).map((k) => KIT[k](a, m.c)).join("");
  if (!m.look.includes("mini")) return art + extras;
  // Smaller, standing on the same ground.
  return `<g transform="translate(100 ${a.ground}) scale(.72) translate(-100 ${-a.ground})">${art}${extras}</g>`;
}
export const svg=(m,cls='')=>`<svg viewBox="-10 -10 220 220" class="${cls}" role="img" aria-label="${m.n}">${defs}${m.look ? dress(m) : m.d(m.c)}</svg>`;

// The monsters: data and inline SVG art. No DOM, so the check can run it in Node.
// Art is simple shapes, no fonts: solid() and line() draw a dark outline, then the color,
// then a white sheen gradient.
const DK='#0c171c';
const eye=(x,y,r=9)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${DK}" stroke-width="3"/><circle cx="${x+1.5}" cy="${y+1}" r="${r*.45}" fill="${DK}"/>`;
const defs=`<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
const solid=(s,c)=>`<g fill="${DK}" stroke="${DK}" stroke-width="9" stroke-linejoin="round">${s}</g><g fill="${c}">${s}</g><g fill="url(#sh)">${s}</g>`;
const line=(s,c,w)=>`<g fill="none" stroke="${DK}" stroke-width="${w+9}" stroke-linecap="round" stroke-linejoin="round">${s}</g><g fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${s}</g><g fill="none" stroke="url(#sh)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;
const foot=(x,y,rx=13)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="7" fill="${DK}"/>`;
const ds=`stroke="${DK}" stroke-width="4" stroke-linecap="round" fill="none"`;

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
  d:c=>`<path d="M62 26 L70 2 L85 17 L100 -2 L115 17 L130 2 L138 26 Z" fill="#ff5a4e" stroke="${DK}" stroke-width="4" stroke-linejoin="round"/>${foot(60,180,18)}${foot(140,180,18)}`+line(`<path d="M152 42 H48 L106 104 L48 166 H152"/>`,c,30)+`${eye(74,42,8)}${eye(102,42,8)}<path d="M126 36 L144 42 L126 48" ${ds} stroke-width="3"/><path d="M96 112 l5 11 l5 -11 M108 112 l4 9 l4 -9" fill="#fff" stroke="${DK}" stroke-width="2.5" stroke-linejoin="round"/>`}
];
export const svg=(m,cls='')=>`<svg viewBox="-10 -10 220 220" class="${cls}" role="img" aria-label="${m.n}">${defs}${m.d(m.c)}</svg>`;

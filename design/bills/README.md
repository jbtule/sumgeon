# Bill portraits

The prototype's dollar bills (`js/dollars.js`) use four portraits:

- **$1 Washington** and **$5 Lincoln**: the coins' traced portraits (`BUSTS` in `js/coins.js`,
  from public-domain US Mint photos; see the main README).
- **$10 Hamilton** and **$20 Jackson**: line drawings made by hand (`DRAWN` in `js/dollars.js`)
  over the Bureau of Engraving and Printing's engraved portraits on Wikimedia Commons (public
  domain, works of the US government), the 960 px thumbnails:
  - "HAMILTON, Alexander-Treasury (BEP engraved portrait) (cropped).jpg": a profile facing right,
    curled hair tied back in a queue with a ribbon, a high collar and a ruffled cravat, the coat's
    lapel and a button. Image area `215,180,650`.
  - "JACKSON, Andrew-President (BEP engraved portrait).jpg": nearly facing us, turned a little to
    the right, hair swept up and back, a high white collar and cravat, and a cloak. Image area
    `255,290,500`.

They're drawn to match the coins' line art: a few ink strokes, no tones or fills. Each is two
paths in the coins' 200-unit box (so they sit in the bill's oval just as Washington and Lincoln
do): `line` (stroke 3.4) for the outlines of the face, hair, ear, collar and coat, and `fine`
(stroke 2.2) for the eyes, brows, mouth, a few hair strands and folds. The bill's oval shows
x 23 to 177, y 23 to 197 of the box.

To redraw one, put its strokes over the engraving with a grid in the box's units:

```
NODE_PATH=<playwright> node design/bills/overlay.mjs hamilton.jpg 215,180,650 10 hamilton.png
NODE_PATH=<playwright> node design/bills/overlay.mjs jackson.jpg 255,290,500 20 jackson.png
```

The image area (`x,y,height`, in the thumbnail's pixels) is the part that maps to the oval's
height. Read new points off the grid, edit `DRAWN`, and check the bills big and at the
prototype's size (about 100 px wide): each face should read as a head and shoulders there.
Simplify a feature that reads wrong rather than add detail. The downloaded images aren't kept
in the repo.

# Bill portraits

The prototype's dollar bills (`js/dollars.js`) use four portraits:

- **$1 Washington** and **$5 Lincoln**: the coins' traced portraits (`BUSTS` in `js/coins.js`,
  from public-domain US Mint photos; see the main README).
- **$10 Hamilton** and **$20 Jackson**: the Bureau of Engraving and Printing's engraved portraits
  on Wikimedia Commons (public domain, works of the US government), traced into flat tones by
  `trace.cjs` and pasted into `TRACED` in `js/dollars.js`:
  - "HAMILTON, Alexander-Treasury (BEP engraved portrait) (cropped).jpg", the 960 px thumbnail,
    crop `145,125,660,820`, 110 cells, light 0.6, dark 0.27, blur 3, smallest area 12.
  - "JACKSON, Andrew-President (BEP engraved portrait).jpg", the 960 px thumbnail, crop
    `228,245,512,615`, 110 cells, light 0.56, dark 0.23, blur 5, smallest area 30, dark from 0.5
    of the height down.

```
NODE_PATH=<playwright> node design/bills/trace.cjs hamilton.jpg 145,125,660,820 110 0.6 0.27 3 12 > hamilton.json
NODE_PATH=<playwright> node design/bills/trace.cjs jackson.jpg 228,245,512,615 110 0.56 0.23 5 30 0.5 > jackson.json
```

The tracer averages the engraving's hatching over small cells, so it becomes tones; the light
parts (face, hair, collar) are outlined in ink, the dark parts (the coat) a light ink wash,
over the bill's green oval, like the coins' line art. The downloaded images aren't kept in the repo.

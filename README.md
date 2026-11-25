# Sumgeon

A math-practice dungeon crawler: the answer to each problem is your attack. See `DESIGN.md`
for where it's going.

To run it locally, serve the folder with any static server, e.g. `python3 -m http.server 8791`,
then open http://localhost:8791. `npm run check` runs the tests (no install needed).

Will be live at https://tools.tuley.name/sumgeon/.

## License

Copyright © 2026 James Tuley. Licensed under the
[PolyForm Noncommercial License 1.0.0](LICENSE.md): free to use, change and share for
any noncommercial purpose, including personal use, families, schools and other
educational or charitable organizations. Commercial use needs separate permission.

This covers the code and the monster and hero art. Third-party parts keep their own
licenses:

- [Bungee](https://fonts.google.com/specimen/Bungee) and
  [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License 1.1), loaded
  from Google Fonts.
- The coin portraits in `js/coins.js` (Washington, Roosevelt, Jefferson, Lincoln) are traced
  from photos of US Mint coins on Wikimedia Commons, which are in the public domain as works of
  the US government: "2006 Quarter Proof.png", "Dime Obverse 13.png",
  "Jefferson-Nickel-Unc-Obv.jpg" and "US One Cent Obv.png". The coin backs are drawn for the
  game.
- The recorded voice is made with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)
  (Apache License 2.0), voice `af_heart`. The heroes' quips use a second voice from the same
  model, `af_bella` (same license).

Settings → About in the game repeats these credits.

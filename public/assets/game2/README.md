Place your mini-game 2 images here (public folder). These files will be served at /assets/game2/...

Expected filenames:

- background.png          -> scene background
- menfez_off.png         -> menfez (unclicked)
- menfez_on.png          -> menfez (clicked/fixed)
- ocak_off.png           -> stove (unclicked)
- ocak_on.png            -> stove (clicked/fixed)
- hortum_off.png         -> hose (unclicked)
- hortum_on.png          -> hose (clicked/fixed)
- kombi_off.png          -> boiler (unclicked)
- kombi_on.png           -> boiler (clicked/fixed)

Notes:
- Files placed in `public/assets/game2/` are available at `http://<host>:<port>/assets/game2/<file>` both in dev and preview/build modes.
- If you change filenames, update `src/scenes/game2/MiniGame2Scene.js` accordingly.

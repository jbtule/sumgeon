# The whole-vs-stitched listen test (DESIGN.md §13): renders a few problems both ways so the
# recording method can be picked by ear, as Sound Box picked its methods.
#   python listen_test.py <model-dir> <problems.json> <out-dir>
# problems.json: [{ "x": 7, "op": "+", "y": 8, "ans": 15, "words": { ...spoken text... } }]
# from scripts/audio/listen-test.sh, which takes the spoken text from js/problems.js.
#
#   whole     the sentence said as one line: kokoro.create("seven plus eight is fifteen.")
#   stitched  pieces cut out of real math sentences with the model's own per-phoneme durations
#             (kokoro_core.cut_phonemes), so each keeps the intonation of its place:
#               first number  "SEVEN plus two is nine."
#               middle number "two plus SEVEN is nine."   (before "is")
#               last number   "two plus two is SEVEN."    (the answer, falling)
#               operator      "two PLUS two is four."     ("is" the same way)
#             then joined with short crossfades. About 440 pieces would cover every problem.
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kokoro_core as core  # noqa: E402
from kokoro_core import SR, cut_phonemes, mp3, phonemes, trim  # noqa: E402

VOICE, SPEED = "af_heart", 0.95
OP = {"+": "plus", "-": "minus", "×": "times", "÷": "divided by"}
GAP_MS, XFADE_MS = 25, 12


def ph(text):
    return phonemes(text)


def piece(target, before, after):
    """`target` said between the words `before` and `after`, cut out."""
    pre = (ph(before) + " ") if before else ""
    post = (" " + ph(after)) if after else "."
    return cut_phonemes(ph(target), VOICE, SPEED, carrier=(pre, post))


def first(n):
    return piece(n, "", "plus two is nine.")


def middle(n):
    return piece(n, "two plus", "is nine.")


def last(n):
    return piece(n, "two plus two is", "")


def last_of_problem(n):
    return piece(n, "two plus", "")


def op_word(op):
    return piece(OP[op], "two", "two is four.")


def is_word():
    return piece("is", "two plus two", "four.")


def join(parts):
    """Pieces end to end with a short gap, each faded in and out a little."""
    gap = np.zeros(int(SR * GAP_MS / 1000), np.float32)
    n = int(SR * XFADE_MS / 1000)
    out = []
    for p in parts:
        p = trim(p, SR, pad=0.01).astype(np.float32).copy()
        if len(p) > 2 * n:
            p[:n] *= np.linspace(0, 1, n)
            p[-n:] *= np.linspace(1, 0, n)
        out += [p, gap]
    return np.concatenate(out[:-1])


def main():
    model_dir, plan, out_dir = sys.argv[1:4]
    core.load(model_dir)
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    for i, p in enumerate(json.load(open(plan)), 1):
        w = p["words"]
        clips = {
            "fact-whole": trim(core.kokoro.create(w["fact"][0].upper() + w["fact"][1:] + ".", voice=VOICE, speed=SPEED, lang="en-us")[0], SR),
            "fact-stitched": join([first(w["x"]), op_word(p["op"]), middle(w["y"]), is_word(), last(w["ans"])]),
            "problem-whole": trim(core.kokoro.create(w["problem"][0].upper() + w["problem"][1:] + ".", voice=VOICE, speed=SPEED, lang="en-us")[0], SR),
            "problem-stitched": join([first(w["x"]), op_word(p["op"]), last_of_problem(w["y"])]),
        }
        for name, audio in clips.items():
            with open(os.path.join(out_dir, f"p{i}-{name}.mp3"), "wb") as f:
                f.write(mp3(audio, SR))
        rows.append({"i": i, "q": p["q"], "fact": w["fact"], "problem": w["problem"]})
        print(f"rendered {i}: {p['q']}", flush=True)
    json.dump(rows, open(os.path.join(out_dir, "rows.json"), "w"))


if __name__ == "__main__":
    main()

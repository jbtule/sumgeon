# The whole-vs-stitched listen test (DESIGN.md §13): renders a few problems both ways so the
# recording method can be picked by ear, as Sound Box picked its methods.
#   python listen_test.py <model-dir> <problems.json> <out-dir>
# problems.json: [{ "x": 7, "op": "+", "y": 8, "ans": 15, "words": { ...spoken text... } }]
# from scripts/audio/listen-test.sh, which takes the spoken text from js/problems.js.
#
#   whole     the sentence said as one line: kokoro.create("seven plus eight is fifteen.")
#   stitched  pieces cut out of real math sentences with the model's own per-phoneme durations
#             (kokoro_core.cut_phonemes), so each keeps the intonation of its place:
#               first number  "SEVEN minus one is nine."
#               middle number "two divided by SEVEN is nine."   (before "is"; "by" ends in a
#                             vowel, so no hiss to cut around)
#               is + answer   "two plus two IS SEVEN."    (one piece: cutting right after the
#                             "z" of "is" kept a buzz, as cutting after "plus" kept its "s")
#               operator      "one PLUS eight is ten."
#             cut at the quietest point near each edge (no neighbor hiss), then joined with short
#             fades. About 580 pieces (0–144 in four places, plus the operators) would cover
#             every problem.
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


def hf(a):
    """High-frequency energy per 2.5 ms step (a first difference), to find where hiss stops."""
    d = np.abs(np.diff(a, prepend=a[0]))
    w = SR // 400
    return np.convolve(d, np.ones(w) / w, mode="same")


def snap(a, i, before_ms, after_ms):
    """The quietest point (least hiss) within -before_ms..+after_ms of sample i."""
    lo, hi = max(0, i - SR * before_ms // 1000), min(len(a) - 1, i + SR * after_ms // 1000)
    if hi <= lo:
        return i
    e = hf(a[lo:hi])
    return lo + int(np.argmin(e))


def piece(target, before, after):
    """`target` said between the words `before` and `after`, cut out at the quietest points
    near its edges, so no hiss or burst from a neighbor comes along (the first version cut a
    fixed 60 ms early and kept the "s" of "plus")."""
    tok = core.kokoro.tokenizer.tokenize
    pre = (ph(before) + " ") if before else ""
    post = (" " + ph(after)) if after else "."
    ps = ph(target)
    toks = tok(pre + ps + post)
    style = core.kokoro.voices[VOICE][len(toks)]
    audio, dur = core.session().run(None, {"tokens": [[0, *toks, 0]], "style": style, "speed": np.array([SPEED], np.float32)})
    audio, dur = audio.reshape(-1), dur.reshape(-1)
    spf = len(audio) / dur.sum()
    i0 = 1 + len(tok(pre))
    i1 = i0 + len(tok(ps))
    s0 = int(dur[:i0].sum() * spf)
    s1 = int(dur[:i1].sum() * spf)
    s0 = snap(audio, s0, 45, 15) if pre else 0
    s1 = snap(audio, s1, 15, 45) if after else len(audio)
    a = audio[s0:s1].astype(np.float32).copy()
    n, o = SR * 6 // 1000, SR * 25 // 1000
    a[:n] *= np.linspace(0, 1, n)
    a[-o:] *= np.linspace(1, 0, o)
    return a


def first(n):
    return piece(n, "", "minus one is nine.")


def middle(n):
    return piece(n, "two divided by", "is nine.")


def is_answer(n):
    """ "is fifteen" as one piece, so nothing is cut right after the "z" of "is"."""
    return piece("is " + n, "two plus two", "")


def last_of_problem(n):
    return piece(n, "two divided by", "")


def op_word(op):
    return piece(OP[op], "one", "eight is ten.")


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
            "fact-stitched": join([first(w["x"]), op_word(p["op"]), middle(w["y"]), is_answer(w["ans"])]),
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

# Renders clips with Kokoro and encodes them as MP3:
#   python generate.py <model-dir> <missing.json> <out-dir>
# missing.json is a list of { key, kind, text, voice, speed } from build.mjs.
# Every line is said as one recording (kokoro.create), trimmed. Problems ("q") are stored in
# lowercase without punctuation, as the app asks for them, and said as a sentence.
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # kokoro.sh runs this with -I
import kokoro_core as core  # noqa: E402
from kokoro_core import mp3, trim  # noqa: E402


def sentence(kind, text):
    if kind == "q":
        return text[0].upper() + text[1:] + "."
    return text


def main():
    model_dir, plan_path, out_dir = sys.argv[1:4]
    core.load(model_dir)
    items = json.load(open(plan_path))
    for i, item in enumerate(items, 1):
        audio, sr = core.kokoro.create(sentence(item["kind"], item["text"]), voice=item["voice"], speed=item["speed"], lang="en-us")
        with open(os.path.join(out_dir, item["key"] + ".mp3"), "wb") as f:
            f.write(mp3(trim(audio, sr), sr))
        if i % 50 == 0 or i == len(items):
            print(f"recorded {i}/{len(items)}", flush=True)


if __name__ == "__main__":
    main()

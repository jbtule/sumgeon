#!/bin/sh
# Renders the whole-vs-stitched listen test: sh scripts/audio/listen-test.sh <model-dir> <out-dir>
# <model-dir> holds kokoro-v1.0.onnx and voices-v1.0.bin (from kokoro-onnx's model-files-v1.0
# release, the same hashes as Sound Box's kokoro.sh) and gets a Linux venv. Kokoro runs in
# a Linux container (Apple's `container`), since the macOS espeak-ng wheel is broken.
set -eu
root=$(cd "$(dirname "$0")/../.." && pwd)
models=$(cd "$1" && pwd)
mkdir -p "$2"
out=$(cd "$2" && pwd)
# The problems and their spoken text, from the app's own module.
node --input-type=module -e "
import { spokenProblem, spokenFact, spoken } from '$root/js/problems.js';
const ps = [[3, '+', 4], [7, '+', 8], [9, '-', 5], [6, '×', 7], [56, '÷', 8]].map(([x, op, y]) => {
  const ans = { '+': x + y, '-': x - y, '×': x * y, '÷': x / y }[op], p = { x, op, y, ans };
  return { x, op, y, ans, q: x + ' ' + op + ' ' + y, words: { x: spoken(x), y: spoken(y), ans: spoken(ans), problem: spokenProblem(p), fact: spokenFact(p) } };
});
process.stdout.write(JSON.stringify(ps));
" > "$out/problems.json"
container run --rm --memory 4G \
  --mount type=virtiofs,source="$root/scripts/audio",target=/a \
  --mount type=virtiofs,source="$models",target=/w \
  --mount type=virtiofs,source="$out",target=/o \
  docker.io/library/python:3.12-slim sh -c '
    cd /w && { [ -x venv/bin/python ] || python3 -m venv venv; } &&
    venv/bin/pip install --quiet --disable-pip-version-check --require-hashes -r /a/requirements.txt &&
    venv/bin/python -I /a/listen_test.py /w /o/problems.json /o'

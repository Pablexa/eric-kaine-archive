"""Render Bleoodity's chat lines in a cloned voice.

The site owner supplied a recording for Bleoodity's voice (their own, or from
someone who gave permission) and asked for it to be cloned. Same pipeline as
clone_eric.py: Piper TTS speaks each line, kNN-VC converts it to the
reference voice. Output: public/media/voice/bleoodity/*.mp3 plus
manifest.json, read by src/lib/audio/voice.ts. Re-run after editing
Bleoodity's lines; the reference recording is deliberately not committed.

Run (see clone_eric.py for the one-time setup):
  python scripts/voice/clone_bleoodity.py --ref "bleoodity voice.mp3" \
      --knnvc ../voice-tools/knn-vc --piper-model ../voice-tools/en_US-ryan-medium.onnx
"""
import argparse, re, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from clone_eric import ROOT, STR, CALL, unescape, render_voice  # noqa: E402

OUT = ROOT / 'public/media/voice/bleoodity'
SCENES = ROOT / 'src/components/troll'
BARKS = ['mhm.', 'yeah.', 'slatt.', 'cheese.', 'nah.', 'what.', 'okay.', 'stop.', 'huh.', 'ow.']

# files where Bleoodity talks; arrays whose entries she posts (and how they are shown)
FILES = ['scenes/TwistScene.tsx', 'scenes/LabelScene.tsx', 'scenes/FoodFightScene.tsx', 'scenes/BrainrotScene.tsx',
         'scenes/MoshScene.tsx', 'scenes/LegendScene.tsx', 'ChaosLayer.tsx']
ARRAYS = {'scenes/MoshScene.tsx': [('LINES', str)], 'scenes/FoodFightScene.tsx': [('LINES', str)],
          'scenes/BrainrotScene.tsx': [('SPAM', str.lower)], 'ChaosLayer.tsx': [('POKE_LINES_BLEOODITY', str)]}
HELPER = re.compile(r'\bbleoodity\(\s*' + STR)
FIELD = re.compile(r'\bline:\s*' + STR)


def literal(m: re.Match) -> str | None:
    quote, text = m.group(1), m.group(2)
    return None if quote == '`' and '${' in text else unescape(text).strip()


def extract() -> list[str]:
    lines: set[str] = set()
    for rel in FILES:
        code = (SCENES / rel).read_text(encoding='utf-8')
        for m in CALL.finditer(code):
            if 'bleoodity' in (m.group(3) or '') and (t := literal(m)):
                lines.add(t)
        for m in HELPER.finditer(code):
            if t := literal(m):
                lines.add(t)
        if rel.endswith('LabelScene.tsx'):
            for m in FIELD.finditer(code):
                if t := literal(m):
                    lines.add(t)
        for name, shown in ARRAYS.get(rel, []):
            arr = re.search(r'const\s+' + name + r'\s*=\s*\[(.*?)\]', code, re.S)
            for m in re.finditer(STR, arr.group(1) if arr else ''):
                if t := literal(m):
                    lines.add(shown(t))
    return sorted(l for l in lines if re.search('[a-z]', l, re.I) and len(l) <= 160)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', required=True, help='the Bleoodity voice recording (any format ffmpeg reads)')
    ap.add_argument('--knnvc', required=True, help='path to a bshall/knn-vc checkout')
    ap.add_argument('--piper-model', required=True)
    ap.add_argument('--piper', default=shutil.which('piper') or 'piper')
    ap.add_argument('--list', action='store_true', help='only print the extracted lines')
    ap.add_argument('--resume', action='store_true', help='keep clips already rendered')
    args = ap.parse_args()
    lines = extract()
    if args.list:
        print('\n'.join(lines)); print(len(lines), 'lines', file=sys.stderr); return
    render_voice(lines, BARKS, OUT, args.ref, args.knnvc, args.piper_model, args.piper, resume=args.resume)


if __name__ == '__main__':
    main()

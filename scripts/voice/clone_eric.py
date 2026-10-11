"""Render Eric Kaineity's chat lines in the site owner's cloned voice.

The owner recorded their own voice and asked for it to be cloned for the
Eric Kaineity character. Pipeline: Piper TTS (en_US ryan, MIT) speaks each
line, then kNN-VC (bshall/knn-vc, MIT) converts it to the owner's voice using
their recording as the matching set. Output: public/media/voice/eric/*.mp3
plus manifest.json ({ lines: {text: file}, barks: [file] }), which
src/lib/audio/voice.ts reads at runtime. Lines are keyed by their exact text,
so re-run this after editing guide chat lines.

Setup (one time, any machine with Python 3.11+ and ffmpeg):
  python -m venv .venv && .venv/bin/pip install torch torchaudio soundfile piper-tts
  git clone https://github.com/bshall/knn-vc ../knn-vc
  # weights from the GitHub releases into ~/.cache/torch/hub/checkpoints/:
  #   knn-vc v0.1: prematch_g_02500000.pt, WavLM-Large.pt
  # piper voice (rhasspy/piper v0.0.2): voice-en-us-ryan-medium.tar.gz, extracted
Run:
  .venv/bin/python scripts/voice/clone_eric.py --ref owner-voice.mp3 \
      --knnvc ../knn-vc --piper-model en-us-ryan-medium.onnx
The owner's raw recording is deliberately not committed.
"""
import argparse, hashlib, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/media/voice/eric'
# Act IV belongs to Bleoodity (real Bleood snippets), so its files are skipped.
SKIP = {'LabelScene.tsx', 'FoodFightScene.tsx', 'BrainrotScene.tsx', 'MoshScene.tsx', 'LegendScene.tsx', 'StreamOverlay.tsx'}
BARKS = ['yo.', 'chat.', 'bro.', 'nah.', 'what.', 'okay.', 'stop.', 'gatekeep.', 'huh.', 'no.']

STR = r"""(['"`])((?:\\.|(?!\1).)*?)\1"""
CALL = re.compile(r'(?:chat\.say|chat\.post|\bsay)\(\s*' + STR + r'\s*(,[^)\n]*)?\)')
ARRAY = re.compile(r'const\s+[A-Z_]*(?:LINES|REMARKS|TAUNTS|QUIPS)[A-Z_]*\s*=\s*\[(.*?)\]', re.S)


def unescape(s: str) -> str:
    return s.replace("\\'", "'").replace('\\"', '"').replace('\\n', ' ')


def extract() -> list[str]:
    lines: set[str] = set()
    for f in sorted((ROOT / 'src').rglob('*.ts*')):
        if f.name in SKIP or 'professional' in f.parts:
            continue
        code = f.read_text(encoding='utf-8')
        for m in CALL.finditer(code):
            quote, text, rest = m.group(1), m.group(2), m.group(3) or ''
            if 'bleoodity' in rest or 'system' in rest or (quote == '`' and '${' in text):
                continue
            lines.add(unescape(text).strip())
        for arr in ARRAY.finditer(code):
            for m in re.finditer(STR, arr.group(1)):
                if m.group(1) == '`' and '${' in m.group(2):
                    continue
                lines.add(unescape(m.group(2)).strip())
    return sorted(l for l in lines if re.search('[a-z]', l, re.I) and len(l) <= 160)


def speakable(text: str) -> str:
    # TTS-friendly spelling; the on-screen text is unchanged.
    t = text.replace('…', '... ').replace('—', ', ').replace('’', "'")
    t = re.sub(r'\bpls\b', 'please', t, flags=re.I)
    t = re.sub(r'\bu\b', 'you', t, flags=re.I)
    t = re.sub(r'\bur\b', 'your', t, flags=re.I)
    return t


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--ref', required=True, help="owner's voice recording (any format ffmpeg reads)")
    ap.add_argument('--knnvc', required=True, help='path to a bshall/knn-vc checkout')
    ap.add_argument('--piper-model', required=True)
    ap.add_argument('--piper', default=shutil.which('piper') or 'piper')
    ap.add_argument('--list', action='store_true', help='only print the extracted lines')
    args = ap.parse_args()

    lines = extract()
    if args.list:
        print('\n'.join(lines)); print(len(lines), 'lines', file=sys.stderr); return

    render_voice(lines, BARKS, OUT, args.ref, args.knnvc, args.piper_model, args.piper)


def render_voice(lines: list[str], barks: list[str], out: Path, ref_audio: str, knnvc: str, piper_model: str, piper: str, resume: bool = False) -> None:
    """Speak each line with Piper, convert it to the reference voice with kNN-VC, write mp3s + manifest.json to `out`.

    `resume` keeps clips already rendered (same text → same file name) instead of starting over.
    """
    import soundfile as sf, torch, torchaudio

    def _load(path, *_, **__):
        data, sr = sf.read(str(path), dtype='float32', always_2d=True)
        return torch.from_numpy(data.T.copy()), sr
    torchaudio.load = _load  # torchaudio>=2.9 needs torchcodec for load(); soundfile is enough here

    sys.path.insert(0, str(Path(knnvc).resolve()))
    from hubconf import knn_vc
    torch.set_num_threads(max(1, torch.get_num_threads()))
    vc = knn_vc(pretrained=True, progress=False, prematched=True, device='cpu')

    out.mkdir(parents=True, exist_ok=True)
    if not resume:
        for old in out.glob('*.mp3'):
            old.unlink()
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        ref = tmp / 'ref.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', ref_audio, '-ac', '1', '-ar', '16000', '-af', 'highpass=f=70', str(ref)], check=True)
        matching = vc.get_matching_set([str(ref)])

        def render(text: str) -> str:
            name = hashlib.sha1(text.encode('utf-8')).hexdigest()[:12] + '.mp3'
            if resume and (out / name).exists():
                return name
            raw, wav16, conv = tmp / 'tts.wav', tmp / 'tts16.wav', tmp / 'conv.wav'
            subprocess.run([piper, '-m', piper_model, '-f', str(raw)], input=speakable(text).encode(), check=True, capture_output=True)
            # pad with silence: very short lines are otherwise too short for kNN-VC's loudness gate
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-ac', '1', '-ar', '16000', '-af', 'adelay=300,apad=pad_dur=0.4', str(wav16)], check=True)
            converted = vc.match(vc.get_features(str(wav16)), matching, topk=4)
            sf.write(conv, converted.numpy(), 16000)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(conv), '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '22050', '-ac', '1', '-b:a', '48k', str(out / name)], check=True)
            return name

        manifest = {'lines': {}, 'barks': []}
        for i, text in enumerate(lines, 1):
            try:
                manifest['lines'][text] = render(text)
                print(f'{i}/{len(lines)} {text}', flush=True)
            except Exception as e:  # one bad line should not sink the batch; it falls back to a bark
                print(f'{i}/{len(lines)} SKIPPED {text!r}: {e}', flush=True)
        manifest['barks'] = [render(b) for b in barks]
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print('wrote', len(manifest['lines']), 'lines and', len(manifest['barks']), 'barks to', out)


if __name__ == '__main__':
    main()

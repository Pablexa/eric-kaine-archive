"""Render Eric Kaineity's and Bleoodity's lines with the owner's fish.audio voice models.

The owner made both voice models from their own (modified) voice and asked
for them to replace the kNN-VC clones. Same output as clone_eric.py /
clone_bleoodity.py (public/media/voice/<who>/<sha1>.mp3 + manifest.json),
so the site needs no other change. The API key is read from the environment
and never written anywhere.

  FISH_API_KEY=... python scripts/voice/fish_voices.py [--only eric|bleoodity] [--model s1]
"""
import argparse, hashlib, json, os, subprocess, sys, tempfile, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import clone_bleoodity  # noqa: E402
import clone_eric  # noqa: E402

ROOT = clone_eric.ROOT
API = 'https://api.fish.audio/v1/tts'
VOICES = {
    'eric': ('ff1374f505b24744a334d20b8fece6fe', clone_eric.extract, clone_eric.BARKS, ROOT / 'public/media/voice/eric'),
    'bleoodity': ('8a63edafb408416bba26f089d6c708d5', clone_bleoodity.extract, clone_bleoodity.BARKS, ROOT / 'public/media/voice/bleoodity'),
}


def tts(text: str, ref: str, key: str, model: str) -> bytes:
    body = json.dumps({'text': clone_eric.speakable(text), 'reference_id': ref, 'format': 'mp3', 'mp3_bitrate': 128, 'normalize': True, 'latency': 'normal'}).encode()
    req = urllib.request.Request(API, data=body, method='POST', headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'model': model})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code}: {e.read()[:300]!r}') from None


def render(text: str, ref: str, key: str, model: str, out: Path) -> str:
    name = hashlib.sha1(text.encode('utf-8')).hexdigest()[:12] + '.mp3'
    audio = tts(text, ref, key, model)
    with tempfile.TemporaryDirectory() as tmp:
        raw, done = Path(tmp) / 'raw.mp3', Path(tmp) / 'done.mp3'
        raw.write_bytes(audio)
        # same loudness and format as the other voice clips; the old clip is replaced only once this succeeded
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '22050', '-ac', '1', '-b:a', '64k', str(done)], check=True)
        os.replace(done, out / name)
    return name


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', choices=list(VOICES))
    ap.add_argument('--model', default=os.environ.get('FISH_MODEL', 's1'))
    ap.add_argument('--workers', type=int, default=6)
    args = ap.parse_args()
    key = os.environ.get('FISH_API_KEY', '')
    if not key:
        sys.exit('set FISH_API_KEY')
    for who, (ref, extract, barks, out) in VOICES.items():
        if args.only and who != args.only:
            continue
        lines = extract()
        texts = lines + [b for b in barks if b not in lines]
        out.mkdir(parents=True, exist_ok=True)
        # the previous voice (kNN-VC clone) stays as the fallback for any line fish.audio cannot render
        try:
            old = json.loads((out / 'manifest.json').read_text(encoding='utf-8'))
        except Exception:
            old = {'lines': {}, 'barks': []}
        old_lines: dict[str, str] = old.get('lines', {})
        old_barks: list[str] = old.get('barks', [])
        # one line first, so a bad key or model fails before the batch
        try:
            first = render(texts[0], ref, key, args.model, out)
        except Exception as e:
            print(f'[{who}] fish.audio failed ({e}); keeping the previous voice untouched', flush=True)
            continue
        print(f'[{who}] 1/{len(texts)} ok', flush=True)
        names = {texts[0]: first}
        failed: list[str] = []

        def job(text: str):
            try:
                return text, render(text, ref, key, args.model, out)
            except Exception as e:  # keep going; a missing line falls back to a bark
                print(f'[{who}] FAILED {text!r}: {e}', flush=True)
                return text, None

        with ThreadPoolExecutor(args.workers) as pool:
            for i, (text, name) in enumerate(pool.map(job, texts[1:]), 2):
                if name:
                    names[text] = name
                else:
                    failed.append(text)
                if i % 20 == 0:
                    print(f'[{who}] {i}/{len(texts)}', flush=True)
        kept = 0
        final_lines: dict[str, str] = {}
        for t in lines:
            if t in names:
                final_lines[t] = names[t]
            elif t in old_lines and (out / old_lines[t]).exists():
                final_lines[t] = old_lines[t]
                kept += 1
        final_barks = [names[b] for b in barks if b in names] or [b for b in old_barks if (out / b).exists()]
        manifest = {'lines': final_lines, 'barks': final_barks}
        (out / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
        keep = set(final_lines.values()) | set(final_barks)
        for stale in out.glob('*.mp3'):
            if stale.name not in keep:
                stale.unlink()
        print(f'[{who}] {len(names)} new clips; {kept} lines kept their previous voice; failed {len(failed)}', flush=True)


if __name__ == '__main__':
    main()

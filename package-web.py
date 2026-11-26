#!/usr/bin/env python3
"""Package only the static game; no server, tests, saves or development files."""
from pathlib import Path
import json
import re
import zipfile

root = Path(__file__).resolve().parent
version = json.loads((root / 'package.json').read_text())['version']
release = json.loads((root / 'release-notes.json').read_text())
assert release['version'] == version, 'Update release-notes.json for the new version'
(root / 'version.json').write_text(json.dumps(release, ensure_ascii=False) + '\n')
files = [root / 'version.json', root / 'index.html', root / 'style.css', root / '.nojekyll', root / 'intro.mp4', root / 'new-boat.mp4', root / 'man-overboard.mp4', root / 'special-catch.mp4', root / 'another-lost.mp4', root / 'tow.mp4', *sorted(root.glob('*.mjs'))]
audio = ['calm-sea-01.mp3', 'calm-sea-02.mp3', 'medium-sea-01.mp3', 'medium-sea-02.mp3', 'heavy-sea-01.mp3']
assert set(re.findall(r"'([a-z0-9-]+\.mp3)'", (root / 'weather-music.mjs').read_text())) == set(audio)
files.extend(root / name for name in audio)
for path in files:
    if path.suffix in {'.mp4', '.mp3'}:
        continue
    for target in re.findall(r'''(?:from\s+|src=|href=)["'](\.?\.?/)?([^"']+\.(?:mjs|css))(?:\?[^"']*)?["']''', path.read_text()):
        assert (path.parent / ''.join(target)).is_file(), (path.name, target)
output = root / 'dist' / f'dangerous-waters-{version}-web.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, path.name)
    archive.write(root / 'docs' / 'hosting.md', 'HOSTING.md')
    archive.write(root / 'docs' / 'geography.md', 'GEOGRAPHY.md')
    archive.write(root / "integrations/firebase/SDK-LICENSE", "FIREBASE-SDK-LICENSE")
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert all('/' not in name for name in archive.namelist())
print(f'{output}\n{len(files)} game files; {output.stat().st_size:,} bytes')

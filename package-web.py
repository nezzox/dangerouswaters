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
files = [root / 'version.json', root / 'index.html', root / 'style.css', root / '.nojekyll', root / 'intro.mp4', *sorted(root.glob('*.mjs'))]
for path in files:
    if path.suffix == '.mp4':
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
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert all('/' not in name for name in archive.namelist())
print(f'{output}\n{len(files)} game files; {output.stat().st_size:,} bytes')

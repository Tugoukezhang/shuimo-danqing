#!/usr/bin/env python3
"""Reassemble verified encrypted chunks, decrypt to a new ZIP, and verify its digest."""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for data in iter(lambda: f.read(1024 * 1024), b''):
            h.update(data)
    return h.hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--key', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / 'manifest.json').read_text())
    if args.out.exists():
        raise SystemExit('Choose a new output filename.')
    with tempfile.TemporaryDirectory(dir=args.out.resolve().parent) as temp:
        work = Path(temp)
        cipher = work / 'backup.gpg'
        with cipher.open('wb') as dest:
            for p in manifest['parts']:
                raw = (root / p['path']).read_bytes()
                if len(raw) != p['size'] or hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest() != p['sha']:
                    raise SystemExit('Invalid chunk: '+p['path'])
                dest.write(raw)
        if digest(cipher) != manifest['cipher_sha256']:
            raise SystemExit('Encrypted archive checksum mismatch.')
        output = work / 'project.zip'
        subprocess.run(['gpg','--batch','--no-symkey-cache','--homedir',str(work),'--pinentry-mode','loopback','--passphrase-file',str(args.key.resolve()),'--output',str(output),'--decrypt',str(cipher)],check=True)
        if digest(output) != manifest['zip_sha256']:
            raise SystemExit('Restored ZIP checksum mismatch.')
        output.rename(args.out)
    print('Restored and verified:',args.out)
if __name__ == '__main__':
    main()

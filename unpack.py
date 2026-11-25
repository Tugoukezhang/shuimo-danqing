"""Run python unpack.py --key PRIVATE_FILE --out NEW.zip (requires cryptography)."""
import argparse,base64,hashlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
p=argparse.ArgumentParser()
p.add_argument('--key',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parent
data=b''.join(f.read_bytes() for f in sorted(root.glob('r16-part-*.aes')))
cipher=AESGCM(hashlib.sha256(base64.b64decode(a.key.read_bytes())).digest())
plain=cipher.decrypt(data[:12],data[12:],b'kitchen-R16')
assert hashlib.sha256(plain).hexdigest()=='6cd40d3f0949360c4f0f968b336085c8448f042ac4096bd60dc54b5b4232630e'
with a.out.open('xb') as f:f.write(plain)

"""Run python unpack.py --key PRIVATE_FILE --out NEW.zip (requires cryptography)."""
import argparse,base64,hashlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
p=argparse.ArgumentParser()
p.add_argument('--key',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parent
data=b''.join(f.read_bytes() for f in sorted(root.glob('r12-part-*.aes')))
cipher=AESGCM(hashlib.sha256(base64.b64decode(a.key.read_bytes())).digest())
plain=cipher.decrypt(data[:12],data[12:],b'kitchen-R12')
assert hashlib.sha256(plain).hexdigest()=='6d879fe084b56122e1ccdbbde9f90b21e56b42ae29c8774065b24a6ca039adda'
with a.out.open('xb') as f:f.write(plain)

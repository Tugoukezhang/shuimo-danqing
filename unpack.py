"""Run python unpack.py --key PRIVATE_FILE --out NEW.zip (requires cryptography)."""
import argparse,base64,hashlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
p=argparse.ArgumentParser()
p.add_argument('--key',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parent
data=b''.join(f.read_bytes() for f in sorted(root.glob('r5-part-*.aes')))
cipher=AESGCM(hashlib.sha256(base64.b64decode(a.key.read_bytes())).digest())
plain=cipher.decrypt(data[:12],data[12:],b'kitchen-R5')
assert hashlib.sha256(plain).hexdigest()=='6afaaacd58e1dbf94914e04dfa69163399804b90b6e2be3f4064a97e4a5f1778'
with a.out.open('xb') as f:f.write(plain)

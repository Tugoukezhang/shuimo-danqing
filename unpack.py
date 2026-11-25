"""Run python unpack.py --key PRIVATE_FILE --out NEW.zip (requires cryptography)."""
import argparse,base64,hashlib
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
p=argparse.ArgumentParser()
p.add_argument('--key',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parent
data=b''.join(f.read_bytes() for f in sorted(root.glob('r14-part-*.aes')))
cipher=AESGCM(hashlib.sha256(base64.b64decode(a.key.read_bytes())).digest())
plain=cipher.decrypt(data[:12],data[12:],b'kitchen-R14')
assert hashlib.sha256(plain).hexdigest()=='e5154716ec27086f1366b884fae87ffa8cb3f68d2bfa1a3c1207d263518d9d3d'
with a.out.open('xb') as f:f.write(plain)

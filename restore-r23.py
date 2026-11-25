"""python restore-r23.py --key PRIVATE_FILE --out NEW.zip"""
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import argparse,base64,hashlib,io,struct
p=argparse.ArgumentParser();p.add_argument('--key',required=True,type=Path);p.add_argument('--out',required=True,type=Path);args=p.parse_args()
root=Path(__file__).resolve().parent
cipher=AESGCM(hashlib.sha256(base64.b64decode(args.key.read_bytes())).digest())
def decrypt(version):
 data=b''.join(f.read_bytes() for f in sorted(root.glob(f'r{version}-part-*.aes')))
 return cipher.decrypt(data[:12],data[12:],f'kitchen-R{version}'.encode())
def apply_delta(base,patch):
 delta=io.BytesIO(patch);expected=delta.read(32);result=io.BytesIO()
 while op:=delta.read(1):
  if op==b'C':
   start,count=struct.unpack('>II',delta.read(8));result.write(base[start:start+count])
  elif op==b'D':
   count,=struct.unpack('>I',delta.read(4));result.write(delta.read(count))
  else:raise ValueError('Invalid patch operation')
 if hashlib.sha256(result.getbuffer()).digest()!=expected:raise ValueError('Archive digest mismatch')
 return result.getvalue()
base=apply_delta(decrypt(17),decrypt(21))
result=apply_delta(apply_delta(base,decrypt(22)),decrypt(23))
with args.out.open('xb') as f:f.write(result)

import requests
b='http://127.0.0.1:59212/api'
r=requests.post(b+'/auth/admin-login', json={'username':'admin','password':'admin123'})
t=r.json()['data']['token']
H={'Authorization':'Bearer '+t}
for path in ['/admin/suppliers','/admin/risk/logs','/admin/settlements','/admin/card-pool','/admin/card-pool/crypto-logs']:
    r=requests.get(b+path, headers=H, params={'page':1,'pageSize':5})
    d=r.json()
    t2=type(d.get('data')).__name__
    if isinstance(d.get('data'), dict):
        ks=list(d['data'].keys())[:5]
    elif isinstance(d.get('data'), list):
        ks='len='+str(len(d['data']))
    else:
        ks=str(d.get('data'))[:80]
    print(path.ljust(40), 'ok=', d.get('success'), 'type=', t2, 'keys=', ks)

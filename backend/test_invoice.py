import urllib.request
import urllib.error
import json

data = {
    "invoice_number": "INV1001",
    "date": "2024-03-20"
}
req = urllib.request.Request(
    'http://localhost:8000/api/invoices',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    urllib.request.urlopen(req)
    print("Success")
except urllib.error.HTTPError as e:
    print("Error:", e.code)
    print(e.read().decode())

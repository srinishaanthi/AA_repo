import urllib.request
import urllib.error
try:
    urllib.request.urlopen(urllib.request.Request('http://localhost:8000/api/number-series/invoice/next', method='POST'))
except urllib.error.HTTPError as e:
    print(e.read().decode())

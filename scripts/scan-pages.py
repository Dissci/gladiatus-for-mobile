# Layout complexity per saved page (docs/ANALYSIS.md §1.3).
# Usage: python -I scripts/scan-pages.py <folder of saved pages>
import sys,re,glob,os
rows=[]
for f in sorted(glob.glob(os.path.join(sys.argv[1],'**','*.htm*'),recursive=True)):
    s=open(f,encoding='utf-8',errors='replace').read()
    body=re.search(r'<body[^>]*id="([^"]*)"',s)
    c=s.find('id="content"'); cs=s[c:] if c>0 else s
    fixed=re.findall(r'width:\s*(\d{3,4})px',cs)
    big=sorted({int(x) for x in fixed if int(x)>=360},reverse=True)[:5]
    rows.append((os.path.relpath(f,sys.argv[1]),body.group(1) if body else '-',
      len(re.findall(r'<table',cs)),
      len(re.findall(r'ui-draggable',cs)),
      len(re.findall(r'data-tooltip=',cs)),
      len(re.findall(r'position:\s*absolute',cs)),
      len(re.findall(r'<iframe',s)),
      len(re.findall(r'<(?:input|select|button)',cs)),
      big))
print(f"{'page':48} {'body':22} tbl drag tip abs ifr form bigwidths")
for r in rows: print(f"{r[0][:48]:48} {r[1][:22]:22} {r[2]:3} {r[3]:4} {r[4]:3} {r[5]:3} {r[6]:3} {r[7]:4} {r[8]}")

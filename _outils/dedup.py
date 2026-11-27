#!/usr/bin/env python3
"""Retire les liens partenaires en double exact sur une même page (garde le premier). Usage : python3 _outils/dedup.py [dossier] -w"""
import re,glob,sys,html
A=re.compile(r'<a\b[^>]*href="(https://www\.(?:viator|getyourguide)[^"]*)"[^>]*>.*?</a>',re.S)
def norm(h): return html.unescape(h)
def run(root,write):
    tot_before=tot_after=pages=0
    for f in glob.glob(root+'/**/index.html',recursive=True):
        s=open(f).read()
        mm=re.search(r'<main.*?</main>',s,re.S)
        if not mm: continue
        m=mm.group(0); seen=set(); n0=len(A.findall(m))
        def rep(x):
            h=norm(x.group(1))
            if h in seen: return ''
            seen.add(h); return x.group(0)
        m2=A.sub(rep,m)
        # cards whose button row became empty -> remove card
        m2=re.sub(r'<li class="act">(?:(?!</li>).)*?<p class="act__btns">\s*</p>\s*</li>','',m2,flags=re.S)
        m2=re.sub(r'<p class="act__btns">\s*</p>','',m2)
        m2=re.sub(r'<ul class="acts">\s*</ul>','',m2)
        m2=re.sub(r'<p class="live__all">\s*</p>','',m2)
        n1=len(A.findall(m2)); tot_before+=n0; tot_after+=n1
        if m2!=m:
            pages+=1
            if write: open(f,'w').write(s.replace(m,m2))
    print(root.split('/')[-1],'pages modifiées',pages,'liens',tot_before,'->',tot_after)
roots=[a for a in sys.argv[1:] if a!='-w'] or ['/home/claude/clicandsite-guide','/home/claude/clicandsite-guide-en']
for r in roots: run(r,'-w' in sys.argv)

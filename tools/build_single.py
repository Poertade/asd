#!/usr/bin/env python3
"""Gera uma versão de arquivo único do jogo (scripts e imagem embutidos).

Uso: python3 tools/build_single.py [saida.html] [--fragment] [--src=pasta]
  --fragment  omite <!doctype>/<html>/<head>/<body> (para hospedagens que já fornecem o esqueleto)
  --src=pasta gera a partir de outro jogo (ex.: --src=vale-dos-monstrinhos)
"""
import base64, re, sys, pathlib

repo = pathlib.Path(__file__).resolve().parent.parent
src = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--src=')), '')
root = repo / src if src else repo
args = [a for a in sys.argv[1:] if not a.startswith('--')]
fragment = '--fragment' in sys.argv
out = pathlib.Path(args[0]) if args else repo / 'dist' / ((src or 'farol-de-cinzas') + '.html')

html = (root / 'index.html').read_text(encoding='utf-8')
imgp = root / 'assets' / 'ticao.png'
img = base64.b64encode(imgp.read_bytes()).decode() if imgp.exists() else ''
scripts = re.findall(r'<script src="([^"]+)"></script>', html)
code = '\n'.join((root / s).read_text(encoding='utf-8') for s in scripts)
pre = f'<script>window.TICAO_DATA_URL="data:image/png;base64,{img}";</script>\n' if img else ''
inline = f'{pre}<script>\n{code}\n</script>'
html = re.sub(r'(<script src="[^"]+"></script>\n?)+', lambda m: inline + '\n', html, count=1)

if fragment:
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
    html = head.strip() + '\n' + body.strip() + '\n'

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out} ({out.stat().st_size // 1024} KB)')

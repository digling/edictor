# author   : Johann-Mattis List
# email    : mattis.list@uni-marburg.de
# created  : 2015-07-07 11:17
# modified : 2016-03-20 10:27
"""
Converst markdown to html
"""

__author__="Johann-Mattis List"
__date__="2016-03-20"

import markdown
import sys
import re

if len(sys.argv) == 1:
    print("Usage: python markitdown.py infile")

f = open(sys.argv[1]).read()

st = [
        (':bib:', 'http://bibliography.lingpy.org?key='),
        (':wiki', 'http://en.wikipedia.org/wiki/')
        ]

refs = re.findall(':bib:([A-Za-z0-9]+)', f)
if refs:
    from lingpy.plugins.bibtex.bibtex import BibTex
    bib = BibTex('')
else:
    bib = []

for s,t in st:
    f = f.replace(s,t)

f += '\n'
if bib:
    f += '### References\n'
    for r in sorted(set(refs)):
        rf = bib.format(r, 'html')
        if rf == 'null':
            rf = '?'+'<font color="red">'+r+'</font>'
        f += '* '+ rf + '\n'

o = markdown.markdown(f, extensions=['markdown.extensions.tables'])
o = o.replace('<a ', '<a target="_blank" ')

template = """
{0}
"""
with open(sys.argv[1].replace('.md','.html'), 'w') as ofile:
    ofile.write(template.format(o))


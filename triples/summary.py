#!/usr/bin/python2.6
import cgitb
cgitb.enable()
import cgi
import sqlite3
import datetime

print "Content-type: text/plain; charset=utf-8"

# get the args of the url, convert nasty field storage to plain dictionary,
# there is probably a better solution, but this works for the moment
tmp_args = cgi.FieldStorage()
args = {}
for arg in tmp_args:
    args[arg] = tmp_args[arg].value

# check for dbase arg and switch the database in case an argument is provided
if 'remote_dbase' in args:
    dbpath = args['remote_dbase']+'.sqlite3' if not \
            args['remote_dbase'].endswith('sqlite3') else \
            args['remote_dbase']
else:
    dbpath = 'triples.sqlite3'

# connect to the sqlite database
db = sqlite3.connect(dbpath)
cursor = db.cursor()

if 'summary' in args and 'file' in args:
    taxa = [line[0] for line in cursor.execute(
            'select distinct VAL from '+args['file']+' where COL="DOCULECT";'
            )]
    concepts = [line[0] for line in cursor.execute(
        'select distinct VAL from '+args['file'] + ' where COL="CONCEPT";'
        )]

    columns = [line[0] for line in cursor.execute(
        'select distinct COL from '+args['file']+';')]

    tstring = ''
    for t in sorted(taxa):
        tstring += '<option value="'+t.encode('utf-8')+'">'+t.encode('utf-8')+'</option>'
    cstrings = []
    for t in sorted(concepts):
        cstrings += ['<option value="'+t.encode('utf-8')+'">'+t.encode('utf-8')+'</option>']
    colstring = ''
    for t in sorted(columns):
        colstring += '<option value="'+t.encode('utf-8')+'">'+t.encode('utf-8')+'</option>'
    
    from template import html1,script

    out = html1.format(
        DOCULECTS = tstring,
        DBASE = args['file'].upper(),
        DLEN = len(taxa),
        CLEN = len(concepts),
        COLEN = len(columns),
        COLUMNS = colstring,
        SCRIPT = script,
        CONCEPTS = '\n'.join(cstrings),
        DBASE2 = args['file'],
        DBASE3 = dbpath
        )

    print 'Content-Type: text/html'
    print
    print out


#!/usr/bin/python2.6
import cgitb
cgitb.enable()
import cgi
import sqlite3
import datetime

print "Content-type: text/plain; charset=utf-8"

# get the args of the url, convert nasty field storage to plain dictionary,
# there is probably a better solution, but this works for the moment
xargs = dict(
        remote_dbase = '',
        file = '',
        date = '',
        new_id = '',
        tables = '',
        summary = '',
        unique = '',
        columns = '',
        concepts = '',
        doculects = '',
        template = '',
        history = '',
        limit = '',
        )
args = {}
tmp_args = cgi.FieldStorage(environ={'REQUEST_METHOD':'POST'})
for arg in xargs:
    tmp = tmp_args.getvalue(arg)
    if tmp:
        args[arg] = tmp

def get_max_id(args, cursor):

   cursor.execute('select DISTINCT ID from '+args['file']+';')
   linesA = [x[0] for x in cursor.fetchall()]
   cursor.execute(
       'select DISTINCT ID from backup where FILE = "'+args['file']+'";'
       )
   linesB = [x[0] for x in cursor.fetchall()]
   try:
       maxA = max(linesA)
   except ValueError:
       maxA = 0
   try:
       maxB = max(linesB)
   except ValueError:
       maxB = 0
       
   if maxA >= maxB:
       return maxA + 1
   else:
       return maxB + 1

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

# load the table if this is specified
if 'tables' in args:
    print 
    for line in cursor.execute(
    'select name from sqlite_master where name != "backup";'):
        print line[0]

elif 'summary' in args and 'file' in args:
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
        DBASE2 = args['file']
        )

    print 'Content-Type: text/html'
    print
    print out

# return most recent edits in the data
elif 'date' in args:
    print
    cursor.execute(
            'select ID,COL from backup where FILE="'+args['file']+'"'+\
                    ' and datetime(DATE) > datetime('+args['date']+')'+\
                    ' group by ID,COL limit 100;')
    lines = cursor.fetchall()
    data = dict([((a,b),c) for a,b,c in cursor.execute(
            'select * from '+args['file']+';'
            )])
    for line in lines:
        try:
            val = data[line[0],line[1]].encode('utf-8')
            print '{0}\t{1}\t{2}'.format(line[0], line[1], val) 
        except KeyError:
            pass
        
elif 'new_id' in args:
    print
    if args['new_id'] in ['new_id','newid','true']:
        cursor.execute('select DISTINCT ID from '+args['file']+';')
        linesA = [x[0] for x in cursor.fetchall()]
        cursor.execute(
            'select DISTINCT ID from backup where FILE = "'+args['file']+'";'
            )
        linesB = [x[0] for x in cursor.fetchall()]
        try:
            maxA = max(linesA)
        except ValueError:
            maxA = 0
        try:
            maxB = max(linesB)
        except ValueError:
            maxB = 0
            
        if maxA >= maxB:
            print str(maxA + 1)
        else:
            print str(maxB + 1)
    else:
        lines = [x[0] for x in cursor.execute('select DISTINCT VAL from '+args['file']+\
                ' where COL="'+args['new_id']+'";')]
        # dammit but, it doesn't really seem to work without explicit
        # type-checking
        cogids = []
        for l in lines:
            try: cogids += [int(l)]
            except: 
                try:
                    cogids += [int(x) for x in l.split(' ')]
                except: 
                    pass

        print str(max(cogids)+1)

elif 'file' in args and not 'unique' in args:
    print 'Content-Disposition: attachment; filename="triples.tsv"'
    print
    
    # get unique columns
    if not 'columns' in args:
        cols = [line[0] for line in cursor.execute(
            'select distinct COL from '+args['file']+';')]
    else:
        cols = args['columns'].split('|')
    
    print 'ID\t'+'\t'.join(cols)
    
    # if neither concepts or doculects are passed from the args, all ids are
    # selected from the database
    if not 'concepts' in args and not 'doculects' in args:
        idxs = [line[0] for line in cursor.execute(
            'select distinct ID from '+args['file']+';')]
    else:
        # we evaluate the concept string
        cstring = 'COL = "CONCEPT" and VAL in ("'+'","'.join(args['concepts'].split('|'))+'")' if \
                'concepts' in args else ''
        dstring = 'COL = "DOCULECT" and VAL in ("'+'","'.join(args['doculects'].split('|'))+'")' if \
                'doculects' in args else ''
        
        cidxs = [line[0] for line in cursor.execute(
            'select distinct ID from '+args['file'] + ' where '+cstring)] if \
                    cstring else []
        didxs = [line[0] for line in cursor.execute(
            'select distinct ID from '+args['file'] + ' where '+dstring)] if \
                    dstring else []

        if cidxs and didxs:
            idxs = [idx for idx in cidxs if idx in didxs]
        else:
            idxs = cidxs or didxs

    # make the dictionary
    D = {}
    for a,b,c in cursor.execute('select * from '+args['file']+';'):
        if c not in ['-','']:
            try:
                D[a][b] = c.encode('utf-8')
            except KeyError:
                D[a] = {b:c.encode('utf-8')}

    # check for concepts and "template"
    if 'concepts' in args and "template" in args and 'doculects' in args:
        maxidx = get_max_id(args, cursor)
        for doculect in args['doculects'].split('|'):
            
            conceptsIs = [D[idx]['CONCEPT'] for idx in D if 'CONCEPT' in D[idx] and 'DOCULECT' in D[idx] and D[idx]['DOCULECT'] == doculect]
            conceptsMiss = [c for c in args['concepts'].split('|') if c not in conceptsIs]
            for concept in conceptsMiss:
                D[maxidx] = {"CONCEPT":concept, "DOCULECT":doculect, "IPA": '?'}
                idxs += [maxidx]
                maxidx += 1
    
    # make object
    for idx in idxs:
        txt = str(idx)
        for col in cols:
            try:
                txt += '\t'+D[idx][col]
            except:
                txt += '\t'
        print txt

# XXX note that the following formula will bring much faster results:
# select * from table where ID||":"||COL in ("X:Y");
# with this formula we can limit the search space drastically, I think
# addon: it seems this is much faster, but also the fact that:

# * we print only once, XXX addon: this doesn't seem to be the case
# * we use python for sampling, and
# * we don't make many exact sqlite3 statements, this should be kept in mind,
# since it may speed up all the processes!
elif 'history' in args:
    print
    
    if 'limit' in args:
        limit = ' limit ' + args['limit']
    else:
        limit = ''
    cursor.execute(
            'select * from backup order by DATE DESC'+limit+';')
    backup = cursor.fetchall()

    # get ID restriction
    idres = '("'+'","'.join([str(line[1])+':'+line[2] for line in backup])+'")'

    # get the rest
    tables = [] 
    for line in cursor.execute(
        'select name from sqlite_master where name != "backup";'):
        tables += [line[0]]
    
    data = {}
    for table in tables:
        for a,b,c in cursor.execute(
                'select * from '+table+' where ID||":"||COL in '+idres+';'):
            try:
                data[table][a,b] = c
            except KeyError:
                data[table] = {(a,b):c}
    
    txt = ''
    for line in backup:
        try:
            new_val = data[line[0]][line[1],line[2]]
        except KeyError:
            new_val = '???'

        print '{0}\t{1}\t{2}\t{3}\t{4}\t{5}\t{6}'.format(
                line[0],
                line[1],
                line[2],
                line[3].encode('utf-8'),
                new_val.encode('utf-8'),
                str(line[4]),
                line[5])

# if we are requested to submit unique values, we output one value (like
# concepts and the like) and only take the distinct values from the DB)
elif 'unique' in args:
    
    if not 'content' in args:
        args['content'] = 'tsv'

    if args['content'] == 'tsv':
        print 'Content-Disposition: attachment; filename="triples.tsv"'
        print
    else:
        print

    # set backup as default if nothing is passed
    if not 'file' in args:
        args['file'] = 'backup'

    query = 'select distinct val from '+args['file']+' where col = "'+args['unique']+'" order by val;'
     
    print 'NUMBER\t'+args['unique'];
    for i,line in enumerate(cursor.execute(query)):
        print str(i+1)+'\t'+''.join(line).encode('utf-8')

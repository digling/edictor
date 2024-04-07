"""
Utility functions for the server.
"""
from collections import defaultdict
import sqlite3
from .template import html1, script

DATA = {
        "js": "text/javascript",
        "css": "text/css",
        "html": "text/html",
        "tsv": "text/plain; charset=utf-8",
        "csv": "text/plain; charset=utf-8",
        "png": "",
        "jpg": "",
        "ttf": "",
        "woff": "",
        "json": "text/plain; charset=utf-8"
        }


def parse_args(path):
    args = {}
    for k, v in map(
            lambda x: x.split("="),
            path.split("?")[1].split("#")[0].split("&"),
            ):
        args[k] = v
    return args


def parse_post(path):
    args = {}
    if isinstance(path, bytes):
        path = path.decode("utf-8")
    for k, v in map(
            lambda x: x.split("="),
            path.split("#")[0].split("&")):
        args[k] = v
    return args
        

def get_distinct(what, cursor, name):
    out = [line[0] for line in cursor.execute(
        'select distinct val from ' + name + ' where col="' + what + '";'
        )]
    return out


def get_columns(cursor, name):
    out = [line[0] for line in cursor.execute(
        'select distinct col from ' + name + ';')]
    return out




def file_type(path):
    return path.split("?")[0].split(".")[-1]


def file_name(path):
    return path.split("?")[0]


def file_handler(s, ft, fn):
    if ft in ["js", "html", "css", "tsv", "csv"]:
        s.send_response(200)
        s.send_header("Content-type", DATA[ft])
        s.end_headers()
        try:
            with open(fn[1:], "r") as f:
                s.wfile.write(bytes(f.read(), "utf-8"))
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')
    elif ft in ["png", "ttf", "jpg", "woff"]:
        try:
            with open(fn[1:], 'rb') as f:
                s.wfile.write(f.read())
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')


def summary(s):
    if not "?" in s.path:
        s.send_response(200)
        s.send_header("Content-type", DATA[ft])
        s.end_headers()
        s.wfile.write(b"404 FNF")
        return

    args = parse_args(s.path)
    db = sqlite3.connect("sqlite/" + args["remote_dbase"] + ".sqlite3")
    cursor = db.cursor()
    taxa = get_distinct("doculect", cursor, args["file"])
    concepts = get_distinct("concept", cursor, args["file"])
    columns = get_columns(cursor, args['file'])

    tstring = ''
    for t in sorted(taxa):
        tstring += '<option value="' + t + '">' + t + '</option>'
    cstrings = []
    for t in sorted(concepts):
        cstrings += ['<option value="' + t + '">' + t + '</option>']
    colstring = ''
    for t in sorted(columns):
        colstring += '<option value="' + t + '">'+t + '</option>'

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
        DBASE3 = args["remote_dbase"]
        )
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes(out, "utf-8"))


def triples(s, query, qtype):

    args = dict(
            remote_dbase='', 
            file='', 
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
            limit = ''
            )
    if qtype == "POST":
        args.update(parse_post(query))
    elif qtype == "GET":
        args.update(parse_args(query))
    else:
        return

    print(args)
    db = sqlite3.connect("sqlite/" + args["remote_dbase"] + ".sqlite3")
    cursor = db.cursor()

    s.send_response(200)
    s.send_header("Content-type", "text/plain; charset=utf-8")
    s.send_header("Content-disposition", 'attachment; filename="triples.tsv"')
    s.end_headers()

    
    # get unique columns
    if not args['columns']:
        cols = get_columns(cursor, args['file'])
    else:
        cols = args['columns'].split('%7C')

    text = 'ID\t' + '\t'.join(cols) + '\n'
    
    
    # if neither concepts or doculects are passed from the args, all ids are
    # selected from the database
    if not args['concepts'] and not args['doculects']:
        idxs = [line[0] for line in cursor.execute(
            'select distinct ID from ' + args['file'] + ';')]
    else:
        # we evaluate the concept string
        if args['concepts']:
            cstring = 'COL = "CONCEPT" and VAL in ("' + \
                '","'.join(args['concepts'].split('%7C')) + '")'
        else:
            cstring = ''
        if args['doculects']:
            dstring = 'COL = "DOCULECT" and VAL in ("' + \
                '","'.join(args['doculects'].split('%7C')) + '")'
        else:
            dstring = ''

        
        if cstring:
            cidxs = [line[0] for line in cursor.execute(
                'select distinct ID from ' + args['file'] + ' where ' + cstring)]
        else:
            cidxs = []
        if dstring:
            didxs = [line[0] for line in cursor.execute(
                'select distinct ID from ' + args['file'] + ' where ' + dstring)] 
        else:
            didxs = []

        if cidxs and didxs:
            idxs = [idx for idx in cidxs if idx in didxs]
        else:
            idxs = cidxs or didxs

    # make the dictionary
    D = {} 
    for a, b, c in cursor.execute('select * from ' + args['file'] + ';'):
        if c not in ['-','']:
            try:
                D[a][b] = c
            except KeyError:
                D[a] = {b: c}

    ## check for concepts and "template"
    #if 'concepts' in args and "template" in args and 'doculects' in args:
    #    maxidx = get_max_id(args, cursor)
    #    for doculect in args['doculects'].split('|'):
    #        
    #        conceptsIs = [D[idx]['CONCEPT'] for idx in D if 'CONCEPT' in D[idx] and 'DOCULECT' in D[idx] and D[idx]['DOCULECT'] == doculect]
    #        conceptsMiss = [c for c in args['concepts'].split('|') if c not in conceptsIs]
    #        for concept in conceptsMiss:
    #            D[maxidx] = {"CONCEPT":concept, "DOCULECT":doculect, "IPA": '?'}
    #            idxs += [maxidx]
    #            maxidx += 1
    
    # make object
    for idx in idxs:
        txt = str(idx)
        for col in cols:
            try:
                txt += '\t' + D[idx][col]
            except:
                txt += '\t'
        text += txt + "\n"
    s.wfile.write(bytes(text, "utf-8"))



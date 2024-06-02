"""
Utility functions for the server.
"""
from collections import defaultdict
import sqlite3
import urllib
import os
import json

from pathlib import Path
from datetime import datetime


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

def edictor_path(*comps):
    return Path(__file__).parent.parent.parent.joinpath(*comps)


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


def download(s, post):
    """
    Download command, that writes the file to the current folder.
    """
    args = parse_post(post)
    if not args["file"].endswith(".tsv"):
        return
    date, time = str(datetime.today()).split(" ")
    if Path(args["file"]).exists():
        os.rename(
                args["file"],
                args["file"][:-4] + "-" + date + "-".join(time.split(":")[:2]) + ".tsv"
                )
    with open(args["file"], "w") as f:
        f.write(urllib.parse.unquote_plus(args["data"]))
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes("success", "utf-8"))


def check(s):
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes("success", "utf-8"))


def configuration():
    if Path("config.json").exists():
        with open("config.json") as f:
            conf = json.load(f)
    elif edictor_path("config.json").exists():
        with open(edictor_path("config.json")) as f:
            conf = json.load(f)
    else:
        conf = {
                "user": "unknown",
                "links": None
                }
    return conf
        

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
    if ft in ["js", "html", "css", "csv"]:
        s.send_response(200)
        s.send_header("Content-type", DATA[ft])
        s.end_headers()
        try:
            with open(edictor_path(fn[1:]), "r") as f:
                s.wfile.write(bytes(f.read(), "utf-8"))
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')
    elif ft == "tsv":
        s.send_response(200)
        s.send_header("Content-type", DATA[ft])
        s.end_headers()
        if Path(fn[6:]).exists() and fn.startswith("/data/"):
            with open(fn[6:], "r") as f:
                s.wfile.write(bytes(f.read(), "utf-8"))
        else:
            if edictor_path(fn[1:]).exists():
                with open(edictor_path(fn[1:]), "r") as f:
                    s.wfile.write(bytes(f.read(), "utf-8"))
            else:
                s.wfile.write(b'400 FNF')
    elif ft in ["png", "ttf", "jpg", "woff"]:
        try:
            with open(edictor_path(fn[1:]), 'rb') as f:
                s.wfile.write(f.read())
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')

def serve_base(s):
    conf = configuration()
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    with open(edictor_path("base.html")) as f:
        text = f.read()
    link_template = """<div class="dataset inside" onclick="window.open('{url}');"><span>{name}</span></div>"""
    
    links = []
    for link in conf["links"]:
        links += [link_template.format(**link)]
    text = text.replace("{USERDATA}", "".join(links))

    # add paths that are in the current folder
    paths = []
    for path in Path().glob("*.tsv"):
        paths += [link_template.format(url="index.html?file=" + path.name,
                                       name="Open File «" + path.name + "»")]
    text = text.replace("{DATASETS}", "".join(paths))

    s.wfile.write(bytes(text, "utf-8"))



def triples(s, query, qtype):
    """
    Basic access to the triple storage storing data in SQLITE.
    """
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
    db = sqlite3.connect(
            edictor_path("sqlite/" + args["remote_dbase"] + ".sqlite3"))
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

def update(s, post, qtype):

    now = str(datetime.now()).split('.')[0]
    user = "python"
    args = {}
    if qtype == "POST":
        args.update(parse_post(post))
    elif qtype == "GET":
        args.update(parse_args(post))
    else:
        return

    if not "remote_dbase" in args:
        return
    
    db = sqlite3.connect(edictor_path("sqlite", args["remote_dbase"] +
                                      ".sqlite3"))
    cursor = db.cursor()

    if "update" in args:
        idxs = urllib.parse.unquote(args['ids']).split("|||")
        cols = urllib.parse.unquote(args['cols']).split("|||")
        vals = urllib.parse.unquote(args['vals']).split("|||")

            # iterate over the entries
        if len(idxs) == len(cols) == len(vals):
            pass
        else:
            print('ERROR: wrong values submitted')
            return
        for idx, col, val in zip(idxs, cols, vals):
            
            # unquote the value
            val = urllib.parse.unquote(val)
    
            # check for quote characters
            if '"' in val:
                val = val.replace('"','""')
    
            # get original data value
            try:
                orig_val = [x for x in cursor.execute(
                    'select VAL from ' + args['file'] + ' where ID=' +\
                            idx + ' and COL like "'+col+'";')][0][0]
                
                qstring = 'update '+args['file'] + ' set VAL="'+val+'" where ID='+idx+' and COL="'+col+'";'
                cursor.execute(
                        qstring
                        )
    
                message = 'UPDATE: Modification successful replace "{0}" with "{1}" on {2}.'.format(
                        orig_val.encode('utf-8'),
                        val,
                        now)
                        
            except IndexError:
                orig_val = '!newvalue!'
                
                # create new datum if value has not been retrieved
                cursor.execute(
                        'insert into '+args['file'] + ' values(' +\
                                idx + ',"' + col + '","' +\
                                val + '");')
                message = 'INSERTION: Successfully inserted {0} on {1}'.format(
                        val, now)
                
            # modify original value with double quotes for safety
            if '"' in orig_val:
                orig_val = orig_val.replace('"','""')
    
            # insert the backup line
            try:
                cursor.execute(
                    'insert into backup values(?,?,?,?,strftime("%s","now"),?);',
                    (
                        args['file'],
                        idx,
                        col,
                        orig_val,
                        user
                        ))
            except Exception as e:
                print(e)
                message = 'ERROR'
    
        db.commit()
        s.send_response(200)
        s.send_header("Content-type", "text/html")
        s.end_headers()
        s.wfile.write(bytes(message, "utf-8"))



"""
Utility functions for the server.
"""
from collections import defaultdict
import sqlite3
import urllib
import os
import json
import codecs
import getpass

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


def respond_tsv(s, text):
    s.send_response(200)
    s.send_header("Content-type", "text/plain; charset=utf-8")
    s.send_header("Content-disposition", 'attachment; filename="triples.tsv"')
    s.end_headers()
    s.wfile.write(bytes(text, "utf-8"))   


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
    with codecs.open(args["file"], "w", "utf-8") as f:
        f.write(urllib.parse.unquote_plus(args["data"]))
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes("success", "utf-8"))


def check(s):
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    try:
        import lingpy
        import lingrex
        message = "lingpy"
    except ImportError:
        message = "python"
    s.wfile.write(bytes(message, "utf-8"))


def configuration():
    if Path("config.json").exists():
        with codecs.open("config.json", "r", "utf-8") as f:
            conf = json.load(f)
    elif edictor_path("config.json").exists():
        with codecs.open(edictor_path("config.json"), "r", "utf-8") as f:
            conf = json.load(f)
    else:
        conf = {
                "user": "unknown",
                "links": None
                }
    if conf.get("remote"):
        if not conf["remote"].get("pw"):
            conf["remote"]["pw"] = getpass.getpass("Remote password: ")
    # represent urls as lists
    if conf.get("links"):
        for link in conf["links"]:
            link["url"] = "".join(link["url"])
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
            with codecs.open(edictor_path(fn[1:]), "r", "utf-8") as f:
                s.wfile.write(bytes(f.read(), "utf-8"))
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')
    elif ft == "tsv":
        s.send_response(200)
        s.send_header("Content-type", DATA[ft])
        s.end_headers()
        if Path(fn[6:]).exists() and fn.startswith("/data/"):
            with codecs.open(fn[6:], "r", "utf-8") as f:
                s.wfile.write(bytes(f.read(), "utf-8"))
        else:
            if edictor_path(fn[1:]).exists():
                with codecs.open(edictor_path(fn[1:]), "r", "utf-8") as f:
                    s.wfile.write(bytes(f.read(), "utf-8"))
            else:
                s.wfile.write(b'400 FNF')
    elif ft in ["png", "ttf", "jpg", "woff"]:
        try:
            with codecs.open(edictor_path(fn[1:]), 'rb', None) as f:
                s.wfile.write(f.read())
        except FileNotFoundError:
            s.wfile.write(b'404 FNF')


def serve_base(s, conf):
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    with codecs.open(edictor_path("index.html"), "r", "utf-8") as f:
        text = f.read()
    link_template = """<div class="dataset inside" onclick="window.open('{url}');"><span>{name}</span></div>"""
    
    links = []
    for link in conf["links"]:
        links += [link_template.format(**link)]
    text = text.replace("{USERDATA}", "".join(links))

    # add paths that are in the current folder
    paths = []
    for path in Path().glob("*.tsv"):
        paths += [link_template.format(url="edictor.html?file=" + path.name,
                                       name="Open File «" + path.name + "»")]
    text = text.replace("{DATASETS}", "".join(paths))
    text = text.replace(' id="files" style="display:none"', '')
    text = text.replace(' id="user" style="display:none"', '')

    s.wfile.write(bytes(text, "utf-8"))


def new_id(s, query, qtype):
    """
    Obtain new identifier from currently largest one.
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

    db = sqlite3.connect(
            edictor_path("sqlite/" + args["remote_dbase"] + ".sqlite3"))
    cursor = db.cursor()

    s.send_response(200)
    s.send_header("Content-type", "text/plain; charset=utf-8")
    s.send_header("Content-disposition", 'attachment; filename="triples.tsv"')
    s.end_headers()
    
    if args['new_id'] == "true":
        cursor.execute('select DISTINCT ID from ' + args['file'] + ';')
        linesA = [x[0] for x in cursor.fetchall()]
        cursor.execute(
            'select DISTINCT ID from backup where FILE = "' + args['file'] + '";'
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
            message = str(maxA + 1)
        else:
            message = str(maxB + 1)
    else:
        lines = [x[0] for x in cursor.execute('select DISTINCT VAL from ' + args['file'] +
                ' where COL="' + args['new_id'] + '";')]
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

        message = str(max(cogids) + 1)

    s.wfile.write(bytes(message, "utf-8"))


def cognates(s, query, qtype):
    args = {
            "wordlist": "",
            "mode": "full", 
            "ref": "cogid",
            "method": "lexstat"
            }
    if qtype == "POST":
        args.update(parse_post(query))
    elif qtype == "GET":
        args.update(parse_args(query))
    else:
        return
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])


    # assemble the wordlist header
    from lingpy.compare.partial import Partial
    from lingpy import basictypes
    tmp = {0: ["doculect", "concept", "form", "tokens"]}
    for row in args["wordlist"].split("\n")[:-1]:
        idx, doculect, concept, tokens = row.split('\t')
        tmp[int(idx)] = [
                doculect, 
                concept, 
                tokens, 
                tokens.split(" ")
                ]
    part = Partial(tmp)
    part.partial_cluster(method="sca", threshold=0.45, ref=args["ref"])
    out = ""
    for idx in part:
        out += str(idx) + "\t" + str(basictypes.ints(part[idx, args["ref"]])) + "\n"
    
    respond_tsv(s, out)


def patterns(s, query, qtype):
    """
    Compute correspondence patterns with CoPaR (LingRex)
    """
    args = {
            "wordlist": "",
            "mode": "full", 
            "ref": "cogid",
            "method": "copar"
            }
    if qtype == "POST":
        args.update(parse_post(query))
    elif qtype == "GET":
        args.update(parse_args(query))
    else:
        return
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])

    # assemble the wordlist header
    import lingpy
    from lingrex.copar import CoPaR
    tmp = {0: ["doculect", "concept", "form", "tokens", "cogid", "alignment", "structure"]}
    for row in args["wordlist"].split("\n")[:-1]:
        idx, doculect, concept, tokens, cogid, alignment = row.split('\t')
        tmp[int(idx)] = [
                doculect, 
                concept, 
                tokens, 
                tokens.split(" "),
                cogid,
                alignment.split(" "),
                lingpy.tokens2class(tokens.split(), "cv")
                ]
    cop = CoPaR(tmp, ref=args["ref"].lower(), transcription="form",
                             fuzzy=True if args["mode"] == "partial" else False)
    print("Loaded the CoPaR object.")
    cop.get_sites()
    print("Loaded the Sites.")
    cop.cluster_sites()
    print("Clustered Sites.")
    cop.sites_to_pattern()
    print("Converted Sites to Patterns.")
    cop.add_patterns()
    out = ""
    for idx in cop:
        out += str(idx) + "\t" + " ".join(cop[idx, "patterns"]) + "\n"
    respond_tsv(s, out)
    print("Successfully computed correspondence patterns.")

def alignments(s, query, qtype):
    args = {
            "wordlist": "",
            "mode": "full", 
            "ref": "cogid",
            "method": "library"
            }
    if qtype == "POST":
        args.update(parse_post(query))
    elif qtype == "GET":
        args.update(parse_args(query))
    else:
        return
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])

    # assemble the wordlist header
    import lingpy
    tmp = {0: ["doculect", "concept", "form", "tokens", "cogid"]}
    for row in args["wordlist"].split("\n")[:-1]:
        print(row)
        idx, doculect, concept, tokens, cogid = row.split('\t')
        tmp[int(idx)] = [
                doculect, 
                concept, 
                tokens, 
                tokens.split(" "),
                cogid]
    alms = lingpy.Alignments(tmp, ref=args["ref"], transcription="form",
                             fuzzy=True if args["mode"] == "partial" else False)
    alms.align(method=args["method"])
    out = ""
    for idx in alms:
        out += str(idx) + "\t" + " ".join(alms[idx, "alignment"]) + "\n"
    
    respond_tsv(s, out)
    print("Successfully computed alignments from the data.")


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


def modifications(s, post, qtype):
    now = str(datetime.now()).split('.')[0]
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
    cursor.execute(
            'select ID,COL from backup where FILE="'+args['file']+'"'+\
                    ' and datetime(DATE) > datetime('+args['date']+')'+\
                    ' group by ID,COL limit 100;')
    lines = cursor.fetchall()
    data = dict([((a,b),c) for a,b,c in cursor.execute(
            'select * from '+args['file']+';'
            )])
    message = ""
    for line in lines:
        try:
            val = data[line[0],line[1]].encode('utf-8')
            message += '{0}\t{1}\t{2}\n'.format(line[0], line[1], val) 
        except KeyError:
            pass
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes(message, "utf-8"))


def update(s, post, qtype, user):
    
    now = str(datetime.now()).split('.')[0]
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

    elif "delete" in args:
        lines = [line for line in cursor.execute(
            'select * from '+args['file'] +' where ID='+args['ID']+';'
            )]
        for idx, col, val in lines:
            cursor.execute(
                    'insert into backup values(?,?,?,?,strftime("%s","now"),?);',
                    (args['file'],idx, col, val, user))
            cursor.execute(
                    'delete from '+args['file'] + ' where ID='+args['ID']+';')
        db.commit()
        message = 'DELETION: Successfully deleted all entries for ID {0} on {1}.'.format(
                args['ID'],
                now)
    s.send_response(200)
    s.send_header("Content-type", "text/html")
    s.end_headers()
    s.wfile.write(bytes(message, "utf-8"))



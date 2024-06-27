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

from urllib.request import urlopen


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
        "json": "text/plain; charset=utf-8",
        "config": "config.json",
        }


def opendb(path, conf):
    if Path(conf["sqlite"], path + ".sqlite3").exists:
        db = sqlite3.connect(
                Path(conf["sqlite"], path + ".sqlite3"))
    else:
        db = sqlite3.connect(
                edictor_path(conf["sqlite"], path + ".sqlite3"))
    return db, db.cursor()
    

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
    with codecs.open(args["file"], "w", "utf-8") as f:
        f.write(urllib.parse.unquote_plus(args["data"]))

    send_response(s, "success")



def send_response(s, content, content_type="text/html",
                  content_disposition=None, encode=True):
    if encode:
        content = bytes(content, "utf-8")
    s.send_response(200)
    s.send_header("Content-type", content_type)
    if content_disposition:
        s.send_header("Content-disposition", content_disposition)
    s.end_headers()
    s.wfile.write(content)


def handle_args(args, query, qtype):
    if qtype == "POST":
        args.update(parse_post(query))
    elif qtype == "GET":
        args.update(parse_args(query))
    

def check(s):
    try:
        import lingpy
        import lingrex
        message = "lingpy"
    except ImportError:
        message = "python"
    send_response(s, message)


def configuration():
    """
    Load the Configuration Data File.
    """
    if Path(DATA["config"]).exists():
        with codecs.open(DATA["config"], "r", "utf-8") as f:
            conf = json.load(f)
    elif edictor_path(DATA["config"]).exists():
        with codecs.open(edictor_path(DATA["config"]), "r", "utf-8") as f:
            conf = json.load(f)
    else:
        conf = {
                "user": "unknown",
                "links": None,
                "sqlite": "sqlite",
                }
        
    if conf.get("remote"):
        if not conf.get("user"):
            conf["user"] = input("User name: ")
        if not conf.get("pw"):
            conf["pw"] = getpass.getpass("Remote password: ")
        # prepare the links now
        for key, values in conf["remote"].items():
            for file in values:
                values[file]["data"] = "&".join(
                        ["{0}={1}".format(k, v) for k, v in
                         values[file]["data"].items()])
            
    # represent urls as lists
    if conf.get("links"):
        for link in conf["links"]:
            link["url"] = link["url"] + "?" + "&".join(
                    ["{0}={1}".format(k, v) for k, v in link["data"].items()])

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
    
    send_response(s, text)


def new_id(s, query, qtype, conf):
    """
    Obtain new identifier from currently largest one.
    """
    args = dict(
            remote_dbase='', 
            file='', 
            new_id = '', 
            )
    handle_args(args, query, qtype)
    if conf["remote"] and args["remote_dbase"] in conf["remote"]:
        print("requesting remote ID")
        info = conf["remote"][args["remote_dbase"]]["new_id.py"]
        req = urllib.request.Request(
                info["url"], 
                data=bytes(info["data"] + "&new_id=true", "utf-8"))
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.get_method =lambda: 'POST'
        data = urllib.request.urlopen(req).read()
        send_response(
                s, 
                data, 
                encode=False,
                content_type="text/plain; charset=utf-8",
                content_disposition='attachment; filename="triples.tsv"'
                )
        return
    
    db, cursor = opendb(args["remote_dbase"], conf)
    
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
    send_response(s, message)


def cognates(s, query, qtype):
    args = {
            "wordlist": "",
            "mode": "full", 
            "method": "lexstat"
            }
    handle_args(args, query, qtype)
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])

    # assemble the wordlist header
    from lingpy.compare.partial import Partial
    from lingpy.compare.lexstat import LexStat
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
    out = ""
    if args["mode"] == "partial":
        part = Partial(tmp)
        part.partial_cluster(
                method="sca", threshold=0.45, ref="cogid",
                cluster_method="upgma")
        for idx in part:
            out += str(idx) + "\t" + str(basictypes.ints(part[idx, "cogid"])) + "\n"
    else:
        lex = LexStat(tmp)
        lex.cluster(
                method="sca", threshold=0.45, ref="cogid", 
                cluster_method="upgma")
        for idx in lex:
            out += str(idx) + "\t" + str(lex[idx, "cogid"]) + "\n"

    send_response(
            s, 
            out, 
            content_type="text/plain; charset=utf-8",
            content_disposition='attachment; filename="triples.tsv"'
            )



def patterns(s, query, qtype):
    """
    Compute correspondence patterns with CoPaR (LingRex)
    """
    args = {
            "wordlist": "",
            "mode": "full", 
            "method": "copar",
            "minrefs": 2
            }
    handle_args(args, query, qtype)
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])

    # assemble the wordlist header
    import lingpy
    from lingrex.copar import CoPaR
    if args["mode"] == "partial":
        ref = "cogids"
    else:
        ref = "cogid"
    tmp = {0: ["doculect", "concept", "form", "tokens", ref, "alignment", "structure"]}
    for row in args["wordlist"].split("\n")[:-1]:
        idx, doculect, concept, tokens, cogid, alignment = row.split('\t')
        tmp[int(idx)] = [
                doculect, 
                concept, 
                tokens, 
                tokens.split(" "),
                lingpy.basictypes.ints(cogid) if args["mode"] == "partial" else int(cogid),
                alignment.split(" "),
                lingpy.tokens2class(tokens.split(), "cv")
                ]
    cop = CoPaR(
            tmp, 
            ref=ref, 
            transcription="form",
            fuzzy=True if args["mode"] == "partial" else False,
            minrefs=args["minrefs"]
            )
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
    send_response(
            s, 
            out, 
            content_type="text/plain; charset=utf-8",
            content_disposition='attachment; filename="triples.tsv"'
            )
    print("Successfully computed correspondence patterns.")


def alignments(s, query, qtype):
    args = {
            "wordlist": "",
            "mode": "full", 
            "method": "library"
            }
    handle_args(args, query, qtype)
    args["wordlist"] = urllib.parse.unquote_plus(args["wordlist"])
    
    print("Carrying out alignments with LingPy")
    # assemble the wordlist header
    import lingpy
    ref = "cogid" if args["mode"] == "full" else "cogids"
    tmp = {0: ["doculect", "concept", "form", "tokens", ref]}
    for row in args["wordlist"].split("\n")[:-1]:
        idx, doculect, concept, tokens, cogid = row.split('\t')
        tmp[int(idx)] = [
                doculect, 
                concept, 
                tokens, 
                tokens.split(" "),
                lingpy.basictypes.ints(cogid) if args["mode"] == "partial" else cogid
                ]
    alms = lingpy.Alignments(tmp, ref=ref, transcription="form",
                             fuzzy=True if args["mode"] == "partial" else False)
    alms.align(method=args["method"])
    out = ""
    for idx in alms:
        out += str(idx) + "\t" + " ".join(alms[idx, "alignment"]) + "\n"
    
    send_response(
            s, 
            out, 
            content_type="text/plain; charset=utf-8",
            content_disposition='attachment; filename="triples.tsv"'
            )


def triples(s, query, qtype, conf):
    """
    Basic access to the triple storage storing data in SQLITE.
    """
    args = dict(
            remote_dbase='', 
            file='', 
            columns = '', 
            concepts = '',
            doculects = '', 
            )
    handle_args(args, query, qtype)

    if conf["remote"] and args["remote_dbase"] in conf["remote"]:
        print("EDICTOR loading remote TSV file.")
        info = conf["remote"][args["remote_dbase"]]["triples.py"]
        req = urllib.request.Request(
                info["url"], 
                data=bytes(info["data"], "utf-8"))
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.get_method = lambda: 'POST'
        data = urllib.request.urlopen(req).read()
        send_response(
                s, 
                data, 
                encode=False,
                content_type="text/plain; charset=utf-8",
                content_disposition='attachment; filename="triples.tsv"'
                )
        return
    
    db, cursor = opendb(args["remote_dbase"], conf)

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
    send_response(s, text, content_type="text/plain; charset=utf-8",
                  content_disposition='attachment; filename="triples.tsv"')


def modifications(s, post, qtype, conf):
    """
    Check for remote modifications in the data, done in another application.
    
    Note
    ----
    This operation is not only useful when working with many people, but also
    when working on a local host but with multiple windows open. The call
    checks for recently modified data in the database and inserts them into the
    wordlist, if modifications are detected. It is triggered in certain
    intervals, but mostly dependent on the use of the Wordlist Panel of the
    EDICTOR.
    """
    now = str(datetime.now()).split('.')[0]
    args = {}
    handle_args(args, post, qtype)

    if not "remote_dbase" in args:
        return

    if conf["remote"] and args["remote_dbase"] in conf["remote"]:
        print("EDICTOR checking for modifications in remote data.")
        info = conf["remote"][args["remote_dbase"]]["modifications.py"]
        data = info["data"] + "&date=" + args["date"]
        req = urllib.request.Request(
                info["url"], 
                data=bytes(info["data"], "utf-8"))
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.get_method =lambda: 'POST'
        data = urllib.request.urlopen(req).read()
        send_response(
                s, 
                data, 
                encode=False,
                content_type="text/plain; charset=utf-8",
                content_disposition='attachment; filename="triples.tsv"'
                )
        return

    db, cursor = opendb(args["remote_dbase"], conf)
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
    send_response(s, message)


def update(s, post, qtype, conf):
    """
    Update data on local or remote SQLite file.
    
    Note
    ----
    The update routine is carried out with a post-request that is sent to the
    local host, or by sending a get request to the remote host (which must be
    specified in the configuration file). 
    """
    
    now = str(datetime.now()).split('.')[0]
    args = {}
    handle_args(args, post, qtype)

    if conf["remote"] and args["remote_dbase"] in conf["remote"]:
        print("send remote data")
        info = conf["remote"][args["remote_dbase"]]["update.py"]
        url = info["url"]
        data = info["data"]
        if "update" in args:
            data += "&ID=" + args["ids"].replace("%7C%7C%7C", "|||")
            data += "&COL=" + args["cols"].replace("%7C%7C%7C", "|||")
            data += "&VAL=" + args["vals"].replace("%7C%7C%7C", "|||")
            data += "&update=true"
        elif "delete" in args:
            data += "&ID=" + args["ID"] + "&delete=true"

        passman = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        passman.add_password(None, url, conf["user"], conf["pw"])

        authhandler = urllib.request.HTTPBasicAuthHandler(passman)
        opener = urllib.request.build_opener(authhandler)
        urllib.request.install_opener(opener)

        req = urllib.request.Request(
                info["url"], 
                data=bytes(data, "utf-8"))
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.get_method = lambda: 'POST'
        res = urllib.request.urlopen(req)
        message = res.read()
        send_response(s, message, encode=False)
        return
    
    db, cursor = opendb(args["remote_dbase"], conf)

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
                        conf["user"]
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
                    (args['file'],idx, col, val, conf["user"]))
            cursor.execute(
                    'delete from '+args['file'] + ' where ID='+args['ID']+';')
        db.commit()
        message = 'DELETION: Successfully deleted all entries for ID {0} on {1}.'.format(
                args['ID'],
                now)
    send_response(s, message)



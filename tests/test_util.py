from edictor.util import (
        opendb, edictor_path, DATA, configuration, file_name,
        file_type, file_handler, serve_base, 
        download, new_id, cognates, patterns, alignments, triples,
        modifications, update, parse_args, parse_post,
        send_response, handle_args, check
        )
from lingpy.compare.partial import Partial
from lingpy.compare.lexstat import LexStat
import os
import tempfile
import json


class Writer:

    def write(self, x):

        self.written = x


class Sender:

    def __init__(self):

        self.wfile = Writer()
    
    def send_response(self, x):
        pass

    def send_header(self, x, y):

        pass

    def end_headers(self):

        pass
    

def test_opendb():

    a, b = opendb("germanic", {"sqlite": "data"})
    a, b = opendb("test", {"sqlite": "data"})


def test_edictor_path():
    p = edictor_path("a.tsv")
    assert p.name == "a.tsv"


def test_parse_args():

    assert parse_args("bla.html?file=good&remote=not")["file"] == "good"


def test_parse_post():

    parse_post("file=a&file2=b&file3=d")
    parse_post(b"file=a&file2=b&file3=d")


def test_download():

    s = Sender()
    wd = os.getcwd()
    with tempfile.TemporaryDirectory() as t:
        os.chdir(t)
        download(s, "file=test.svt")
        download(s, "file=test.tsv&data=abcdefg")
        download(s, "file=test.tsv&data=abcdefg")
    os.chdir(wd)


def test_send_response():

    s = Sender()
    send_response(s, "test", content_disposition="txt", encode=None)


def test_handle_args():
    
    args = {}
    handle_args(args, "a=b&c=d", "POST")
    handle_args(args, "?c=d&e=f", "GET") 


def test_check():
    s = Sender()
    check(s)


def test_configuration():
    
    wd = os.getcwd()
    with tempfile.TemporaryDirectory() as t:
        os.chdir(t)
        with open("config.json", "w") as f:
            f.write(json.dumps(
                {
                    "links": [
                        {
                        "url": "edictor.html", 
                        "data": {
                            "file": "germanic",
                            "remote_dbase": "germanic",
                            "columns": "DOCULECT|CONCEPT|IPA|TOKENS|ALIGNMENT|COGID|PATTERNS|NOTE"
                            },
                        "name": "Germanic (SQLITE, Base)"
                        }
                    ]
                    }))
        conf = configuration()
    os.chdir(wd)


def test_file_type():
    assert file_type("plain.html?file=test") == "html"
    assert file_type("test.txt") == "txt"


def test_file_name():

    assert file_name("plain.html?file=test") == "plain.html"
    assert file_name("test.txt") == "test.txt"


def test_file_handler():

    s = Sender()
    file_handler(s, "js", "text.js")
    assert s.wfile.written == b"404 FNF"
    
    file_handler(s, "html", "index.html")


    file_handler(s, "png", "edictor-small.png")

    file_handler(s, "tsv", "/data/GER.tsv")
    assert s.wfile.written[:2] == b"ID"


def test_serve_base():
    
    s = Sender()
    serve_base(s, {"links": []})


def test_cognates():

    s = Sender()
    data = "wordlist=1\tA\tA\tm a m a\n" + \
        "2\tB\tA\tm u m u\n" + \
        "3\tC\tA\tm i m i&mode=full"
    
    cognates(s, data, "POST")

    data = "wordlist=1\tA\tA\tm a m a\n" + \
        "2\tB\tA\tm u m u\n" + \
        "3\tC\tA\tm i m i&mode=partial"

    cognates(s, data, "POST")


def test_alignments():

    s = Sender()
    data = "wordlist=1\tA\tA\tm a m a\t1\n" + \
        "2\tB\tA\tm u m u\t1\n" + \
        "3\tC\tA\tm i m i\t1&mode=full"
    
    alignments(s, data, "POST")

    data = "wordlist=1\tA\tA\tm a m a\t1\n" + \
        "2\tB\tA\tm u m u\t1\n" + \
        "3\tC\tA\tm i m i\t1&mode=partial"
    
    alignments(s, data, "POST")


def test_patterns():

    s = Sender()
    data = "wordlist=1\tA\tA\tm a m a\t1\tm a m a\n" + \
        "2\tB\tA\tm u m u\t1\tm u m u\n" + \
        "3\tC\tA\tm i m i\tm i m i\t1&mode=full"
    
    patterns(s, data, "POST")

    data = "wordlist=1\tA\tA\tm a m a\t1\tm a m a\n" + \
        "2\tB\tA\tm u m u\t1\tm u m u\n" + \
        "3\tC\tA\tm i m i\tm i m i\t1&mode=full"
    
    patterns(s, data, "POST")



def test_new_id():

    s = Sender()

    # test internally, in the test folder
    new_id(
        s, 
        "new_id=true&file=germanic&remote_dbase=germanic", 
        "POST", 
        {"sqlite": "data", "remote_dbase": "germanic.sqlite3"}
        )
    assert int(s.wfile.written.strip()) == 1934
    
    # test within edictor
    new_id(
        s, 
        "new_id=true&file=germanic&remote_dbase=germanic", 
        "POST", 
        {"sqlite": "sqlite", "remote_dbase": "germanic.sqlite3"}
        )


def test_triples():

    s = Sender()

    # test with POST
    triples(
            s,
            "file=germanic&remote_dbase=germanic&doculects=German",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanic.sqlite3"}
             )
    assert s.wfile.written[:2] == b"ID"
    
    # test with GET
    triples(
            s,
            "?file=germanic&remote_dbase=germanic&doculects=German",
            "GET",
            {"sqlite": "data", "remote_dbase": "germanic.sqlite3"}
             )
    assert s.wfile.written[:2] == b"ID"

    # test with POST
    triples(
            s,
            "file=germanic&remote_dbase=germanic&columns=ID%7CDOCULECT%7CCONCEPT%7CTOKENS",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanic.sqlite3"}
             )
    assert s.wfile.written[:2] == b"ID"


def test_modifications():

    s = Sender()

    # test with POST
    modifications(
            s,
            "file=germanic&remote_dbase=germanic&doculects=German&date=1654819200",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanic.sqlite3"}
             )
    assert s.wfile.written[:2] == b"10"


def test_update():

    s = Sender()
    # modify entries
    update(
            s,
            "update=true&file=germanic&remote_dbase=germanicm&ids=42|||1694&cols=NOTE|||NOTE&vals=exc2|||exc2",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanicm", "user": "edictor"}
            )
    update(
            s,
            "update=true&file=germanic&remote_dbase=germanicm&ids=42|||1694&cols=NOTE|||NOTE&vals=exc|||exc",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanicm", "user": "edictor"}
            )

    # delete entries
    update(
            s,
            "delete=true&file=germanic&remote_dbase=germanicm&ID=42",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanicm", "user": "edictor"}
            )
    update(
            s,
            "update=true&file=germanic&remote_dbase=germanicm&ids=42|||42|||42&cols=DOCULECT|||CONCEPT|||NOTE&vals=German|||*markō|||exc",
            "POST",
            {"sqlite": "data", "remote_dbase": "germanicm", "user": "edictor"}
            )



    





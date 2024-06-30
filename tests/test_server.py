from edictor.server import Handler
import tempfile
import os

class FileLike:

    def close(self):
        pass

    def readline(self, x):
        return b"1234"

    def read(self, x):
        return b"1234"


class Rfile:

    def __init__(self, x):
        self.x = x

    def read(self, n):
        return bytes(self.x, "utf-8")


class Tester:

    def __init__(self):
        self.makefile = lambda x, y: FileLike()

    def sendall(self, x):
        return x


def test_Handler():
    
    wd = os.getcwd()
    with tempfile.TemporaryDirectory() as t:
        os.chdir(t)
        han = Handler(Tester(), "https://localhost:1234", "")
        for fn, path in [
                ("/", ""),
                ("/data/test.tsv", ""),
                ("/index.html", ""),
                ("/download.py", "file=germanic.tsv&data=abcdefg"),
                ("/triples/triples.py", "file=germanic&remote_dbase=germanic"), 
                ("/check.py", ""), 
                #("/update.py",
                #"/triples/new_id.py", 
                #"/triples/modifications.py",
                #"/alignments.py", 
                #"/cognates.py", 
                #"/patterns.py"
                ]:
                han.headers = {"Content-Length": "10"}
                han.rfile = Rfile(path)
                han.path = fn + "?" + path 
                han.do_GET()
                han.do_POST()
        os.chdir(wd)


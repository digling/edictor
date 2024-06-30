from edictor.util import (
        opendb, edictor_path, DATA, configuration, file_name,
        file_type, file_handler
        )


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

    pass

def test_parse_post():

    pass


def test_download():

    pass


def test_send_response():

    pass


def test_handle_args():

    pass

def test_check():

    pass

def test_configuration():
    
    conf = configuration()


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
    




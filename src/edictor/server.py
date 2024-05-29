from http.server import SimpleHTTPRequestHandler
import sqlite3

from edictor.util import (
        summary, DATA, get_distinct, get_columns, 
        check,
        file_type, file_name, file_handler, triples, download,
        update
        )

START = """
<html><body>
<ul>
<li><a href="index.html">New Project</a></li>
<li><a href="index.html?file=GER-pat.tsv">Project GER-pat.tsv</a></li>
</ul></body></html>"""


class Handler(SimpleHTTPRequestHandler):

    def do_POST(s):
        """
        https://gist.github.com/scimad/ae0196afc0bade2ae39d604225084507
        """
        content_length = int(s.headers['Content-Length'])
        post_data_bytes = s.rfile.read(content_length)
        
        ft = file_type(s.path)
        fn = file_name(s.path)

        print("post data", fn)

        if ft in DATA:
            file_handler(s, ft, fn)
            return

        fn = file_name(s.path)
        print(fn)

        if fn == "/triples/triples.py":
            triples(s, post_data_bytes, "POST")
        if fn == "/download.py":
            download(s, post_data_bytes)
        if fn == "/check.py":
            check(s)
        if fn == "/triples/update.py":
            print("updating")
            update(s, post_data_bytes, "POST")

    def do_GET(s):
        
        ft = file_type(s.path)
        fn = file_name(s.path)

        if fn == "/":
            s.send_response(200)
            s.send_header("Content-type", "text/html")
            s.end_headers()
            s.wfile.write(bytes(START, "utf-8"))

        if ft in DATA:
            file_handler(s, ft, fn)
            return

        #if fn == "/triples/summary.py":
        #    summary(s)
        if fn == "/triples/triples.py":
            triples(s, s.path, "GET")
        if fn == "/triples/update.py":
            update(s, s.path, "GET")




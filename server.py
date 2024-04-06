from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sqlite3
from pyed.template import html1, script
from pyed.util import (
        summary, DATA, get_distinct, get_columns, 
        file_type, file_name, file_handler, triples
        )


class Handler(SimpleHTTPRequestHandler):

    def do_POST(s):
        """
        https://gist.github.com/scimad/ae0196afc0bade2ae39d604225084507
        """
        content_length = int(s.headers['Content-Length'])
        post_data_bytes = s.rfile.read(content_length)
        #print("MY SERVER: The post data I received from the request has following data:\n", post_data_bytes)

        ft = file_type(s.path)
        fn = file_name(s.path)

        if ft in DATA:
            file_handler(s, ft, fn)
            return
        fn = file_name(s.path)
        if fn == "/triples/triples.py":
            triples(s, post_data_bytes, "POST")

    def do_GET(s):
        
        ft = file_type(s.path)
        fn = file_name(s.path)

        if ft in DATA:
            file_handler(s, ft, fn)
            return
        if fn == "/triples/summary.py":
            summary(s)
        if fn == "/triples/triples.py":
            triples(s, s.path, "GET")


 



            

PORT = 9999

httpd = HTTPServer(("", PORT), Handler)
print("serving at port", PORT)
httpd.serve_forever()

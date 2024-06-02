from http.server import SimpleHTTPRequestHandler
import sqlite3

from edictor.util import (
        DATA, get_distinct, get_columns, 
        check,
        file_type, file_name, file_handler, triples, download,
        update, serve_base
        )



class Handler(SimpleHTTPRequestHandler):

    def do_POST(s):
        """
        Do a POST request.

        Note:

        This GIST gave me the tip on how to proceed with POST data.

        https://gist.github.com/scimad/ae0196afc0bade2ae39d604225084507
        """
        content_length = int(s.headers['Content-Length'])
        post_data_bytes = s.rfile.read(content_length)
        
        ft = file_type(s.path)
        fn = file_name(s.path)

        if ft in DATA:
            file_handler(s, ft, fn)
            return

        fn = file_name(s.path)

        if fn == "/triples/triples.py":
            triples(s, post_data_bytes, "POST")
        if fn == "/download.py":
            download(s, post_data_bytes)
        if fn == "/check.py":
            check(s)
        if fn == "/triples/update.py":
            update(s, post_data_bytes, "POST")

    def do_GET(s):
        """
        Do a GET request.
        """
        
        ft = file_type(s.path)
        fn = file_name(s.path)

        if fn == "/":
            serve_base(s)

        if ft in DATA:
            file_handler(s, ft, fn)
            return

        if fn == "/triples/triples.py":
            triples(s, s.path, "GET")
        if fn == "/triples/update.py":
            update(s, s.path, "GET")




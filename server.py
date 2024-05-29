#! /usr/bin/python
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sqlite3
from pyed.template import html1, script
from pyed.util import (
        summary, DATA, get_distinct, get_columns, 
        check,
        file_type, file_name, file_handler, triples, download
        )
import webbrowser
import argparse


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
        if fn == "/download.py":
            download(s, post_data_bytes)
        if fn == "/check.py":
            check(s)

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


parser = argparse.ArgumentParser(
                    prog='EDICTOR 3',
                    description='Computer-assisted language comparison with EDICTOR 3.',
                    epilog='Serves EDICTOR 3 (Version 3.0) via local host in your browser.')
parser.add_argument('-p', '--port', help="Define the port on the local host.",
                    action="store", default=9999, type=int)
parser.add_argument('-f', '--file', help="Select file to be loaded.",
                    action="store", default=None)
args = parser.parse_args()



httpd = HTTPServer(("", args.port), Handler)
print("serving at port", args.port)
url = "http://localhost:" + str(args.port) + "/index.html"
if args.file:
    url += "?file=" + args.file
webbrowser.open(url)

httpd.serve_forever()




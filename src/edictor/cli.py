"""
Commandline Interface of EDICTOR
"""

import webbrowser
from http.server import HTTPServer
import argparse
from pathlib import Path

from edictor.server import Handler




parser = argparse.ArgumentParser(
                    prog='EDICTOR 3',
                    description='Computer-assisted language comparison with EDICTOR 3.',
                    epilog='Serves EDICTOR 3 (Version 3.0) via local host in your browser.')
parser.add_argument('-p', '--port', help="Define the port on the local host.",
                    action="store", default=9999, type=int)
parser.add_argument('-f', '--file', help="Select file to be loaded.",
                    action="store", default=None)
parser.add_argument('-b', '--browser', default="firefox", 
                    help="select webbrowser")

def main():
    args = parser.parse_args()
    
    httpd = HTTPServer(("", args.port), Handler)
    print("Serving EDICTOR at port {0}...".format(args.port))
    url = "http://localhost:" + str(args.port) + "/"
    if args.file:
        url += "index.html?file=" + args.file
    try:
        webbrowser.get(args.browser).open_new_tab(url)
    except:
        print("Could not open webbrowser, please open locally " 
              "at http://localhost:" + str(args.port) + "/")
    
    httpd.serve_forever()


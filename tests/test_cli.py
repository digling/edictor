from edictor.cli import main
import shlex
import multiprocessing
import time
import os
import tempfile
from pathlib import Path

#def run(capsys, *args):
#    if len(args) == 1:
#        args = shlex.split(args[0])
#    main(*args)
#    return capsys.readouterr().out


def test_server():
    p = multiprocessing.Process(target=main, args=('server', '--browser=dummy'))
    p.start()
    time.sleep(1)
    p.kill()


def test_fetch():

    with tempfile.TemporaryDirectory() as t:
        os.system("edictor fetch --dataset=sumerian --name=" + t +
                  "/dummy.tsv")


def test_wordlist():
    with tempfile.TemporaryDirectory() as t:
        os.chdir(t)
        os.system("git clone https://github.com/lexibank/allenbai")
        os.system("edictor wordlist --dataset=allenbai/cldf/cldf-dataset.json")
        os.chdir("..")


def test_main():
    os.system("edictor")
    os.system("edictor --help")

#output = run(
#            capsys, "server")

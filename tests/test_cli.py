from edictor.cli import main
import multiprocessing
import time
import os
import tempfile


def test_server():
    p = multiprocessing.Process(target=main, args=('server', '--no-window'))
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
        os.system("edictor wordlist --dataset=allenbai/cldf/cldf-metadata.json --name=allenbai")
        assert os.path.exists("allenbai.tsv")
        os.chdir("..")


def test_main():
    os.system("edictor")
    os.system("edictor --help")

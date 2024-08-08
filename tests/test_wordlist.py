import tempfile
from edictor.wordlist import fetch_wordlist, get_wordlist
from pathlib import Path
import os
import codecs


def test_fetch_wordlist():

    data = fetch_wordlist("ltkkaren")
    assert data[:2] == "ID"

    data = fetch_wordlist("sumerian", remote_dbase="sumerian.sqlite3")
    assert data[:2] == "ID"

    data = fetch_wordlist("sumerian", languages=["Sumerian"], concepts=["above"])
    assert len(data.strip().split("\n")) == 2

    data = fetch_wordlist("sumerian", to_lingpy=True)
    assert data.width == 2


def test_get_wordlist():

    def prep(wordlist):
        return wordlist
    
    test_path = Path(__file__).parent.joinpath('data') 
    fn = test_path / "cldf" / "cldf-metadata.json"
    pp = test_path / "prep.py"
    with tempfile.TemporaryDirectory() as t:
        os.chdir(t)
        get_wordlist(fn, "bai")
        get_wordlist(fn, "bai", preprocessing=prep, lexibase=True)


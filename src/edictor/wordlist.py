"""
Handle EDICTOR wordlist data.
"""
import urllib
import tempfile


def fetch_wordlist(
        dataset,
        remote_dbase=None,
        concepts=None,
        languages=None,
        columns=None,
        to_lingpy=None,
        transform=None,
        base_url="http://lingulist.de/edictor",
):
    """
    Download wordlist from an EDICTOR application.
    """
    url = base_url + "/triples/get_data.py?file=" + dataset
    if not remote_dbase:
        url += "&remote_dbase=" + dataset + ".sqlite3"
    else:
        url += "&remote_dbase=" + remote_dbase
    if concepts:
        url += "&concepts=" + "|".join([urllib.parse.quote(c) for c in concepts])
    if languages:
        url += "&doculects=" + "|".join([urllib.parse.quote(c) for c in languages])
    if columns:
        url += "&columns=" + "|".join(columns)

    data = urllib.request.urlopen(url).read()
    if to_lingpy:
        import lingpy
        with tempfile.NamedTemporaryFile() as tf:
            tf.write(data)
            tf.flush()
            return transform(tf.name) if transform else lingpy.Wordlist(tf.name)
    return data.decode("utf-8")


def get_wordlist(
        path,
        name,
        columns=None,
        preprocessing=None,
        namespace=None,
        lexibase=False,
        custom_args=None
):
    from lexibase import LexiBase
    from lingpy import Wordlist

    wordlist = Wordlist.from_cldf(
        path,
        columns=columns or (
            "language_id", "concept_name", "value", "form", "segments", "comment"),
        namespace=namespace or dict(
            [
                ("language_id", "doculect"),
                ("concept_name", "concept"),
                ("value", "value"),
                ("form", "form"),
                ("segments", "tokens"),
                ("comment", "note"),
            ]
        ),
    )

    if preprocessing and custom_args:
        D = preprocessing(wordlist, args=custom_args)
    elif preprocessing:
        D = preprocessing(wordlist)
    else:
        D = {idx: wordlist[idx] for idx in wordlist}
        D[0] = wordlist.columns

    if not lexibase:
        Wordlist(D).output("tsv", filename=name, ignore="all", prettify=False)
    else:
        lex = LexiBase(D, dbase=name + ".sqlite3")
        lex.create(name)

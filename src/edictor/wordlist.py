"""
Handle EDICTOR wordlist data.
"""
import urllib
import tempfile
try:
    import lingpy
except ImportError:  # pragma: no cover
    lingpy = False
try:
    from lexibase import LexiBase
except ImportError:  # pragma: no cover
    LexiBase = False


# noinspection HttpUrlsUsage
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
    Download wordlist from an EDICTOR server application.
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
        if not lingpy:  # pragma: no cover
            raise ValueError(
                    "Package lingpy has to be installed to use this method.")
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
    """
    Function retrieves a wordlist from a CLDF dataset.
    """
    if not lingpy:  # pragma: no cover
        raise ValueError(
                "Package lingpy has to be installed to use this method.")

    wordlist = lingpy.Wordlist.from_cldf(
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
        dct = preprocessing(wordlist, args=custom_args)
    elif preprocessing:
        dct = preprocessing(wordlist)
    else:
        dct = {idx: wordlist[idx] for idx in wordlist}
        dct[0] = wordlist.columns

    if not lexibase:
        lingpy.Wordlist(dct).output("tsv", filename=name, ignore="all", prettify=False)
    else:
        if not LexiBase:  # pragma: no cover
            raise ValueError(
                    "Package lexibase has to be installed to use this method.")
        lex = LexiBase(dct, dbase=name + ".sqlite3")
        lex.create(name)

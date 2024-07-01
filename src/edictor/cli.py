"""
Commandline Interface of EDICTOR
"""

import webbrowser
from http.server import HTTPServer
import argparse
from pathlib import Path

from edictor.util import DATA


class CommandMeta(type):
    """
    A metaclass which keeps track of subclasses, if they have all-lowercase names.
    """

    __instances = []

    def __init__(self, name, bases, dct):
        super(CommandMeta, self).__init__(name, bases, dct)
        if name == name.lower():
            self.__instances.append(self)

    def __iter__(self):
        return iter(self.__instances)


class Command(metaclass=CommandMeta):
    """Base class for subcommands of the EDICTOR command line interface."""

    help = None

    @classmethod
    def subparser(cls, parser):
        """Hook to define subcommand arguments."""
        return

    def __call__(self, args):
        """Hook to run the subcommand."""
        raise NotImplementedError


def add_option(parser, name_, default_, help_, short_opt=None, **kw):
    names = ["--" + name_]
    if short_opt:
        names.append("-" + short_opt)

    if isinstance(default_, bool):
        kw["action"] = "store_false" if default_ else "store_true"
    elif isinstance(default_, int):
        kw["type"] = float
    elif isinstance(default_, float):
        kw["type"] = float
    kw["default"] = default_
    kw["help"] = help_
    parser.add_argument(*names, **kw)


def _cmd_by_name(name):
    for cmd in Command:
        if cmd.__name__ == name:
            return cmd()


class server(Command):
    """
    Run EDICTOR 3 in a local server and access the application through your webbrowser.
    """

    @classmethod
    def subparser(cls, p):
        """
        EDICTOR 3 in local server.
        """
        add_option(
                p, 
                "port", 
                9999, 
                "Port where the local server will serve the application.",
                short_opt="p"
                )
        add_option(
                p,
                "browser",
                "firefox",
                "Select the webbrowser to open the application.",
                short_opt="b"
                )
        add_option(
                p,
                "config",
                "config.json",
                "Name of the configuration file to be used.",
                short_opt="c"
                )

    def __call__(self, args):
        """
        EDICTOR 3 Server Application.
        """
        DATA["config"] = args.config
        from edictor.server import Handler
        httpd = HTTPServer(("", args.port), Handler)
        print("Serving EDICTOR 3 at port {0}...".format(args.port))
        url = "http://localhost:" + str(args.port) + "/"
        try:
            webbrowser.get(args.browser).open_new_tab(url)
        except:
            print("Could not open webbrowser, please open locally " 
                  "at http://localhost:" + str(args.port) + "/")
        
        httpd.serve_forever()


class wordlist(Command):
    """
    Convert a dataset to EDICTOR's SQLITE and TSV formats (requires LingPy).
    """

    @classmethod
    def subparser(cls, p):
        add_option(
            p,
            "dataset",
            Path("cldf", "cldf-metadata.json"),
            "Path to the CLDF metadata file.",
            short_opt="d",
        )
        add_option(
            p,
            "preprocessing",
            None,
            "path to the module to preprocess the data",
            short_opt="p",
        )
        add_option(
            p,
            "namespace",
            '{"language_id": "doculect", "concept_name": "concept",'
            '"value": "value", "form": "form", "segments": "tokens",'
            '"comment": "note"}',
            "namespace and columns you want to extract",
        )
        add_option(
            p, "name", "dummy", "name of the dataset you want to create", short_opt="n"
        )
        add_option(p, "addon", None, "expand the namespace", short_opt="a")
        add_option(p, "sqlite", False, "convert to SQLITE format")
        add_option(
            p, "custom", None, "custom field where arguments can be passed in JSON form"
        )

    def __call__(self, args):
        try:
            import lingpy
        except:
            args.log.info("LingPy must be available to run this command.")
            return
            
        namespace = json.loads(args.namespace)
        if args.addon:
            for row in args.addon.split(","):
                s, t = row.split(":")
                namespace[s] = t

        columns = [x for x in list(namespace)]
        if args.preprocessing:
            spec = importlib.util.spec_from_file_location("prep", args.preprocessing)
            prep = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(prep)
            preprocessing = prep.run
        else:
            preprocessing = None
        if args.custom:
            custom_args = json.loads(args.custom)
        else:
            custom_args = None
        get_lexibase(
            args.dataset,
            args.name,
            columns=columns,
            namespace=namespace,
            preprocessing=preprocessing,
            lexibase=args.sqlite,
            custom_args=custom_args,
        )


def get_parser():
    # basic parser for lingpy
    parser = argparse.ArgumentParser(
        description=main.__doc__, 
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="subcommand")
    for cmd in Command:
        subparser = subparsers.add_parser(
            cmd.__name__,
            help=(cmd.__doc__ or "").strip().split("\n")[0],
            formatter_class=argparse.ArgumentDefaultsHelpFormatter,
        )
        cmd.subparser(subparser)
        cmd.help = subparser.format_help()

    return parser


def main(*args):
    """
    Computer-assisted language comparison with EDICTOR 3.
    """
    args = get_parser().parse_args(args or None)
    return _cmd_by_name(args.subcommand)(args)

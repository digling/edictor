from edictor.cli import main
import shlex


def run(capsys, *args):
    if len(args) == 1:
        args = shlex.split(args[0])
    main(*args)
    return capsys.readouterr().out


def test_server(capsys):
    pass

#output = run(
#            capsys, "server")

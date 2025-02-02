# EDICTOR 3: Web-Based Tool for Computer-Assisted Language Comparison

EDICTOR is a web-based tool for computer-assisted language comparison. As of Version 3, EDICTOR is available in two forms. You can access the application via its website at [https://edictor.org](https://edictor.org) or you can install a Python application that allows you to run EDICTOR with more features locally in your webbrowser.

In order to get started with the local application, you should make sure to have a recent Python installation (3.9 or higher) along with the PIP package manager. It is necessary to install the package from a virtual environment, so we start with setting this up.

## Virtual Environments

One possible way of managing virtual environments is the `virtualenv' package. The first recommended step is to install the 'virtualenv' package that manages those environments, and to create and activate such an environment. You can read more about virtual environments here: [https://docs.python.org/3/library/venv.html](https://docs.python.org/3/library/venv.html).

```shell
python3 -m pip install virtualenv
python3 -m venv venv/edictor
source venv/edictor/bin/activate
```

## Installing EDICTOR

Installing EDICTOR can then be done via the commandline by simply typing the following command in the terminal (the `$` symbol here indicates that the command is issued as a prompt and not written inside a script).

```shell
pip install edictor
```

This will install EDICTOR on your computer and offer the command `edictor` on your commandline that you can use to run the application locally. To check that this works in principle, simply type the following command.

```shell
edictor --help
```

This shows you all the current options of the application. Running the application then simply requires to type the subcommand `server`, as illustrated below.

```shell
edictor server
```

Running the application will try to automatically open the webbrowser at the default address `http://localhost:9999`. This may not work on all operation systems, partly, because command names for webbrowsers differ, and possibly also because the port is already used by another application. You can select another port when starting the application.

```shell
edictor server --port=9876
```

The landing page will provide further information on files and datasets that you can open and test.

## Installing EDICTOR 3 with LingPy Support

If you want to test EDICTOR 3 with [LingPy](https://pypi.org/project/lingpy) support, you can again install the package via PIP using the following command.

```shell
pip install "edictor[lingpy]"
```

This will not only add support to all functionalities provided by LingPy (improved automatic cognate detection, improved alignments) and [LingRex](https://pypi.org/project/lingrex) (improved correspondence pattern detection), but also provide access to the `wordlist` command from the EDICTOR 3 commandline (see below for details). In many terminals, you can run the same command without quotation marks.

## Getting Started on Windows

In order to get the EDICTOR application working on Windows, we have successfully carried out the following steps. First, you should download [Python](https://python.org) (we used Python 3.11.9, but you can use versions starting from 3.9). We also downloaded [GIT](https://www.git-scm.com/) for Windows (Version 2.45.2.windows.1). Having installed both programs successfully, you must also install the [Windows Powershell](https://learn.microsoft.com/en-us/powershell/?view=powershell-7.4) which offers commandline facilities. This program can then be opened as any other application (but you must open the application as administrator, you find information on doing this in German [here](https://www.heise.de/tipps-tricks/Windows-Powershell-Skript-ausfuehren-4672163.html)).

Having opened the Powersheel terminal window, you will reside in the path `C:\windows\system32`. From here, you should got to your user path with the `cd` command. In the following example, the username is `edictor3`.

```shell
PS C:\windows\system32> cd C:\Users\edictor3\Desktop\
```

There, we create a directory for EDICTOR3 files and use `GIT` to clone the most recent EDICTOR version.

```shell
PS C:\Users\edictor3\Desktop> mkdir edictor3
PS C:\Users\edictor3\Desktop> cd edictor3
PS C:\Users\edictor3\Desktop> git clone https://github.com/digling/edictor.git
PS C:\Users\edictor3\Desktop> git checkout v3.0.0
```

We now create a virtual environment with Python in order to make sure we can use the code locally and do not need to destroy anything in our Python installation with the installation of EDICTOR3. Instructions can be found [here](https://mothergeo-py.readthedocs.io/en/latest/development/how-to/venv-win.html). 

```shell
PS C:\Users\edictor3\Desktop\edictor3> python -m pip install virtualenv
PS C:\Users\edictor3\Desktop\edictor3> virtualenv edi3
PS C:\Users\edictor3\Desktop\edictor3> Set-ExecutionPolicy -ExecutionPolicy Unrestricted -force
PS C:\Users\edictor3\Desktop\edictor3> .\edi3\Scripts\activate
```

With these commands, you have in this terminal a virtual environment that you can safely use to install packages in Python. We can now install the package locally and load it directly.

```shell
(edi3) PS C:\Users\edictor3\Desktop\edictor3> python -m pip install -e edictor
(edi3) PS C:\Users\edictor3\Desktop\edictor3> edictor server
```

You must still open your webbrowser at the URL `https://localhost:9999`, since we cannot automatically trigger Windows to open the Firefox (the preferred webbrowser for the EDICTOR). But with this, you are done and can use the tool in your work.

If you want to use the tool along with [LingPy](https://lingpy.org) and [LingRex](https://pypi.org/project/lingrex), you can install these packages as well. EDICTOR will recognize if they are installed and allow for more options in computing cognates, alignments, and correspondence patterns. 

```shell
(edi3) PS C:\Users\edictor3\Desktop\edictor3> python -m pip install lingpy lingrex
```

## PyEDICTOR Functionalities in EDICTOR 3

EDICTOR 3 now implements functionalities originally provided in [PyEDICTOR](https://pypi.org/project/pyedictor). Since EDICTOR uses the same namespace as PyEDICTOR, 
this means that for those who wish to use PyEDICTOR independently of the EDICTOR web application, nothing has changed, since the same commands in the same form are still offered. 
With EDICTOR 3, we consider PyEDICTOR as obsolete, and all future development of PyEDICTOR will be provided in EDICTOR.

As an example on how to use PyEDICTOR functionalities in EDICTOR, you can test the following line of code to download a CLDF dataset with the
help of GIT and then convert the CLDF data to EDICTOR's "Wordlist" format.

```shell
$ git clone https://github.com/lexibank/allenbai.git
$ edictor wordlist --dataset=allenbai/cldf/cldf-metadata.json --name=allenbai
$ edictor server
```

When opening your local EDICTOR application, you can now open the tab FILES and click to open the file `allenbai.tsv` in EDICTOR there directly.

## Citing EDICTOR 3

If you use EDICTOR in your work, please cite the tool as follows:

> List, Johann-Mattis, Frederic Blum, and Kellen Parker van Dam (2025): EDICTOR 3: A Web-Based Tool for Computer-Assisted Language Comparison [Software Tool, Version 3.1]. MCL Chair at the University of Passau: Passau. URL: [https://edictor.org/](https://edictor.org).


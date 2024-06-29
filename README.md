# EDICTOR 3: Web-Based Tool for Computer-Assisted Language Comparison

EDICTOR is a web-based tool for computer-assisted language comparison. As of Version 3, EDICTOR is available in two forms. You can access the application via its website at [https://edictor.org](https://edictor.org) or you can install a Python application that allows you to run EDICTOR with more features locally in your webbrowser.

In order to get started with the local application, you should make sure to have a recent Python installation (3.8 or higher) along with the PIP package manager. It is recommended to install the package from a virtual environment. Installing EDICTOR can then be done via the commandline by simply typing:

```shell
$ pip install edictor
```

This will install EDICTOR on your computer and offer the command `edictor3` on your commandline that you can use to run the application locally.

```shell
$ edictor3
```

Running the application will try to automatically open the webbrowser at the default address `http://localhost:9999`. If that causes errors, you can select another port.

```shell
$ edictor3 --port=9876
```

The landing page will provide further information on files and datasets that you can open and test.

If you use EDICTOR in your work, please cite the tool as follows:

> List, Johann-Mattis (2024): EDICTOR 3: A Web-Based Tool for Computer-Assisted Language Comparison [Software Tool, Version 3.0.alpha.1]. MCL Chair at the University of Passau: Passau. URL: [https://edictor.org/](https://edictor.org).



## Getting Started on Windows


In order to get the EDICTOR application working on Windows, we have successfully carried out the following steps. First, you should download [Python](https://python.org) (we used Python 3.11.9, but you can use versions starting from 3.8). We also downloaded [GIT](https://www.git-scm.com/) for Windows (Version 2.45.2.windows.1). Having installed both programs successfully, you must also install the [Windows Powershell](https://learn.microsoft.com/en-us/powershell/?view=powershell-7.4) which offers commandline facilities. This program can then be opened as any other application (but you must open the application as administrator, you find information on doing this in German [here](https://www.heise.de/tipps-tricks/Windows-Powershell-Skript-ausfuehren-4672163.html)). 

Having opened the Powersheel terminal window, you will reside in the path `C:\windows\system32`. From here, you should got to your user path with the `cd` command. In the following example, the username is `edictor3`.

```shell
PS C:\windows\system32> cd C:\Users\edictor3\Desktop\
```

There, we create a directory for EDICTOR3 files and use `GIT` to clone the most recent EDICTOR version.

```shell
PS C:\Users\edictor3\Desktop> mkdir edictor3
PS C:\Users\edictor3\Desktop> cd edictor3
PS C:\Users\edictor3\Desktop> git clone https://github.com/digling/edictor.git
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
(edi3) PS C:\Users\edictor3\Desktop\edictor3> edictor3
```

You must still open your webbrowser at the URL `https://localhost:9999`, since we cannot automatically trigger Windows to open the Firefox (the preferred webbrowser for the EDICTOR). But with this, you are done and can use the tool in your work.

If you want to use the tool along with [LingPy](https://lingpy.org) and [LingRex](https://pypi.org/project/lingrex), you can install these packages as well. EDICTOR will recognize if they are installed and allow for more options in computing cognates, alignments, and correspondence patterns. 

```shell
(edi3) PS C:\Users\edictor3\Desktop\edictor3> python -m pip install lingpy lingrex
```



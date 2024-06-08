# EDICTOR 3: Web-Based Tool for Computer-Assisted Language Comparison

EDICTOR is a web-based tool for computer-assisted language comparison. As of Version 3, EDICTOR is available in two forms. You can access the application via its website at [https://edictor.org](https://edictor.org) or you can install a Python application that allows you to run EDICTOR with more features locally in your webbrowser.

In order to get started with the local application, you should make sure to have a recent Python installation (3.8 or higher) along with the PIP package manager. It is recommended to install the package from a virtual environment. Installing EDICTOR can then be done via the commandline by simply typing:

```shell
$ pip install edictor
```

This will install EDICTOR on your computer and offer the command `edictor` on your commandline that you can use to run the application locally.

```shell
$ edictor3
```

Running the application will try to automatically open the webbrowser at the default address `http://localhost:9999`. If that causes errors, you can select another port.

```shell
$ edictor3 --port=9876
```

The landing page will provide further information on files and datasets that you can open and test.

If you use EDICTOR in your work, please cite the tool as follows:

> List, Johann-Mattis (2024): EDICTOR 3: A Web-Based Tool for Computer-Assisted Language Comparison [Software Tool, Version 3.0]. MCL Chair at the University of Passau: Passau. URL: [https://edictor.org/](https://edictor.org).



## Getting Started on Windows

https://www.heise.de/tipps-tricks/Windows-Powershell-Skript-ausfuehren-4672163.html

https://www.heise.de/tipps-tricks/Windows-Powershell-Skript-ausfuehren-4672163.html

https://mothergeo-py.readthedocs.io/en/latest/development/how-to/venv-win.html

$ python -m pip install edictor
$ edictor3.exe

$ git clone https://github.com/digling/edictor

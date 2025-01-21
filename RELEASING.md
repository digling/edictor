# Release Instructions

Given how the codebase underlying EDICTOR has evolved over time, with me learning more about JavaScript trying to catch up with new knowledge acquired over time, the code base is at the moment quite difficult to maintain, mixing both code related to the GUI with routines related to sequence comparison in various ways, without using proper tests. 

Given that the tool still works most of the time, and errors are usually tracked quickly and then fixed somehow, it seems better to go on in this way, trying to enhance the tool as we go along, rather than making a complete cut and programming it from scratch (there would anyway be no time for this).
 
But from version 3.0 on, there is some hope that basic release procedures can be established and used, along with certain manual tests for which individual datasets with only a few items should be prepared. 

## Basic Ways to Test the JS Application

The basic procedure consists in running some general routines that are described in `tests/gui/` in different folders with instructions on how to start EDICTOR 3 and also what to do then. These provide already a rather solid base on what we expect from the tool. 

## Testing EDICTOR with Selenium

From version 3.0 on, we start adding basic tests in [Selenium](https://addons.mozilla.org/en-US/firefox/addon/selenium-ide/), currently only focusing on Firefox (where we can also run JS commands directly). New functions should from now an always be supplemented by a new test in Firefox and also in other browsers. Selenium IDE can be easily installed as a Firefox or Chrome addon and then used interactively to record and run tests on the GUI. 

Before new releases and als with each pull-request, a new GUI test should be carried out to make sure the code does not break.

Tests are located in the folder `tests/selenium`. 

## Basic Tests for the Python Code

Tests with `pytest` seem to run fine for now. Tests should be further improved, but test coverage is already rather high for now.

To test the current code, go to the folder `tests` and then type:

```shell
$ pytest --cov=edictor 
```

## Release Procedure

- Do platform test via tox:
  ```shell
  tox -r
  ```

- Do tests with selenium (`tests/selenium/edictor-firefox.side`).

- Make sure the GUI tests in `tests/gui` all work.

- Update the version number, by removing the trailing `.dev0` in:
  - `pyproject.toml`
  - `src/edictor/__init__.py`

- Create the release commit:
  ```shell
  git commit -a -m "release <VERSION>"
  ```

- Create a release tag:
  ```
  git tag -a v<VERSION> -m"<VERSION> release"
  ```

- Release to PyPI:
  ```shell
  rm dist/*
  python -m build -n
  twine upload dist/*
  ```

- Push to github:
  ```
  git push origin
  git push --tags
  ```

- Change version for the next release cycle, i.e. incrementing and adding .dev0
  - `pyproject.toml`
  - `src/edictor/__init__.py`

- Commit/push the version change:
  ```shell
  git commit -a -m "bump version for development"
  git push origin
  ```




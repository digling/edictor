# Release Instructions

Given how the codebase underlying EDICTOR has evolved over time, with me learning more about JavaScript trying to catch up with new knowledge acquired over time, the code base is at the moment quite difficult to maintain, mixing both code related to the GUI with routines related to sequence comparison in various ways, without using proper tests. 

Given that the tool still works most of the time, and errors are usually tracked quickly and then fixed somehow, it seems better to go on in this way, trying to enhance the tool as we go along, rather than making a complete cut and programming it from scratch (there would anyway be no time for this).
 
But from version 3.0 on, there is some hope that basic release procedures can be established and used, along with certain manual tests for which individual datasets with only a few items should be prepared. 

## Basic Ways to Test the JS Application

The basic procedure consists in running some general routines that are described in `tests/gui/` in different folders with instructions on how to start EDICTOR 3 and also what to do then. These provide already a rather solid base on what we expect from the tool. 

## Basic Tests for the Python Code

Tests with `pytest` seem to run fine for now. Tests should be further improved, but test coverage is already rather high for now.

To test the current code, go to the folder `tests` and then type:

```shell
$ pytest --cov=edictor 
```

## Release Types
  
* a major release is one where the number after the dot increases (2.5 to 2.6)
* a minor release is one where the second number increases (2.5 to 2.5.1)

## Release Procedure

- Do platform test via tox:
  ```shell
  tox -r
  ```

- Make sure the GUI tests in `tests/gui` all work

- Update the version number, by removing the trailing `.dev0` in:
  - `setup.cfg`
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
  - `setup.cfg`
  - `src/edictor/__init__.py`

- Commit/push the version change:
  ```shell
  git commit -a -m "bump version for development"
  git push origin
  ```




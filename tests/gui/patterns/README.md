# Steps for the Test

Run initial commands with the Makefile:

```
make install
```

This opens the EDICTOR app on your webbrowser (alternatively open directly at http://localhost:9999). 

Then got to FILES in the menu, press on `keypano.tsv`. 

Having opened, go to "add column" and insert COGID, press ENTER.

Then repeat the same with ALIGNMENT and PATTERNS.

Go to SETTINGS and make sure `Cognate ID` has `COGID` inserted, if not, add it, and click on REFRESH.

Then go to COMPUTE and press on COGNATE SETS, then press on SUBMIT.

Then go to COMPUTE and press on ALIGNMENTS, then press on SUBMIT.

Then go to COMPUTE and press on CORRESPONDENCE PATTERNS, then press on SUBMIT.

You should now be able to see all correspondence patterns inferred for the dataset.

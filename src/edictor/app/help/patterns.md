# Correspondence Pattern Inspector

This module allows you to inspect the correspondence patterns in your data. It it quite convenient to infer striking similarities across multiple languages in your data.
It requires that you have at least one of the following columns readily filled:

* TOKENS or SEGMENTS (segmentized IPA representation of your sounds)
* COGID or COGIDS (cognate sets or partial cognate sets)
* ALIGNMENT or ALIGNMENTS (the aligned strings)
* PATTERNS (the previously identified correspondence patterns, that are stored in this column)

The column names can vary, but if they do so, you must specify the variation, using the SETTINGS panel. Note also, that you must make sure that you have selected the correct "morphology mode". This can also be specified in the SETTIGS menu. If your data is coded as partial cognates, select *partial* morphology or colexification mode (and make also sure to have selected a valid column for the Partial Cognates in your data. If your data is coded as full cognates, make sure to select *full* and also to provide a column that actually *has* full cognate sets (with corresponding alignments). 


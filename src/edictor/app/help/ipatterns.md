# Compute Correspondence Patterns 

This module allows you to infer the correspondence patterns in your data. It it quite convenient to infer striking similarities across multiple languages in your data.
It requires that you have at least one of the following columns readily filled:

* TOKENS or SEGMENTS (segmentized IPA representation of your sounds)
* COGID or COGIDS (cognate sets or partial cognate sets)
* ALIGNMENT or ALIGNMENTS (the aligned strings)
* PATTERNS (the column to store the computed correspondence patterns, if it is lacking, you must create it at first and assign it in the SETTINGS menu).

The column names can vary, but if they do so, you must specify the variation, using the SETTINGS panel. Note also, that you must make sure that you have selected the correct "morphology mode". This can also be specified in the SETTIGS menu. If your data is coded as partial cognates, select *partial* morphology or colexification mode (and make also sure to have selected a valid column for the Partial Cognates in your data. If your data is coded as full cognates, make sure to select *full* and also to provide a column that actually *has* full cognate sets (with corresponding alignments). 

The correspondence patterns are computed in a way that is quite straightforward and simple, using a sorting algorithm that is not guaranteed to find the best patterns. 


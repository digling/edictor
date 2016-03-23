# Help for the Wordlist Panel

The Wordlist is the central view of the EDICTOR and all other ways to inspect and edit the data are centered around the Wordlist module.

A Wordlist in the EDICTOR is a simple tabular format that displays the data which is either submitted as a text file in TSV format or loaded from a server.

# Basic Structure

The basic structure of a wordlist in the EDICTOR follows the specifications of wordlists used in the [LingPy](http://lingpy.org) software package. 
For users interested in the ideas behind the wordlist representation, it is generally recommended to read [this wordlist tutorial](http://lingpy.org/tutorial/lingpy.basic.wordlist.html). 

A Wordlist in the EDICTOR is basically a spreadsheet in which each word of a given language is displayed in a single row of the spreadsheet, and columns are used to store different data *about* the word. A general distinction has to be made between optional and required data. Data which is required for a wordlists is:

* the language of the word (called the "doculect" in the context of the EDICTOR, following [Good and Cysouw 2013](:bib:Good2013))
* the concept which the word denotes 

Furthermore, in order to make use of the majority of the features, a phonetic or phonological transcription of each word is required, but the EDICTOR can also be used to actively add the transcription.

In order to allow the EDICTOR to identify these required columns when parsing the data, it is important to supply a header with the data in which specific column names for transcription, language, and concept are used. In order to allow users to select from their preferred names, some aliases are defined for each of the data types. The column names are:

| BASIC NAME    | DESCRIPTION                                        | ALIAS                     | REQUIRED |
| ---           | ---                                                | ---                       | ---      |
| DOCULECT      | identifier for the language                        | doculect, language, taxon | yes      |
| CONCEPT       | identifier of the concept                          | concept, gloss            | yes      |
| TRANSCRIPTION | phonological or phonetic transcription of the word | no                        |
| SEGMENTS      | phonetic transcription in segmented form           | tokens, segments          | no       |
| COGID         | cognate identifier                                 | cogid, `*`id              | no       |
| ALIGNMENT     | phonetic alignment of a set of cognate words       | alignment                 | no       |


# Features

## Modifying the Display

+++ pending +++

## Sorting the Data

As a general rule throughout many modules of the EDICTOR, double-clicking on a column header will trigger a sort along that column.
To mark the sorted column, the header will be colored in red. By double-clicking again on the same column, the sort will be reversed, and by double-clicking a third time, the original (unsorted) order will be re-established.

## Browsing the Data

The Wordlist view is per default restricted to show only a short preview of 10 items of the full wordlist. 
If you want to change the amount of items which are show in preview, you can do so by changing the "preview" option in the settings, which you can access through the top-menu.

For a quick browsing of the data, you can click on the buttons to the left and the right of the "START" symbol on top of the Wordlist panel. If you just loaded your data, there won't be a browse-button on the left of "START", but only on the right, indicating the next number of items which you can inspect. In this way, you can go forward and backward through your data. As a convenient shortcut for quick browsing, use the "PAGE UP" and the "PAGE DOWN" keys to browse back and forth.

## Editing the Data

A general feature of the Wordlist panel is to offer a quick way to edit the data. Essentially, each cell in the Wordlist can be edited by clicking one time on the cell and modifying the entry. In order to save the data, you need to press either the "ENTER" key, or one of the "UP" and "DOWN" keys, which will automatically bring you to the next cell above or beyond the cell you just edited. 

Instead of editing the data, you can also use the keys to navigate quickly through your data.
While "UP" and "DOWN" key work as expected, you need to press "CTRL" in addition to "LEFT" and "RIGHT" to jump from one cell to the cell at the left or the cell at the right. This is important, since otherwise you would have difficulties in editing the content of a cell, where "LEFT" and "RIGHT" are also needed to navigate.

## Cognates and Alignments

+++ pending +++


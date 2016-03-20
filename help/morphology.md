# Help for the Morphology Module

The Morphology module of the EDICTOR serves multiple purposes. You can use it to inspect your data regarding the distribution of morphemes across words, but also regarding the distribution of words across meanings.
In this sense, the Morphology module offers basically a way to inspect the language-internal relations between the words in your data, the word families.

## Requirements

To be able to use the Morphology module in its full form, your data should be
morpheme-segmented. In order to segment your data, you can either
manuallysegment the words in the **TOKENS** or **SEGMENTS** column by adding
either a plus sign ("+"), an underscore ("`_`") or the morpheme separator "◦"
(sampa code for this character is "0\") to the phonological segments. If your
data are tone languages from South East Asia with standard tone annotation
using superscript or subscript letters, the EDICTOR will automatically segment
your data by assuming that each syllable that ends in a tone is a separate
morpheme.

## Usage

After selecting a doculect, just hit the ENTER key, or click on the OK button.
A table will appear which shows all words of your doculect in morphologically
segmented form.  If the same word is used to express more than one concept,
these *colexifications* ([François 2008](:bib:Francois2008)) will appear in
the column called "COLEXIFICATIONS". If a given word shares morphemes with
another word, this is listed in the column "PARTIAL COLEXIFICATIONS". The table
shows the concepts which are fully colexified. In the case of partial
colexifications, the concept which is partially colexified is further given two
indices in superscript indicating where the colexification occurs, with the
first index pointing to the actual word in the row, and the second pointing to
the index of the morpheme in the target word.

## Features

### Sorting

As a general rule, as in many other modules of the EDICTOR, you can sort the data by double-clicking on the columns. However, in the Morphology module, only the columns "ID", "CONCEPT", and "MORPHEMES" are sortable.

### Filtering

You can filter the data in two ways:

1. Filter the data by entering one of the morphemes for the given doculect in the "filter by morphmes" text field on top of the table.

2. Filter the data by directly clicking on one of the morphemes in the words.

In both cases, the table will be created again, but this time, only those words are considered which contain the selected morpheme.

### Interaction with the Wordlist Module

As in the Phonology module, the Morphology module also offers the possibility to directly interact with the Wordlist module. By clicking on the concept labels in the cells of the column "COLEXIFICATIONS", the wordlist will be filtered to show only the colexified concepts. This is identical for clicking on the concept labels in the column "PARTIAL COLEXIFICATIONS", only that these will filter for those concepts which are partially colexified.

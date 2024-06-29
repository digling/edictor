# Help for the Morphology Module

The Morphology module of the EDICTOR serves multiple purposes. You can use it
to inspect your data regarding the distribution of morphemes across words, but
also regarding the distribution of words across meanings.  In this sense, the
Morphology module offers basically a way to inspect the language-internal
relations between the words in your data, the word families.

# Requirements

To be able to use the Morphology module in its full form, your data should be
morpheme-segmented. In order to segment your data, you can either
manuallysegment the words in the **TOKENS** or **SEGMENTS** column by adding
either a plus sign ("+"), an underscore ("`_`") or the morpheme separator "◦"
(sampa code for this character is "0\") to the phonological segments. If your
data are tone languages from South East Asia with standard tone annotation
using superscript or subscript letters, the EDICTOR will automatically
segment your data by assuming that each syllable that ends in a tone is a
separate morpheme.

Even if your data is not morpheme segmented, you can still use the module, but
in this case you can only carry out full colexification analyses in which for a
given doculect all words which are fully colexified in the sense of [François
(2008)](:bib:Francois2008) are displayed.

# Usage

After selecting a doculect, just hit the ENTER key, or click on the OK button.
A table will appear which shows all words of your doculect in morphologically
segmented form.  The Morphology panel of the EDICTOR distinguishes two kinds of
analyses, two kinds of "views", and two kinds of modes. Regarding the analysis,
you may select between an automatic analysis which takes the raw
morphologically segmented data and searches for recurring patterns in the data,
and the manual analysis, which requires that a manual annotation of morphemes
in the data has already been carried out and is stored in a column with the
default name "MORPHEMES".  Regarding the "view", you may choose between the
"inspect-view", which allos to filter the data quickly in different ways and is
probably the best way to get a first impression of the data in an automatic
analysis, and the "edit-view" which allows to edit both the segmentations and
the morpheme annotation directly.  Regarding the "mode", you can choose between
"full" and "partial". In both cases, the data will be searched for similar
words within the same language. In the first case, however, only completely
identical words will be regarded, while in the latter case words sharing one
morpheme will also be taken into consideration.  Thus, if you choose the "full"
mode, the table shows for each word, whether this word form is used to express
further concepts in your data.  These *colexifications* ([François
2008](:bib:Francois2008)) will appear in the column called "COLEXIFICATIONS".
If you chose "partial" as a mode, the EDICTOR searches for partial
colexifications, that is, for each word, all other concepts are listed in which
the same morpheme occurs.  In partial colexification model, the concept which
is partially colexified is further given two indices in superscript indicating
where the colexification occurs, with the first index pointing to the actual
word in the row, and the second pointing to the index of the morpheme in the
target word.

If you choose the "manual" analysis instead of the "automatic" analysis (set as
a default), you will need to have one column called "MORPHEMES" in your data.
If this is the case, the EDICTOR will first search in this column, then compare
the entries with your phonetic data in segmented form (default column name
"TOKENS" or "SEGMENTS"), and finally add the morpheme information to each of
the morphemes, if it can be found. If you select the "manual" analysis, the
colexifications (be they full or partial) will be drawn from your annotations
rather than from the raw data itself.

Morpheme annotation in the MORPHEME column is straightforward: White-space is
used as a separator, but otherwise all kind of text is allowed. The rule is: if
you think that a morpheme occurs in two different words, just give it the same
text identifiere. If you don't know a given morpheme, use a question mark to
indicate this. This is important to allow the EDICTOR to compare the segmented
phonetic entry with your morpheme annotation. The morpheme annotation should be
aligned with the morpheme segmentation in the phonetic transcription. Thus, if
you have a word "so+pik" and you know that the second element means something
like "shoot", but you don't know the meaning of the first element, you could
annotate this as "? shoot". 

Note that the EDICTOR is rather tolerant regarding annotation errors: If you do
not annotate a word, this is ignored, and if you misalign annotations by, for
example, providing less morphemes in your annotation than you have in your
phonetic representation, the EDICTOR will just add the missing question marks.
But this tolerance has a drawback: You might have errors creeping in your
analysis if you do not check your data meticously. 
 
# Features

## Sorting

As a general rule, as in many other modules of the EDICTOR, you can sort the
data by double-clicking on the columns. However, in the Morphology module, only
the columns "ID", "CONCEPT", and "MORPHEMES" are sortable.

## Filtering

You can filter the data in two ways:

1. Filter the data by entering one of the morphemes for the given doculect in
   the "filter by morphmes" text field on top of the table.

2. Filter the data by directly clicking on one of the morphemes in the words.

In both cases, the table will be created again, but this time, only those words
are considered which contain the selected morpheme. If you have chosen the
"manual" analysis with your own manually annotated morpheme analysis, you need
to filter by supplying identifiers for your morphemes.

## Interaction with the Wordlist Module

As in the Phonology module, the Morphology module also offers the possibility
to directly interact with the Wordlist module. By clicking on the concept
labels in the cells of the column "COLEXIFICATIONS", the wordlist will be
filtered to show only the colexified concepts. If you click on a concept in the
column "CONCEPTS", this will again filter the wordlist and only display your
currently selected concept.  This may turn out convenient for manual morpheme
annotation, since you can switch back and forth by annotating morphemes in your
wordlist and then checking results on colexifications immediately.

Even more useful than this interactive feature, however, is to use the
"edit-view" in case you want to directly annotate your data. In this case, you
can just edit both fields directly, just as you already know it from the
Wordlist panel of the EDICTOR, and the data will be directly stored and
modified.

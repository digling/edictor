# Phonology Panel of the EDICTOR

The Phonology panel of the EDICTOR serves different purposes. You can use it to
* inspect the phonemes in your data,
* check your data for errors, and to
* search for words containing specific phonemes.

# Basic Requirements

The basic requirement is data in segmentized form. For the EDICTOR this means,
that your data needs to contain a column with the segmented phonetic data.
Unless you modify the basic configurations, this column needs to have a
specific name, which is either **TOKENS** or **SEGMENTS**. If your data
contains such a column and the words in that column are truely segmentized,
using space as a separation marker, you can use the Phonology module to inspect
the sounds of each of the languages in your dataset.  However, even if your
data is not yet segmented, you can still use the EDICTOR Phonology module by
trusting the automatic segmentation algorithm. In this case, your data should
contain one field with transcriptions, either called **TRANSCRIPTION** or
**IPA**, and when running the module, the EDICTOR will automatically create an
internal tokenized version of each of your input strings.

# Features

## Phonology Table

The Phonology panel shows you all distinct "phonemes" (sound units) in your
language data, along with their frequency and further informations.
Internally, the EDICTOR has a set of sound units taken with modifications from
different databases, such as the PBase database by [Mielke
(2008)](:bib:Mielke2008).  As a result, the EDICTOR will search for each of the
sound segments in your data, whether it finds a regular description in the
internal set of pre-defined sounds, and will write these to the table,
defining type, manner (height for vowels), place (color for vowels), voice, and
secondary features.  The EDICTOR also shows all concepts in which the sound
occurs.  In fact, not all concepts will be shown, depending on your data, but
just a small pre-selection.  Yet when you click in the cell of the CONCEPTS
column, you automatically filter all words in the Wordlist panel.  This is
particularly useful in those cases where you detect errors in your data and
want to quickly correct them.

## Sorting 

Double-clicking on any of the columns apart from the last column in the
Phonology panel will sort the data along this column. Clicking the first time
sorts the data in ascending order, clicking the second time, sorts the data in
descending order. You may specifically want to sort your data according to
frequency in order to check that there are no spurious sounds in your data,
which often result from typing errors.  However, sorting according to "type"
may help you to find out, which sounds the EDICTOR does not yet recognize as
valid IPA segments, since these will be left blank.  If you sort along the
"sound" column, the sounds will be sorted according to their Dolgopolsky Sound
Class [(Dolgopolsky 1964)](:bib:Dolgopolsky1964). This may make it easier for
you to search for specific sound types.

## IPA Chart

If you want to see an IPA chart of your data, just click on the IPA chart
button on top of the Phonology panel **after** having clicked OK. This will
open a popup window in which you can see all sounds in their respective IPA
chart place along with a specific table left for those sounds which are
currently not yet recognized as valid IPA sounds by the EDICTOR.  This may
again be useful for data inspection, especially when looking for irregularities
or "weak spots" in the phonological system of a language.

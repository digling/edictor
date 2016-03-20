# Phonology Module of the EDICTOR

The Phonology module of the EDICTOR serves different purposes. You can use it to
* inspect the phonemes in your data,
* check your data for errors, and to
* search for words containing specific phonemes.

# Basic Requirements

The basic requirement is data in segmentized form.  For the EDICTOR this means,
that your data needs to contain a column with the segmented phonetic data.
Unless you modify the basic configurations, this column needs to have a
specific name, which is either **TOKENS** or **SEGMENTS**. If your data
contains such a column and the words in that column are truely segmentized,
using space as a separation marker, you can use the Phonology module to inspect
the sounds of each of the languages in your dataset.  However, even if your
data is not yet segmented, you can still use the EDICTOR Phonology module by
trusting the automatic segmentation algorithm. In this case, your data should
contain one field with transcriptions, either called **TRANSCRIPTION** or
**IPA**.

# Features

+++ pending +++

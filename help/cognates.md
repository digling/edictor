# Cognate Sets Module of the EDICTOR

The Cognate Sets panel of the EDICTOR serves two major purposes:

* it helps to quickly and savely annotate words to cognate groups, and
* it allows to directly align all words which have been identified as being cognate.

# Basic Requirements

The first basic requirements is phonetic data in segmentized form, since otherwise you won't be able to align the words in your datasets.

The second requirement is a column which stores the cognate identifiers and is labeled as such. The easiest way to accomplish this is to label one of the columns in your data as COGID. Alternatively, you can specify the column which shall serve as your current cognate storage via the settings menu, and you can even switch between different versions in one sessions.

The third requirement is a (potentially empty) column storing the alignments. If you do not have this column yet, it will be automatically created when you carry out your first alignment analysis. 

# Features

## Editing Cognate Sets

There are two basic operations that are supposed to help in editing cognate sets. One is called "new" and one is called "combine". 
For each of the two procedures you need to select words by clicking on the selection fields on the right of the cognate sets table.
By clicking on "new" you will create new cognate identifiers for the respective words. By clicking on combine, all cognate sets with the same cognate identifier as the ones you identified by clicking on them will be merged to form a large new group which retrieves the smallest of the cognate identifiers in the cluster. 

## Aligning Cognate Sets

In order to immediately align the cognates that you just assigned, click on the button with the two white stripes on the right of each cognate set. This will open a popup window in which you can align the words. 
More details on main functions for alignment analyses can be found there.

## Selecting Data by Concepts

If you want to search for cognates across concepts, you can do so by just selecting your preferred concepts where you suspect cognates across different meanings, and carry on with your annotation. Cognate identifiers are always global in the EDICTOR, so it does not matter whether you annotate cognates inside or across concepts. 

## Sorting Data and other Operations

By double clicking on the column, you can sort the data, but this is usually not really helpful when working with small sets of languages.
However, you should test the menu buttons, like the arrows, which bring you to the previous or the following concepts, or the OK button, which refreshes the data.

 

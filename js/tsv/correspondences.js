/* Correspondence viewer interface background code.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2015-01-24 17:27
 * modified : 2015-01-24 17:27
 *
 */

var CORRS = {};

/* simple starter for activation */
CORRS.start = function() {
  var d = CORRS.get_doculects();
  var d1 = d[0];
  var d2 = d[1];

  var corrs = CORRS.correspondences(d1,d2);
  var refs = corrs[1];
  corrs = corrs[0];
  console.log('correspondences',d1,d2,corrs,refs);
}
  
/* get the taxa */
CORRS.get_doculects = function() {
  doculA = document.getElementById('corrs_docula').value;
  doculB = document.getElementById('corrs_doculb').value;
  if (!(doculA in WLS.taxa) || !(doculB in WLS.taxa)) {
    fakeAlert("Doculects you selected could not be found!");
    return;
  }
  return [doculA,doculB];
  
};

/* simple function for alignment browsing */
CORRS.shared_cognates = function(doculA,doculB) {
  
  /* object stores the matches */
  var matches = {};
  
  /* get all shared cognates */
  var shared = {};
  var idxsA = WLS['taxa'][doculA];
  var idxsB = WLS['taxa'][doculB];
  
  var cogidsA = {};
  var cogidsB = {};
  var shared_cogids = {};
  /* iterate over idxsA */
  for (var i=0,idx; idx=idxsA[i]; i++) {
    var cogid = WLS[idx][CFG['_fidx']]; // replace by formater afterwards
    cogidsA[cogid] = idx;
  }
  for (var i=0,idx; idx=idxsB[i]; i++) {
    var cogid = WLS[idx][CFG['_fidx']]; // replace by formater afterwards
    cogidsB[cogid] = idx;
  }
  /* get what is in both */
  var count = 0;
  for (key in cogidsA) {
    if (key in cogidsB) {
      console.log(key);
      shared_cogids[key] = [cogidsA[key],cogidsB[key]];
      count += 1;
    }
  }

  return shared_cogids;
};

CORRS.correspondences = function(doculA, doculB) {
  
  /* get shared cognate ids */
  var shared_cogids = CORRS.shared_cognates(doculA,doculB);
  
  /* object for corres */
  var corrs = {};
  var refs = {}

  /* get index of alignments */
  var aidx = WLS.header.indexOf('ALIGNMENT');
  for (key in shared_cogids) {
    /* get the concept */
    var concept = WLS[shared_cogids[key][0]][CFG['_cidx']];

    /* get the alignemnts */
    var almA = WLS[shared_cogids[key][0]][aidx].split(' ');
    var almB = WLS[shared_cogids[key][1]][aidx].split(' ');
    
    /* check for valid alignments */
    if (almA.length != almB.length) {
      console.log('bad alignments encountered');
    }
    else {
      /* iterate over the zipped alignments, also append the concepts as a
       * reference for later backtracking */
      for (var i=0; i<almA.length; i++) {
	segA = almA[i];
	segB = almB[i];
	/* make sure no double gaps are encountered */
	if (!(segA == '-' && segB == '-')) {
	  if (segA+'//'+segB in corrs){
	    corrs[segA+'//'+segB] += 1;
	    refs[segA+'//'+segB].push(concept);
	  }
	  else {
	    corrs[segA+'//'+segB] = 1;
	    refs[segA+'//'+segB] = [concept];
	  }
	}	
      }
    }
  }

  return [corrs,refs];
}


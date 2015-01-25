/* Correspondence viewer interface background code.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2015-01-24 17:27
 * modified : 2015-01-24 17:27
 *
 */

var CORRS = {};

/* http://stackoverflow.com/questions/16449295/a-concise-way-to-sum-the-values-of-a-javascript-object */
function sumValues( obj ) {
  var sum = 0;
  for( var el in obj ) {
    if( obj.hasOwnProperty( el ) ) {
      sum += parseFloat( obj[el] );
    }
  }
  return sum;
}

/* simple starter for activation */
CORRS.show_correspondences = function(sorter,direction) {
  var d = CORRS.get_doculects();
  var d1 = d[0];
  var d2 = d[1];

  /* get shared cogids */
  shared_cogs = CORRS.shared_cognates(d1,d2);
  
  /* ugly lines to get the stuff disentangled */
  var corrs = CORRS.correspondences(d1,d2,shared_cogs);
  var refs = corrs[1];
  corrs = corrs[0];
  
  /* sort corrs.keys */
  var keys = Object.keys(corrs);

  /* get shared cognate indices for both doculs */
  var idxsA = [];
  var idxsB = [];
  for (k in shared_cogs) {
    idxsA.push(shared_cogs[k][0]);
    idxsB.push(shared_cogs[k][1]);
  }
  
  /* compute internal and external (background) occurrences */
  var occsA = CORRS.occurrences(doculA,idxsA);
  var occsB = CORRS.occurrences(doculB,idxsB);
  var occs_bgA = CORRS.occurrences(doculA);
  var occs_bgB = CORRS.occurrences(doculB);
  
  /* compute total frequencies */
  var occs_bglA = sumValues(occs_bgA);
  var occs_bglB = sumValues(occs_bgB);
  var corrsl = sumValues(corrs);

  
  /* create array of data for sorted display */
  var data = [];

  for (var i=0,k; k=keys[i]; i++) {
    var s12 = k.split('//');
    var tk1 = s12[0];
    var tk2 = s12[1];
    var s1 = plotWord(tk1,'span');
    var s2 = plotWord(tk2,'span');
    var freq = corrs[k];
    var concepts = refs[k];

    /* get the occurrences */
    if (tk1 in occsA) {
      var occA = occsA[tk1];
    }
    else {
      var occA = 0;
    }
    if (tk2 in occsB) {
      var occB = occsB[tk2];
    }
    else {
      var occB = 0;
    }
    if (tk1 in occs_bgA) {
      var occ_bgA = occs_bgA[tk1];
    }
    else {var occ_bgA = 0}
    if (tk2 in occs_bgB) {
      var occ_bgB = occs_bgB[tk2];
    }
    else {var occ_bgB = 0}

    
    /* determine a score for occurrence and matches */
    var expectedA = occ_bgA / occs_bglA;
    var expectedB = occ_bgB / occs_bglB;

    var expected = expectedA != 0 && expectedB != 0 ? (expectedA * expectedB) : 0.00005;
    var attested = freq > 1 ? freq / corrsl : 0.00005;

    var score = Math.log(attested / expected).toFixed(0);
    score = typeof score != 'undefined' && !(isNaN(score)) ? score : 0;
    
    /* get the index for the filtering of occurrences */
    var filter = [];
    for (var j=0,concept; concept = concepts[j]; j++) {
      filter.push(WLS.c2i[concept]);
    }
    filter = filter.join(',');
    concepts = '&quot;' + concepts.join('&quot;, &quot;') + '&quot;';

    data.push([
	s1,
	tk1,
	occA,
	occ_bgA,
	s2,
	tk2,
	occB,
	occ_bgB,
	freq,
	score,
	concepts,
	filter
	]);
  }
  /* make a translater for the sort */
  var translate = {
    'doculA' : 1,
    'doculB' : 5,
    'occA' : 2,
    'occB' : 6,
    'freq' : 8,
    'score' : 9
  };

  /* sort data */
  if (['doculA', 'doculB'].indexOf(sorter) != -1) {
    var dsorter = function (x,y) {
      var _x = getSoundClass(x[translate[sorter]]).charCodeAt(0);
      var _y = getSoundClass(y[translate[sorter]]).charCodeAt(0);
      if (direction == 1) {
	return _x != _y ? _x - _y : x[translate[sorter]].charCodeAt(0) - y[translate[sorter]].charCodeAt(0); 
      }
      else {
	return _x != _y ? _y - _x : y[translate[sorter]].charCodeAt(0) - x[translate[sorter]].charCodeAt(0); 
      }
    };
  }
  else {
    var dsorter = function(x,y) {
      _x = x[translate[sorter]];
      _y = y[translate[sorter]];
      return direction == 1 ? _x - _y : _y - _x;
    };
  }
  data.sort(dsorter);

  /* determine new sort direction for sorting */
  var fields = ['doculA','occA','doculB','occB','freq','score'];
  for (var i=0,field; field=fields[i]; i++) {
    if (sorter == field) {
      var dir = direction == 1 ? 0 : 1;
      var cls = 'sorted';
    }
    else {
      var dir = 1;
      var cls = 'unsorted';
    }
    translate[field] = [cls,'CORRS.show_correspondences('+"'"+field+"',"+ dir+")"];
  }

  /* display corrs */
  var txt = '<table class="data_table">';
  txt += '<tr>'
    + '<th title="double-click to sort" class="'+translate['doculA'][0]+'" ondblclick="'+translate['doculA'][1]+'">'+doculA+'</th>'
    + '<th title="double-click to sort" class="'+translate['occA'][0]  +'" ondblclick="'+translate['occA'][1]  +'">Occur.</th>'
    + '<th title="double-click to sort" class="'+translate['doculB'][0]+'" ondblclick="'+translate['doculB'][1]+'">'+doculB+'</th>'
    + '<th title="double-click to sort" class="'+translate['occB'][0]  +'" ondblclick="'+translate['occB'][1]  +'">Occur.</th>'
    + '<th title="double-click to sort" class="'+translate['freq'][0]  +'" ondblclick="'+translate['freq'][1]  +'">Matches</th>'
    + '<th title="double-click to sort" class="'+translate['score'][0] +'" ondblclick="'+translate['score'][1] +'">Score</th>'
    + '<th>CONCEPTS</th>';
  txt += '</tr>';

  for (var i=0,line; line=data[i]; i++) {

    txt += '<tr>'
      + '<td>' + line[0] + '</td>'
      + '<td>' + line[2] +'<sub>('+ line[3] +')</sub>'+'</td>'
      + '<td>' + line[4] + '</td>'
      + '<td>' + line[6] + '<sub>('+line[7]+')</sub>'+ '</td>'
      + '<td>' + line[8] + '</td>'
      + '<td>' + line[9] + '</td>'
      + '<td title="click to view all matches" class="concepts pointed" onclick="filterOccurrences(\''+doculA+','+doculB+'\',\''+line[11]+'\')">' + line[10] + '</td>'
      + '</tr>';  
  }
  txt += '</table>';

  document.getElementById('correspondence_table').innerHTML = txt;
};
  
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
      shared_cogids[key] = [cogidsA[key],cogidsB[key]];
      count += 1;
    }
  }

  return shared_cogids;
};

/* get occurrences of each token */
CORRS.occurrences = function(docul, idxs) {
  if (typeof idxs == 'undefined') {
    idxs = WLS.taxa[docul];
  }
  
  /* we take tokens from the alignment, for the simple reason that 
   * we want also to search for instances of gaps which may be useful
   * for the later calculation,
   * XXX note that later on we have to allow the user to switch between
   * "alignment" and ohter keywords for the alignment column */
  var tidx = WLS.header.indexOf('ALIGNMENT');
  var occs = {};
  for (var i=0,idx; idx=idxs[i]; i++) {
    var tks = WLS[idx][tidx].split(' ');
    for (var j=0,tkn; tkn=tks[j]; j++) {
      if (!(tkn in occs)) {
	occs[tkn] = 1;
      }
      else {
	occs[tkn] += 1;
      }
    }
  }
  return occs;
};

CORRS.correspondences = function(doculA, doculB, shared_cogids) {
  
  /* get shared cognate ids */
  if (typeof shared_cogids == 'undefined') {
    shared_cogids = CORRS.shared_cognates(doculA,doculB);
  }
  
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
};


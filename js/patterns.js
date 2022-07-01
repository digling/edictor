/* Pattern parser for edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-10-24 17:46
 * modified : 2021-10-14 23:00
 *
 */
/* XXX check for alignments etc. in data */
var PATS = {};
PATS.matrix = [];
PATS.preview = 30;
PATS.length = 0;
PATS.threshold = 3;
PATS.patterns = {};

/* compatibility function for pattern sorting */
PATS.compatible = function(x, y) {
  var compatible = 0;
  var i;
  for (i=0; i<x.length; i++) {
    if (x[i] != y[i] && x[i] != UTIL.settings.missing_marker && y[i] != UTIL.settings.missing_marker) {
      return false;
    }
    else if (x[i] != UTIL.settings.missing_marker && y[i] != UTIL.settings.missing_marker && x[i] != CFG.gap_marker && y[i] != CFG.gap_marker){
      compatible += 1;
    }
  }
  if (compatible == 0) {
    return false;
  }
  return compatible;
};

/* consensus string for a given pattern */
PATS.consensus = function(x) {
  /* consensus is the proto sound if the option is chosen */
  if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    return x[0];
  }
  var count, best_count, best_char, i;
  var visited = [];
  var uniques = [];
  var freqs = [];
  for (i=0; i<x.length; i++) {
    if (x[i] == UTIL.settings.missing_marker || x[i][0] == '!'){}
    else if (LIST.has(visited, x[i])) {}
    else {
      uniques.push(x[i]);
    }
  }
  best_count = 0;
  best_char = '';
  for (i=0; i<uniques.length; i++) {
    count = LIST.count(x, uniques[i]);
    if (count > best_count) {
      best_count = count;
      best_char = uniques[i];
    }
  }
  return best_char;
};

PATS.get_patterns = function(lengths){
  /* define vars here */
  var etyma, roots, rows, alm;
  var i, j, idx, tidx;
  var etymon, taxon, concept, segment, token;

  PATS.matrix = [];
  if (typeof lengths == 'undefined'){
    lengths = 3;
  }
  if (CFG._morphology_mode == 'partial'){
    roots = WLS.roots;
    function get_wls(idx){return roots[idx].map(function (x){return x[0];})}
    function get_idx(lst, idx){return lst[idx][0]}
    function get_alm(etym){return ALIGN.alignable_parts(MORPH.get_morphemes(WLS[etym[0]][CFG._alignments].split(' '))[etym[1]]);}
  }
  else {
    roots = WLS.etyma;
    function get_wls(idx){return roots[idx]}
    function get_idx(lst, idx){return lst[idx]}
    function get_alm(etym){return ALIGN.alignable_parts(WLS[etym][CFG._alignments].split(' '));}
  }
  /* make proto first of the selected doculects */
  if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    PATS.selected_doculects = [CFG.proto];
    for (i=0; i<CFG._selected_doculects.length; i++) {
      if (CFG._selected_doculects[i] != CFG.proto) {
	      PATS.selected_doculects.push(CFG._selected_doculects[i]);
      }
    }
  }
  else {
    PATS.selected_doculects = CFG._selected_doculects;
  }

  /* start the loop over the etyma array */
  PATS.length = CFG._selected_doculects.length + 5;
  for (etymon in roots) {
    if (roots[etymon].length >= lengths) {
      /* determine the taxa first */
      etyma = [];
      for (i=0; i < roots[etymon].length; i++) {
        taxon = WLS[get_wls(etymon)[i]][CFG._tidx];
        if (PATS.selected_doculects.indexOf(taxon) != -1) {
          etyma.push(roots[etymon][i]);
        }	  
      }
      if (etyma.length > 1) {
        /* determine size of alignment */
        //var idx = etyma[0];
        idx = get_idx(etyma, 0);
        taxon = WLS[idx][CFG._tidx];
        alm = get_alm(etyma[0]);
        concept = WLS[idx][CFG._cidx];
        tidx = PATS.selected_doculects.indexOf(taxon)+4;
        rows = [];
        for (i=0; i<alm.length; i++) {
          rows.push(Array.from('Ø'.repeat(PATS.length-1)))
          rows[i][0] = etymon;
          rows[i][1] = i+1;
          rows[i][3] = [concept];
          rows[i][tidx] = [idx, i, alm[i], etymon];
        }
        for (i=1; i<etyma.length; i++) {
          idx = get_idx(etyma, i);
          taxon = WLS[idx][CFG._tidx];
          tokens = get_alm(etyma[i]); 
          concept = WLS[idx][CFG._cidx];
          tidx = PATS.selected_doculects.indexOf(taxon)+4;
          for (j=0; j<alm.length; j++) {
            segment = tokens[j];
            if (typeof segment == 'undefined') {
              segment = '?';
            }
            rows[j][tidx] = [idx, j, segment, etymon];
            if (rows[j][3].indexOf(concept) == -1) {
              rows[j][3].push(concept);
            }
          }
        }
        for (i=0; i<rows.length; i++) {
          rows[i].push(rows[i].slice(4, rows[i].length).map(
            function(x) {
              if (x.length == 1) {
                return x;
              }
              else if (x[2].indexOf("/") != -1) {
                return x[2].split("/")[1];
              }
              return x[2]
            }
          ));
          PATS.matrix.push(rows[i]);
        }
      }
    }
  }
  /* first sort for the greedy algo */
  PATS.matrix.sort(function (x, y){
    var i, j, pA, pB, pAl, pBl, cpt, pats, k, tup;
    pA = x.slice(4, x.length).map(function(z){if (z.length == 1){return z} return z[2]});
    pB = y.slice(4, y.length).map(function(z){if (z.length == 1){return z} return z[2]});
    if (pA[0] == '!') {
      pA = UTIL.settings.missing_marker;
    }
    if (pB[0] == '!') {
      pB = UTIL.settings.missing_marker;
    }
    pAl = LIST.count(pA, UTIL.settings.missing_marker);
    pBl = LIST.count(pB, UTIL.settings.missing_marker);
    cpt = PATS.compatible(pA, pB);
    if (cpt) {
      if (pAl == pBl) {
        return 0;
      }
      else if (pAl < pBl) {
        return -1;
      }
      else {
        return 1;
      }
    }
    else {
      return pA.join(',').localeCompare(pB.join(','));
    }
  });
  /* first search for consensus patterns */
  PATS.find_consensus();
  /* greedy search refinement, sort by the consensus of the words */
  PATS.matrix.sort(function (x, y) {
    var consA, consB;
    consA = x[PATS.length-1][0].join(',');
    consB = y[PATS.length-1][0].join(',');
    if (consA == consB) {
      return 0;
    }
    return consA.localeCompare(consB);
  });
  /* re-compute and resort consensus to refine search, compute proto-sounds
   * (sounds occuring in fhe first language in the sample for filtering */
  PATS.find_consensus();
  PATS.assign_patterns();
  //PATS.matrix.sort(function (x, y){ 
  //  if (x[PATS.matrix[0].length-1][1] > y[PATS.matrix[0].length-1][1]){
  //    return -1
  //  } 
  //  else if (x[PATS.matrix[0].length-1][1] < y[PATS.matrix[0].length-1][1]) {
  //    return 1
  //  } return 0
  //});
  PATS.matrix.sort(
    function(x, y) {
      if (x[PATS.length-1][2] > y[PATS.length-1][2]) {
        return -1;
      }
      else if (x[PATS.length-1][2] < y[PATS.length-1][2]) {
        return 1;
      }
      else {
        return x[2][0].localeCompare(y[2][0]);
      }
    }
  );

  /* +++ sort by length of pattern, needs recomputing of length, etc. +++ */

  PATS.proto_sounds = {};
  /* XXX replace later with formal construct XXX */
  if (typeof WLS.columns['PATTERNS'] != 'undefined') {
    var tmp_count = {};
    for (i=0; i<PATS.matrix.length; i++) {
      /* try to find the first entry which is not empty */
      token = '?';
      for (j=4; j<PATS.matrix[i].length-1; j++) {
        if (PATS.matrix[i][j] != CFG.missing_marker) {
          pats = WLS[PATS.matrix[i][j][0]][(Math.abs(WLS.columns['PATTERNS'])-1)];
          if (CFG._morphology_mode == 'partial'){
            /* get the index */
            for (k=0; tup=WLS.roots[PATS.matrix[i][0]][k]; k++) {
              if (tup[0] == PATS.matrix[i][j][0]) {
                pats = pats.split(' + ')[tup[1]];
                break;
              }
            }
          }
          token = pats.split(' ')[PATS.matrix[i][j][1]];
          PATS.matrix[i][2][0] = token.split('/')[0].split('-')[0]+'/'+token.split('/')[1];
          tmp_count[PATS.matrix[i][2][0]] = parseInt(token.split('/')[0].split('-')[1]);
          break;
        }
      }
      if (token in PATS.proto_sounds) {
        PATS.proto_sounds[token].push(i);
      }
      else {
        PATS.proto_sounds[token] = [i];
      }
    }
    PATS.matrix.sort(function (x, y) {
      return x[2][0].localeCompare(y[2][0]);
    });
    PATS.find_consensus();
    PATS.matrix.sort(function (x, y) {
      if (tmp_count[x[2][0]] >= tmp_count[y[2][0]]) {
        return x[2][0].localeCompare(y[2][0]);
      }
      else {
        return y[2][0].localeCompare(x[2][0]);
      }
    });
  }
  /* if the proto form is defined, use this to assemble proto forms */
  else if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    var sound, idx;
    for (i=0; i<PATS.matrix.length; i++) {
      [idx, sound] = PATS.matrix[i][2][0].split("/");
      token = sound+" / "+idx;
      if (token in PATS.proto_sounds) {
              PATS.proto_sounds[token].push(i);
      }
      else {
              PATS.proto_sounds[token] = [i];
      }
    }
  }
  else {
    
    /* +++ TODO: add the new function to join patterns in the case that the proto-forms are defined here */
    for (i=0; i<PATS.matrix.length; i++) {
      if (PATS.matrix[i][4].length == 4) {
        if (PATS.matrix[i][4][2].indexOf("/") != -1) {
          token = PATS.matrix[i][4][2].split('/')[1]+' / '+PATS.matrix[i][2][0].split('/')[0];
        }
        else {
          token = PATS.matrix[i][4][2]+' / '+PATS.matrix[i][2][0].split('/')[0];
        }
        if (token in PATS.proto_sounds) {
                PATS.proto_sounds[token].push(i);
        }
        else {
                PATS.proto_sounds[token] = [i];
        }
      }
    }
  }
};

/* assign the pattern ID to a given pattern after consensus has been computed */
PATS.assign_patterns = function(){
  var mcharsA, mcharsB, consensus_char, consensus_list, j, consensus, candidates, cmp, candidate, row, i, next_idx, pattern, consensusA, consensusB, consensusC;
  var pdict = {};
  /* put those patterns aside which do not have a consensus yet to compare them later with the rest */
  var aside = {};
  var consensus_dict = {};
  for (i=0; i<PATS.matrix.length; i++) {
    row = PATS.matrix[i];
    consensus_list = row[PATS.length-1][0];
    consensus_char = PATS.consensus(consensus_list);
    consensus = consensus_list.join(' ');
    if (consensus in pdict) {
      pattern = pdict[consensus]+'/'+consensus_char;
      PATS.patterns[pattern].push([row[0], row[1]]);
      consensus_dict[consensus].push([row[0], row[1], i, pattern]);
    }
    else {
      next_idx = 1;
      if (consensus_char in pdict) {
        next_idx = pdict[consensus_char];
        pdict[consensus_char] += 1;
      }
      else {
        /* here, we need to identify whether there might be a similar pattern in our stack */
        pdict[consensus_char] = next_idx + 1;
      }
      pattern = next_idx+'/'+consensus_char;
      pdict[consensus] = next_idx;
      PATS.patterns[pattern] = [[row[0], row[1]]];
      if (consensus_list.indexOf(CFG.missing_marker) != -1) {
        if (consensus in aside){
          aside[consensus].push(i);
        }
        else {
          aside[consensus] = [i];
        }
      }
      consensus_dict[consensus] = [[row[0], row[1], i, pattern]];
    }
    PATS.matrix[i][2] = [pattern, row[0], row[1]];
  }
  PATS.consensus_dict = consensus_dict;
  if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    /* group by proto */
    var pregroups = {};
    var cchar;
    for (consensusA in aside) {
      cchar = consensusA.split(" ")[0];
      if (cchar in pregroups) {
        pregroups[cchar][consensusA] = aside[consensusA];
      }
      else {
        pregroups[cchar] = {consensusA: aside[consensusA]};
      }
    }
    for (cchar in pregroups) {
      for (consensus in pregroups[cchar]) {
        candidates = [];
        mcharsA = consensusA.split(" ").filter(x => x == CFG.missing_marker);
        for (consensusB in consensus_dict) {
          if (consensusB != consensusA) {
            mcharsB = consensusB.split(" ").filter(x => x == CFG.missing_marker);
              if (mcharsA >= mcharsB) {
              cmp = PATS.compatible(consensusB.split(" "), consensusA.split(" "));
              if (cmp != false && cmp > 0) {
                consensusC = PATS.pattern_consensus([consensusA.split(" "), consensusB.split(" ")]);
                candidates.push([
                  cmp, 
                  consensusB.split(" "), 
                  consensus_dict[consensusB].length,
                  consensus_dict[consensusB][0][2],
                  consensus_dict[consensusB][0][3],
                  consensus_dict[consensusB],
                  consensusC]);
              }
            }
          }
        }
        //console.log("candidates", consensusA, candidates);
        if (candidates.length > 0) {
          candidates.sort(
            function(x, y) {
              var k;
              if (x[0]-y[0] == 0){
                return y[2] - x[2];
                //return (x[1].filter(k => k == CFG.missing_marker).length - y[1].filter(k => k == CFG.missing_marker).length);
              }
              return (y[0]-x[0]);
            }  
          );
          candidate = candidates[0];
          console.log(consensusA, consensusC, candidate);
          [consensusB, consensusC] = [candidate[1], candidate[6]];
          if (consensusB.join(" ") != consensusC.join(" ")) {
            for (j=0; j<candidate[5].length; j++) {
              i = candidate[5][j][2];
              PATS.matrix[i][PATS.length-1][0] = consensusC;
            }
            consensus_dict[consensusC.join(" ")] = consensus_dict[consensusB.join(" ")];
            delete consensus_dict[consensusB.join(" ")];
          }

          for (j=0; i=aside[consensusA][j]; j++) {
            PATS.matrix[i][2][0] = candidate[4]; 
            PATS.matrix[i][PATS.length-1][0] = consensusC;
            PATS.patterns[candidate[4]].push([PATS.matrix[i][0], PATS.matrix[i][1]]);
          }
        }
      }
    }
    for (i=0; row=PATS.matrix[i]; i++) {
      PATS.matrix[i][PATS.length-1][2] = PATS.patterns[PATS.matrix[i][2][0]].length;
      //PATS.matrix[i][PATS.length-1][1] = PATS.score_patterns(PATS.patterns[PATS.matrix[i][2][0]]);
    }
  }
};

/* XXX make function better, not very good implementation */
PATS.pattern_consensus = function(patterns) {
  var out = [];
  var i, j, col;
  for (i=0; i<patterns[0].length; i++) {
    col = [];
    for (j=0; j<patterns.length; j++) {
      if (patterns[j][i] != UTIL.settings.missing_marker){
	      col.push(patterns[j][i]);
	      break;
      }
    }
    if (col.length > 0) {
      out.push(col[0]);
    }
    else {
      out.push(UTIL.settings.missing_marker);
    }
  }
  return out;
};

/* score patterns, counting non-missing characters per column */
PATS.score_patterns = function(matches) {
  var i, j, pattern;
  if (matches.length == 1) {
    return 0;
  }
  var scores = CFG._selected_doculects.map(function(x){return 0});
  for (i=0; i<matches.length; i++) {
    pattern = PATS.matrix[matches[i]].slice(4, PATS.length-1).map(function (x){if (x.length==1){return x} return x[2]});
    for (j=0; j<pattern.length; j++) {
      if (pattern[j] != UTIL.settings.missing_marker && pattern[j][0] != '!') {
        scores[j] += 1;
      }
    }
  }
  return LIST.sum(scores) / scores.length;
  
};

/* function calculates greedy clusters of compatible sets of nodes */
PATS.find_consensus = function(){
  var next, patsum, i, j, row, phons;
  var previous = PATS.matrix[0].slice(4, PATS.length-1).map(
    function(x){
      if (x.length == 1) {
        return x;
      }
      else if (x[2].indexOf("/") != -1) {
        return x[2].split("/")[1];
      }
      return x[2]
    }
  );
  var matches = [];
  for (i=0; row=PATS.matrix[i]; i++) {
    next = PATS.matrix[i].slice(4, PATS.length-1).map(
      function(x){
        if (x.length == 1) {
          return x;
        }
        return x[2].split('.').map(unslash).join(".");
      }
    );
    if (PATS.compatible(previous, next)) {
      matches.push(i);
      previous = PATS.pattern_consensus([previous, next]);
    }
    else {
      patsum = PATS.score_patterns(matches);
      for (j=0; j<matches.length; j++) {
      	PATS.matrix[matches[j]][PATS.length-1] = [previous, patsum, matches.length];
      }
      previous = next;
      matches = [i];
    }
  }
  patsum = PATS.score_patterns(matches);
  for (i=0; i<matches.length; i++) {
    PATS.matrix[matches[i]][PATS.matrix[0].length-1] = [previous, patsum, matches.length];
  }
};

PATS.next_preview = function(){
  PATS.current = PATS.current + PATS.preview;
  if (PATS.current >= PATS.matrix.length) {
    PATS.current = 0;
  }
  PATS.simple_refresh();
};

PATS.previous_preview = function(){
  if (PATS.current <= 0) {
    PATS.current = PATS.matrix.length-PATS.preview;
  }
  else {
    PATS.current = PATS.current - PATS.preview;
    if (PATS.current < 0) {
      PATS.current = 0;
    }
  }
  PATS.simple_refresh();
};


PATS.simple_refresh = function(){
  document.getElementById('patterns_table').innerHTML = PATS.DTAB.render(PATS.current, PATS.length-1, function(x){return x.join(',');});
  document.getElementById('PATS_current').innerHTML = (PATS.current+1) + '-'+(PATS.current+PATS.preview)+' of '+Object.keys(PATS.matrix).length+' Sites';
  //XXX PATS.getSorters();

};

PATS.refresh = function() {
  PATS.current = 0;
  var cid = document.getElementById('pats_select_cognates');
  PATS.selected = [];
  for (var i=0,option; option=cid.options[i]; i++) {
    if (option.selected) {
      PATS.selected.push(option.value);
    }
  }
  PATS.preview=parseInt(document.getElementById('PATS_preview').value);

  document.getElementById('patterns_table').innerHTML = PATS.render_matrix().render(PATS.current, PATS.length-1, function (x){return x.join(',');});
  var preview = PATS.preview+PATS.current;
  if (preview > PATS.DTAB.idxs.length) {
    preview = PATS.DTAB.idxs.length;
  }
  document.getElementById('PATS_current').innerHTML = (PATS.current+1) + '-'+preview+' of '+PATS.DTAB.idxs.length+' Sites';
};

PATS.show_words = function(elm) {

  var idx = elm.dataset.idx;
  var cogid = elm.dataset.cogid;
  if (CFG._morphology_mode == 'partial') {
    var pidx = WLS[idx][CFG._roots].split(' ').indexOf(cogid);
    var segs = MORPH.get_morphemes(WLS[idx][CFG._segments].split(' '))[pidx].join(' ');
  }
  else {
    var segs = WLS[idx][CFG._segments];
  }
    
  if (elm.dataset.toggle == '1') {
    elm.dataset.toggle = '0';
    elm.innerHTML = plotWord(segs, 'span');
  }
  else {
    elm.dataset.toggle = '1';
    elm.innerHTML = plotWord(elm.dataset.segment);
  }
};

PATS.render_matrix = function(lengths) {
  var threshold, i, j, egroup, _columns, columns, titles, idxs, row, sound, sounds, doculect;

  threshold = document.getElementById('PATS_threshold');
  if (threshold == null) {}
  else {
    PATS.threshold = threshold.value;
  }

  /* get settings depending on morphology mode */
  if (CFG._morphology_mode == 'partial') {
    egroup = 'PART.editGroup(event, ';
  }
  else {
    egroup = 'editGroup(event, ';
  }

  PATS.get_patterns(PATS.threshold);
  PATS.length = PATS.matrix[0].length;
  _columns = function(cell, idx, head) {
    if (cell[0] == UTIL.settings.missing_marker){
    return '<td id="PATS_'+head+'_'+idx+'" title="missing data' + 
      '" style="background-color:lightgray;text-align:center;padding:0px;margin:0px;">Ø</td>';
    }
    return '<td class="pointed" data-toggle="1" data-idx="'+cell[0]+'" data-cogid="'+cell[3]+'" data-pos="'+cell[1]+'" data-segment="'+cell[2]+'" id="PATS_'+head+'_'+idx+'" title="click to show segments" onclick="PATS.show_words(this);" ' +
      '>'+plotWord(cell[2])+'</td>';
  };
  columns = [function(cell, idx, head){
    return '<td class="pointed" id="PATS_'+head+'_'+idx+'" title="click to show alignment" onclick="'+egroup+cell+');" ' + 
	'style="text-align:center;border-radius:10px;background-color:salmon;">'+cell+'</td>';
  },
    function(cell, idx, head) {
      return '<td>'+cell+'</td>';
    },
    function(cell, idx, head) {
      return '<td onclick="PATS.editPattern(this);" data-cogid="'+cell[1]+'" data-pos="'+cell[2]+'"><span>'+plotWord(cell[0].split('/')[1], 'span')+' / <span class="dolgo_ERROR">'+cell[0].split('/')[0]+'</span></span></td>';
    },
    function(cell, idx, head) {
      return '<td>'+cell+'</td>';
    },
  ];
  for (i=0; i<PATS.selected_doculects.length; i++) {
    columns.push(_columns);
  }
  columns.push(function(cell, idx, head){
    return '<td>'+Number(cell[1]).toFixed(2) + ' / ' + cell[2] +'</td>';
  });

  
  PATS.header = ['COGNATES', 'INDEX', 'PATTERN', 'CONCEPTS']
  for (i=0; doculect=PATS.selected_doculects[i]; i++) {
    PATS.header.push(doculect.slice(0, 3));
  }
  PATS.header.push('SIZE');
  titles = ['cognate sets', 'pattern position', 'pattern number', 'concepts'].concat(PATS.selected_doculects);
  titles.push('pattern sizes');
  PATS.DTAB = getDTAB('PATS', PATS.header, PATS.matrix, columns, titles, PATS.preview);
  
  /* filter patterns */
  if (typeof PATS.selected != 'undefined' && PATS.selected.length > 0) {
    idxs = [];
    /* XXX refine later */
    if (typeof WLS.columns['PATTERNS'] != 'undefined') {
      sounds = [];
      for (i=0; i<PATS.selected.length; i++) {
	      sound = PATS.selected[i].split('-')[0]+'/'+PATS.selected[i].split('/')[1];
	      sounds.push(sound);
      }
      for (i=0; i<PATS.matrix.length; i++) {
	      sound = PATS.matrix[i][2][0];
	      if (LIST.has(sounds, sound)) {
	        idxs.push(i);
	      }
      }
    }
    else {
      for (i=0; i<PATS.matrix.length; i++) {
        row = PATS.matrix[i];
        sound = row[PATS.matrix[0].length-1][0][0]+ ' / ' +row[2][0].split('/')[0];
        if (LIST.has(PATS.selected, sound)) {
                idxs.push(i);
        }
      }
    }
    if (idxs.length != 0) {
      PATS.DTAB.idxs = idxs;
    }
  }
  return PATS.DTAB;
};

PATS.select_proto = function(){
  var text = '<div style="background-color:white;"><table style="width:100%;background-color:white;"><tr>';
  var count = 0;
  for (var sound in PATS.proto_sounds) {
    if (count == 3) {
      count = 0;
      text += '</tr><tr>';
    }
    text += '<td><input type="checkbox" /></td>';
    text += '<td>'+plotWord(sound.split('/')[0].replace(' ', ''), 'span')+'</td><td style="white-space:nowrap">'+sound.split('/')[1]+' ('+PATS.proto_sounds[sound].length+' × in data)</td>';
    count += 1;
  }
  fakeAlert(text+'</tr></table>');
};

/* render data in table */
PATS.render_patterns = function(elm) {
  var sounds;
  if (CFG._alignments == -1) {
    fakeAlert('Your data does not contain alignments.');
    return;
  }
  if (typeof elm != 'undefined') {
    elm.display = 'none';
  }
  PATS.current = 0;
  var dtab = PATS.render_matrix();
  var menu = ''; //'<button onclick="PATS.select_proto();" class="btn btn-primary mright" title="filter by proto-language">FILTER</button>';
  menu +=  '<select id="pats_select_cognates" multiple="multiple" class="multiselect" title="Select patterns">';
  for (sound in PATS.proto_sounds) {
    menu += '<option id="pats_'+sound+'" value="'+sound+'" selected>*'+sound+' ('+PATS.proto_sounds[sound].length+' × in data)</option>';
  }
  menu += '</select>';
  //var menu = '';
  menu += '<label class="btn btn-primary mright" style="padding:4px;" title="threshold selection">THR.</label><input id="PATS_threshold" title="select threshold" style="width:30px;padding:4px;" class="btn btn-primary mright" value="'+PATS.threshold+'" type="number"/>';
  menu += '<label class="btn btn-primary mright" style="padding:4px" title="preview selection">PREV.</label><input id="PATS_preview" title="select preview" style="width:60px;padding:4px;" class="btn btn-primary mright" value="'+PATS.preview+'" type="number"/>';
  menu += '<button class="btn btn-primary mright submit3" onclick="PATS.refresh()" title="update selection">OK</button>';
  menu += '<button class="btn btn-primary mright submit3" onclick="PATS.previous_preview();" title="go to previous items">←</button>';
  menu += '<button id="PATS_current" class="btn btn-primary mright submit3">';
  menu += (PATS.current+1) + '-'+(PATS.current+PATS.preview)+' of '+Object.keys(PATS.matrix).length+' Sites</button>';
  menu += '<button class="btn btn-primary mright submit3" onclick="PATS.next_preview();" title="go to next items">→</button>';
  menu += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="PATS.render_patterns()"><span class="glyphicon glyphicon-refresh" title="refresh cognates"></span></button>';
  document.getElementById('PATS_menu').innerHTML = menu;
  document.getElementById('patterns_table').innerHTML = dtab.render(0, PATS.length-1, function (x){return x.join(',');});
  $('#pats_select_cognates').multiselect({
    disableIfEmpty: true,
    includeSelectAllOption : true,
    enableFiltering: true,
    maxHeight: window.innerHeight-100,
    buttonClass : 'btn btn-primary mright submit pull-left',
    enableCaseInsensitiveFiltering: true,
    buttonContainer: '<div id="select_patterns_button" class="select_button" />',
    buttonText: function (options, select) {
      return 'Select Sets <b class="caret"></b>';
    }
  });
  //PATS.getSorters();
};

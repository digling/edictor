/* Pattern parser for edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-10-24 17:46
 * modified : 2024-06-09 07:03
 *
 */
/* XXX check for alignments etc. in data */
var PATS = {};
PATS.matrix = [];
PATS.preview = 30;
PATS.length = 0;
PATS.threshold = 2;
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

/* Method retrieves the patterns from the data and recalculates 
 * the underlying matrix #MATRIX */
PATS.get_patterns = function(lengths){
  /* define vars here */
  var etyma, roots, rows, alm;
  var i, j, idx, tidx;
  var etymon, taxon, concept, segment, token;

  PATS.matrix = [];
  if (typeof lengths == 'undefined'){
    lengths = 2;
  }
  if (CFG._morphology_mode == 'partial'){
    roots = WLS.roots;
    PATS.roots = roots;
    function get_wls(idx){return roots[idx].map(function (x){return x[0];})}
    function get_idx(lst, idx){return lst[idx][0]}
    function get_alm(etym){return ALIGN.alignable_parts(MORPH.get_morphemes(WLS[etym[0]][CFG._alignments].split(' '))[etym[1]]);}
  }
  else {
    roots = WLS.etyma;
    PATS.roots = roots;
    function get_wls(idx){return roots[idx]}
    function get_idx(lst, idx){return lst[idx]}
    function get_alm(etym){return ALIGN.alignable_parts(WLS[etym][CFG._alignments].split(' '));}
  }

  if (typeof roots == "undefined") {
    fakeAlert("Cognate sets could not be found, please check settings.");
  }
  
  /* make proto first of the selected doculects */
  if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    PATS.selected_doculects = [CFG.proto];
    for (i = 0; i < CFG.sorted_taxa.length; i += 1) {
      if (CFG.sorted_taxa[i] != CFG.proto && CFG._selected_doculects.indexOf(
        CFG.sorted_taxa[i]) != -1) {
	      PATS.selected_doculects.push(CFG.sorted_taxa[i]);
      }
    }
  }
  else {
    PATS.selected_doculects = [];
    for (i = 0; i < CFG.sorted_taxa.length; i += 1){
      if (CFG._selected_doculects.indexOf(CFG.sorted_taxa[i]) != -1){
        PATS.selected_doculects.push(CFG.sorted_taxa[i]);
      }
    }
  }

  /* start the loop over the etyma array */
  /* fill matrix with content #MATRIX */
  PATS.length = CFG._selected_doculects.length + 5;
  for (etymon in roots) {
    console.log(etymon);
    console.log(PATS.matrix.length);
    /* determine here if the patttern should be considered, otherwise exclude the etymon*/
    if (roots[etymon].length >= lengths) {
      /* determine the taxa first, since we count by 
       * taxonomic units, select only one entry per 
       * taxa in the same cognate set */
      etyma = [];
      for (i = 0; i < roots[etymon].length; i += 1) {
        taxon = WLS[get_wls(etymon)[i]][CFG._tidx];
        if (PATS.selected_doculects.indexOf(taxon) != -1) {
          etyma.push(roots[etymon][i]);
        }	  
      }
      /* first pass, go only through the matrix entry for etyma 0
       * that is, the first entry here, nothing more
       * later, in the second pass, the same is done, but this time 
       * iterating over the remaining entries
       * */
      if (etyma.length >= lengths) {
        /* determine size of alignment */
        idx = get_idx(etyma, 0);
        taxon = WLS[idx][CFG._tidx];
        alm = get_alm(etyma[0]);
        concept = WLS[idx][CFG._cidx];
        tidx = PATS.selected_doculects.indexOf(taxon) + 4;
        rows = [];
        for (i = 0; i < alm.length; i += 1) {
          /* create an array with "Ø" for the matrix */
          rows.push(Array.from('Ø'.repeat(PATS.length - 1)))
          /* the first is the root identifier */
          rows[i][0] = [etymon, i, 0];
          /* the second row is the index of the word,
           * displayed as index + 1 (not starting from 0) */
          rows[i][1] = i + 1;
          /* the row 3 contains all concepts */
          rows[i][3] = [concept];
          /* each entry has four items: word id, 
           * index in word, alignment, and the root */
          rows[i][tidx] = [idx, i, alm[i], etymon];
        }
        for (i = 1; i < etyma.length; i += 1) {
          idx = get_idx(etyma, i);
          taxon = WLS[idx][CFG._tidx];
          tokens = get_alm(etyma[i]); 
          concept = WLS[idx][CFG._cidx];
          tidx = PATS.selected_doculects.indexOf(taxon) + 4;
          for (j = 0; j < alm.length; j += 1) {
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
        /* check for slashed entries */
        for (i = 0; i < rows.length; i += 1) {
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
  if (CFG._recompute_patterns) {
    PATS.assign_patterns();
  }
  else {
    PATS.load_patterns();
  }
  PATS.matrix.sort(
    function(x, y) {
      if (x[PATS.length-1][2] > y[PATS.length-1][2]) {
        return -1;
      }
      else if (x[PATS.length-1][2] < y[PATS.length-1][2]) {
        return 1;
      }
      else {
        /* +++ */
        return String(x[2][0]).localeCompare(String(y[2][0]));
      }
    }
  );

  PATS.proto_sounds = {};
  for (i = 0; i < PATS.matrix.length; i += 1) {
    if (PATS.matrix[i][4].length == 4) {
      if (PATS.matrix[i][4][2].indexOf("/") != -1) {
        token = PATS.matrix[i][4][2].split('/')[1] + ' / ' + PATS.matrix[i][4][0];
      }
      else {
        token = PATS.matrix[i][4][2]+' / '+PATS.matrix[i][2][0];
      }
      if (token in PATS.proto_sounds) {
              PATS.proto_sounds[token].push(i);
      }
      else {
              PATS.proto_sounds[token] = [i];
      }
    }
  }
  /* add patterns to wordlist (like alignments) in case they are not assigned */
  /* +++ PATTERNS ADDING +++ */
  /* represent the patterns by alignment internally */
  PATS.get_indices();
  var patterns, residue, pattern, cognates, cognate;
  var patstrings;
  PATS.idx2pattern = {};

  for (i = 0; idx = WLS._trows[i]; i += 1) {
    alms = WLS[idx][CFG._alignments].split(" + ");
    patterns = [];
    cognates = (CFG._morphology_mode == "full") 
      ? [WLS[idx][CFG._cognates]]
      : WLS[idx][CFG._roots].split(" "); 
    for (j = 0; alm = alms[j]; j += 1) {
      if (typeof alm == "undefined") {
        fakeAlert("Alignment for " + WLS[idx][CFG._taxa] + " / " + WLS[idx][CFG._concepts] + " is problematic.")
      }
      else {
        alm = ALIGN.alignable_parts(alm.split(" "));
        patterns.push([]);
        cognate = cognates[j];
        for (k = 0; residue = alm[k]; k += 1) {
          if (cognate + "-" + k in PATS.pat2mat) {
            patterns[j].push(PATS.matrix[PATS.pat2mat[cognate + "-" + k]][0][2]);
          }
          else {
            patterns[j].push(0);
          }
        }
      }
    }
    PATS.idx2pattern[idx] = patterns;
    if (CFG._patterns != -1 && CFG._recompute_patterns) {
      patstrings = [];
      for (j = 0; j < patterns.length; j += 1) {
        patstrings.push(patterns[j].join(" "));
      }
      WLS[idx][CFG._patterns] = patstrings.join(" + ");
    }
  }
};

PATS.load_patterns = function(){
  var pattern_dict = {};
  var i, idx, j, k, alm, patterns, cognates, cognate, residue, patternid;
  var lookup;
  var visited = {};
  var novisit;
  this.recheck()
  for (i = 0; idx = WLS._trows[i]; i += 1) {
    alms = WLS[idx][CFG._alignments].split(" + ");
    patterns = WLS[idx][CFG._patterns].split(" + ");
    cognates = (CFG._morphology_mode == "full") 
      ? [WLS[idx][CFG._cognates]]
      : WLS[idx][CFG._roots].split(" "); 
    for (j = 0; alm = alms[j]; j += 1) {
      alm = ALIGN.alignable_parts(alm.split(" "));
      cognate = cognates[j];
      if (cognate in visited) {
        visited[cognate] += 1;
      }
      else {
        novisit = false;
        if (typeof patterns[j] == "undefined") {
          pattern = Array.from("0".repeat(alm.length));
          novisit = true;
        }
        else if (patterns[j][0] != "!") {
          pattern = patterns[j].split(" ");
          if (pattern.length == alm.length) {
            novisit = false;
          }
          for (k = 0; residue = alm[k]; k += 1) {
            patternid = pattern[k];
            if (typeof patternid == "undefined") {
              patternid = '0';
            }
            patternid = parseInt(patternid);
            lookup = cognate + "-" + k;
            pattern_dict[cognate + "-" + k] = patternid;
          }
        }
        if (!novisit) {
          visited[cognate] = 1;
        }
      }
    }
  }
  var visited = {};
  var key;
  for (i = 0; i < PATS.matrix.length; i += 1) {
    patternid = pattern_dict[PATS.matrix[i][0][0] + "-" + PATS.matrix[i][0][1]];
    if (typeof patternid != undefined) {
      if (!(patternid in PATS.patterns)) {
        PATS.patterns[patternid] = [];
      }
      else {
        key = PATS.matrix[i][0][0] + "-" + PATS.matrix[i][0][1];
        if (!(key in visited)) {
          PATS.patterns[patternid].push([PATS.matrix[i][0][0], PATS.matrix[i][0][1]]);
          visited[key] = 1;
        }
        else {
          visited[key] += 1;
        }
      }
      PATS.matrix[i][0][2] = patternid;
      PATS.matrix[i][2] = [
        patternid, PATS.matrix[i][0][0], PATS.matrix[i][0][1] + 1, PATS.matrix[i][5][2]];
    }
  }
  PATS.matrix.sort(
    function(x, y) {
      if (x[0][2] > y[0][2]) {
        return -1;
      }
      else if (x[0][2] < y[0][2]) {
        return 1;
      }
      else {
        return 0;
      }
    }
  );
  PATS.find_consensus();
  for (i = 0; i < PATS.matrix.length; i += 1) {
    PATS.matrix[i][2][3] = PATS.matrix[i][PATS.length - 1][0][0];
  }
}

PATS.get_indices = function() {
  var i, row;
  PATS.pos2pat = {};
  PATS.pat2mat = {};
  for (i = 0; row = PATS.matrix[i]; i += 1) {
    PATS.pos2pat[row[0][0] + "-" + row[0][1]] = row[2][0];
    PATS.pat2mat[row[0][0] + "-" + row[0][1]] = i;
  }
  return;
};

/* assign the pattern ID to a given pattern after consensus has been computed */
PATS.assign_patterns = function(){
  var mcharsA, mcharsB, consensus_char, 
    consensus_list, j, consensus, candidates, 
    cmp, candidate, row, i, next_idx, pattern, 
    consensusA, consensusB, consensusC;
  var pdict = {};
  /* put those patterns aside which do not have a consensus yet to compare them later with the rest */
  var aside = {};
  var consensus_dict = {};
  var new_idx = 1;
  for (i = 0; i < PATS.matrix.length; i += 1) {
    row = PATS.matrix[i];
    consensus_list = row[PATS.length-1][0];
    consensus_char = PATS.consensus(consensus_list);
    consensus = consensus_list.join(' ');
    if (consensus in pdict) {
      pattern = pdict[consensus]; //pdict[consensus] + '/' + consensus_char;
      PATS.patterns[pattern].push([row[0][0], row[1]]);
      consensus_dict[consensus].push([row[0][0], row[1], i, pattern]);
    }
    else {
      // +++ next_idx = 1;
      next_idx = new_idx; 
      new_idx += 1;// +++ 
      if (consensus_char in pdict) {
        next_idx = pdict[consensus_char];
        pdict[consensus_char] += 1;
      }
      else {
        /* here, we need to identify whether there might be a similar pattern in our stack */
        pdict[consensus_char] = next_idx + 1;
      }
      pattern = next_idx; // next_idx + '/' + consensus_char;
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
      consensus_dict[consensus] = [[row[0][0], row[1], i, pattern]];
    }
    PATS.matrix[i][2] = [pattern, row[0][0], row[1], consensus_list[0]];
    PATS.matrix[i][0][2] = pattern;
  }
  PATS.consensus_dict = consensus_dict;
};

/* XXX make function better, not very good implementation */
PATS.pattern_consensus = function(patterns) {
  var out = [];
  var i, j, col;
  for (i = 0; i < patterns[0].length; i += 1) {
    col = [];
    for (j = 0; j < patterns.length; j += 1) {
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
  for (i = 0; i < matches.length; i += 1) {
    pattern = PATS.matrix[matches[i]].slice(4, PATS.length-1).map(function (x){if (x.length==1){return x} return x[2]});
    for (j = 0; j < pattern.length; j += 1) {
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
      for (j = 0; j < matches.length; j += 1) {
      	PATS.matrix[matches[j]][PATS.length-1] = [previous, patsum, matches.length];
      }
      previous = next;
      matches = [i];
    }
  }
  patsum = PATS.score_patterns(matches);
  for (i = 0; i < matches.length; i += 1) {
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
};

PATS.refresh = function() {
  var i, option;
  PATS.current = 0;
  var cid = document.getElementById('pats_select_cognates');
  PATS.selected = [];
  for (i = 0; option = cid.options[i]; i += 1) {
    if (option.selected) {
      PATS.selected.push(option.value);
    }
  }
  PATS.preview = parseInt(document.getElementById('PATS_preview').value);

  document.getElementById('patterns_table').innerHTML = PATS.render_matrix().render(PATS.current, PATS.length-1, function (x){return x.join(',');});
  var preview = PATS.preview+PATS.current;
  if (preview > PATS.DTAB.idxs.length) {
    preview = PATS.DTAB.idxs.length;
  }
  document.getElementById('PATS_current').innerHTML = (PATS.current + 1) + 
    '-' + preview + ' of ' + PATS.DTAB.idxs.length + ' Sites';
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

PATS.toggle_segments = function(event, node){
  event.preventDefault();
  var idx = node.dataset["idx"];
  var cogid = node.dataset["cogid"];
  var pos = node.dataset["pos"];
  var segment = node.dataset["segment"];
  if (segment.indexOf(".") != -1) {
    fakeAlert("cannot uncomment segments in grouped sounds for now");
    return;
  }
  if (segment[0] != "!" && segment.indexOf("/") == -1) {
    segment = "!" + segment + "/" + CFG.missing_marker;
  }
  else {
    segment = segment.slice(1, segment.length).split("/")[0];
  }
  /* modify the alignment data point */
  node.dataset["segment"] = segment;
  var cogidx = (CFG._morphology_mode == "full") 
    ? 0 : WLS[idx][CFG._roots].split(" ").indexOf(cogid);
  var alms = WLS[idx][CFG._alignments].split(" + ");
  alms[cogidx] = alms[cogidx].split(" ");

  var i;
  var inbracket = false;
  var count = 0;
  for (i = 0; i < alms[cogidx].length; i += 1) {
    if (alms[cogidx][i] == "(") {
      inbracket = true;
    }
    else if (alms[cogidx][i] == ")") {
      inbracket = false;
    }
    else {
      if (!inbracket) {
        if (count == pos) {
          break;
        }
        else {
          count += 1;
        }
      }
    }
  }

  alms[cogidx][i] = segment;
  alms[cogidx] = alms[cogidx].join(" ");
  alms = alms.join(" + ").split(" ");
  var tokens = [];
  var i;
  for (i = 0; i < alms.length; i += 1) {
    if (alms[i] != "-" && alms[i] != "(" && alms[i] != ")") {
      tokens.push(alms[i]);
    }
  }
  tokens = tokens.join(" ");
  alms = alms.join(" ");
  if (WLS[idx][CFG._alignments] != alms) {
    WLS[idx][CFG._alignments] = alms;
    storeModification([idx], [CFG._alignments], [alms]);
  }
  if (WLS[idx][CFG._segments] != tokens) {
    WLS[idx][CFG._segments] = tokens;
    storeModification([idx], [CFG._segments], [tokens]);
  }
  node.dataset["toggle"] = 1;
  node.innerHTML = plotWord(segment);
}

PATS.render_matrix = function(lengths) {
  var threshold, i, j, egroup, _columns, columns, titles, idxs, row, sound,
    sounds, doculect;

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
      return '<td id="PATS_' + head + '_' + idx + '" title="missing data' + 
        '" style="background-color:lightgray;text-align:center;padding:0px;margin:0px;">Ø</td>';
    }
    return '<td class="pointed" data-toggle="1" data-idx="' + 
      cell[0] + '" data-cogid="' + cell[3]+'" data-pos="' + 
      cell[1] + '" data-segment="' + cell[2]+'" id="PATS_' + 
      head + '_' + idx + '" title="click to show segments / right click to ignore" onclick="PATS.show_words(this);" ' +
      'oncontextmenu="PATS.toggle_segments(event, this)"' +
      '>' + plotWord(cell[2]) + '</td>';
  };
  columns = [
    function(cell, idx, head){
      return '<td class="pointed" id="PATS_' + head + '_' + idx + 
        '" title="click to show alignment" ' + 
        'onclick="PATS.editAlignment(event, this)" ' +
        'data-cogid="' + cell[0] + '" data-pos="' +
        cell[1] + '" data-patternid="' + cell[2] + '" ' + 
	      'style="text-align:center;border-radius:10px;background-color:salmon;">' + 
        cell[0] + '</td>';
    },
    function(cell, idx, head) {
      return '<td>' + cell + '</td>';
    },
    function(cell, idx, head) {
      return '<td id="PATTERN_' + cell[1] + "_" + cell[2] + '" ' + 
        'class="pointed" ' +
        'onclick="PATS.editPattern(event, this);" data-cogid="' + 
        cell[1] + '" data-pos="' + cell[2] + '"' +
        ' data-patternid="' + cell[0] + '"><span>' + 
        plotWord(cell[3], 'span', 'pointed') + 
        ' / <span class="dolgo_ERROR">' + cell[0] + 
        '</span></span></td>';
    },
    function(cell, idx, head) {
      return '<td>'+cell+'</td>';
    },
  ];
  for (i = 0; i < PATS.selected_doculects.length; i += 1) {
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
    for (i=0; i<PATS.matrix.length; i++) {
      row = PATS.matrix[i];
      sound = row[2][3] + ' / ' +row[2][0];
      if (LIST.has(PATS.selected, sound)) {
              idxs.push(i);
      }
    }
    if (idxs.length != 0) {
      PATS.DTAB.idxs = idxs;
    }
  }
  return PATS.DTAB;
};

/* edit patterns to allow for recalculation */
PATS.editAlignment = function(event, node) {

  /* assemble cognate sets and patterns */
  var data = {};
  var i, j, idx, alm;
  var cogid = parseInt(node.dataset["cogid"]);
  var pos = parseInt(node.dataset["pos"]);
  var alms, alm, taxon, concept, morphemes, morpheme, cognates;
  if (CFG._morphology_mode == "full") {
    var ref = CFG._cognates;
    var etymon = cogid;
  }
  else if (CFG._morphology_mode == "partial") {
    var ref = CFG._roots;
    var etymon = [cogid, pos];
  }
  var alm_length = 0;
  var posidx;
  for (i = 0; idx = PATS.roots[cogid][i]; i += 1) {
    /* retrieve the alignment and the taxon */
    if (CFG._morphology_mode == "full") {
      [idx, posidx] = [idx, 0];
    }
    else {
      [idx, posidx] = idx;
    }
    [alm, taxon, concept, morpheme] = [
      WLS[idx][CFG._alignments].split(" + ")[posidx], 
      WLS[idx][CFG._tidx],
      WLS[idx][CFG._cidx], 
      WLS[idx][CFG._segments].split(" + ")[posidx]
    ];
    /* fill the data dictionary with values */
    if (taxon in data) {
      data[taxon].push([
        concept, morpheme.split(" "), 
        ALIGN.alignable_parts(alm.split(" ")), alm.split(" ")]);
    }
    else {
      data[taxon] = [[concept, morpheme.split(" "), 
        ALIGN.alignable_parts(alm.split(" ")), alm.split(" ")]];
      alm_length = data[taxon][0][2].length;
    }
  }
  var table_text = "";
  for (i = 0; taxon = CFG.sorted_taxa[i]; i += 1) {
    if (CFG._selected_doculects.indexOf(taxon) != -1){
      /* format the languages */

      table_text += "<tr>";
      table_text += '<td class="alm_taxon pointed padding">' + taxon + "</td>";

      if (CFG['_subgroup'] > -1){
        table_text += '<td style="padding: 5px">' + 
          WLS["subgroups"][taxon][1].replace(
            "FFF", 
            WLS['subgroups'][taxon][0].slice(0, 3)) + "</td>";
      }

      if (taxon in data) {
        for (j = 0; j < data[taxon].length; j += 1) {
          if (j > 0) {
            table_text += "</tr>";
            table_text += '<tr style="margin: 2px; padding: 2px; background-color: lightgray;">';
            table_text += '<td class="alm_taxon padding">' + taxon + "</td>";
            if (CFG['_subgroup'] > -1){
              table_text += '<td style="padding: 5px">' + 
                WLS["subgroups"][taxon][1].replace(
                  "FFF", 
                  WLS['subgroups'][taxon][0].slice(0, 3)) + "</td>";
            }
          }
          [concept, morpheme, alm] = [
            data[taxon][j][0], data[taxon][j][1], data[taxon][j][2]];
          table_text += '<td class="alm_concept padding">' + concept + "</td>";
          for (k = 0; sound = alm[k]; k += 1) {
            if (k == pos) {
              table_text += plotWord(sound, "td");
            }
            else {
              table_text += plotWord(sound, "td", "dolgo_IGNORE");
            }
          }
        }
      }
      else {
        table_text += '<td class="alm_concept"></td>';
        for (k = 0; k < alm_length; k += 1) {
          if (k == pos){
            table_text += plotWord("Ø", "td");
          }
          else {
            table_text += plotWord("Ø", "td", "dolgo_IGNORE");
          }
        }
      }
      table_text += "</tr>";
    }
  }
  table_text += '<tr style="border-top: 2px solid black;">';
  table_text += '<td colspan="2">PATTERNS</td>';
  for (i = 0; i < alm_length; i += 1) {
    if (typeof PATS.pos2pat[cogid + "-" + i] != "undefined") {
      table_text += '<td class="cognate" style="backgroundcolor: lightyellow">' +
        PATS.pos2pat[cogid + "-" + i] + "</td>";
    }
    else {
      table_text += '<td style="backgroundcolor: lightgray">0</td>';
    }
  }
  table_text += "</tr>";

  var div = document.createElement("div");
  div.id = "editpattern";
  div.className = "editmode";
  var text = '<div class="edit_links" id="patternlinks">';
  text += "<p>";
  text += '<span class="main_handle pull-left" style="margin-left:-7px;margin-top:2px;" ></span>';
  text += 'Cognate Set »' + node.dataset["cogid"] + '« and ' +
    'Correspondence Pattern »' + node.dataset["patternid"] + "«</p>";
  text += '<p>Mark duplicates by clicking on the language name.</p>';
  text += '<div class="alignments" id="pattern-alignment">';
  text += '<table style="padding: 2px; margin: 2px; border: 2px solid black;">';
  text += table_text;
  text += '</table></div>';
  text += "<br>";
  
  if (CFG._morphology_mode == "full") {
    text += '<input class="btn btn-primary submit"' + 
      ' type="button" onclick="editGroup(event, ' + cogid + ');" ' +
      'value="EDIT" /> ';
  }
  else if (CFG._morphology_mode == "partial") {
     text += '<input class="btn btn-primary submit"' + 
      ' type="button" onclick="PART.editGroup(event, ' + cogid + ');" ' +
      'value="EDIT" /> ';
  }
  text += '<span style="color: crimson">.</span>';
  text += '<input class="btn btn-primary submit"' + 
    ' type="button" onclick="$(\'#editpattern\').remove();basickeydown(event);" ' +
    'value="CLOSE" /></div><br><br> ';
  text += "</div>";
  document.body.appendChild(div);
  div.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editpattern').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  };

  $('#patternlinks').draggable({handle:'.main_handle'}).resizable();

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
    text += '<td>'+plotWord(sound.split('/')[0].replace(' ', ''), 'span', "pointed")+'</td><td style="white-space:nowrap">'+sound.split('/')[1]+' ('+PATS.proto_sounds[sound].length+' × in data)</td>';
    count += 1;
  }
  fakeAlert(text+'</tr></table>');
};

PATS.editPattern = function (event, node) {
  node.onclick = '';
  node.value = node.dataset["patternid"];
  var ipt = document.createElement('input');
  ipt.setAttribute('class', 'cellinput');
  ipt.setAttribute('type', 'text');
  ipt.setAttribute('id', 'modify_pattern_' + node.dataset['cogid'] 
    + '_' + node.dataset['pos']);
  ipt.setAttribute('value', node.dataset['patternid']);
  ipt.setAttribute('data-value', node.dataset['patternid']);
  ipt.setAttribute('onblur', 'PATS.unsubmitPatternEdit(' +
    node.dataset['cogid'] + ',' + node.dataset['pos'] + ',' +
    node.dataset['patternid'] + ',this)');
  ipt.setAttribute(
    'onkeyup', 
    "PATS.submitPatternEdit(event," + 
      node.dataset['cogid'] + "," +
      node.dataset['pos'] + "," + 
      node.dataset['patternid'] + ",this)"
  );
  node.innerHTML = '';
  node.appendChild(ipt);
  ipt.focus();
}

PATS.unsubmitPatternEdit = function(cogid, posidx, patternid, node) {
  var par, row_idx, row;
  par = document.getElementById("PATTERN_" + cogid + "_" + posidx);
  row_idx = parseInt(par.parentNode.id.split("_")[2]);
  row = PATS.matrix[row_idx];
  par.innerHTML = "<span>" + plotWord(row[PATS.length - 1][0][0], "span", "pointed") + 
    ' / <span class="dolgo_ERROR">' + patternid + "</span></span>";
  par.onclick = function(){PATS.editPattern("", par)};
};

PATS.move_up_or_down = function(par, up){
  if (typeof par == "undefined") {
    return;
  }
  if (up == "up") {
    var up1 = -1;
    var up2 = -2;
  }
  else {
    var up1 = 1;
    var up2 = 2;
  }
  try {
    var next_node = par.parentNode.parentNode.rows[par.parentNode.rowIndex + up1].childNodes[2];
    if (typeof next_node != "undefined" && String(next_node.id).indexOf("PATTERN") != -1) {
      PATS.editPattern("click", next_node);
      return;
    }

    var next_2_node = par.parentNode.parentNode.rows[par.parentNode.rowIndex + up2 ].childNodes[2];
    if (typeof next_2_node != "undefined" && String(next_2_node.id).indexOf("PATTERN") != -1) {
      PATS.editPattern("click", next_2_node);
      return;
    }
  }
  catch (error) {
    return;
  }
}

PATS.submitPatternEdit = function(event, cogid, posidx, patternid, node) {
  var par, row, row_idx, i, new_idx, pattern, cell, idx, pos, sound;
  var ptns, ptn, cons;
  var idxs, cols, vals;
  var pw;
  var new_idx = node.value;
  if (event.keyCode == 13 || event.keyCode == 27 || event.keyCode == 38 || event.keyCode == 40) {
    par = document.getElementById("PATTERN_" + cogid + "_" + posidx);
    row_idx = parseInt(par.parentNode.id.split("_")[2]);
    row = PATS.matrix[row_idx];
    new_idx = parseInt(new_idx);
    console.log("pid", patternid, new_idx);
    if (
      (event.keyCode == 13 || event.keyCode == 38 || event.keyCode == 40) 
      && new_idx != patternid) {
      /* if new index can be found in patterns, assign the new pattern to those */
      if (isNaN(new_idx) || new_idx < 1) {
        for (i = 1; i < PATS.matrix.length + 1; i += 1) {
          if (!(i in PATS.patterns) || PATS.patterns[i].length == 0) {
            new_idx = i;
            PATS.patterns[new_idx] = [[cogid, posidx]];
            break;
          }
        }
      }
      [idxs, cols, vals] = [[], [], []];
      for (i = 4; i < row.length - 1; i += 1) {
        cell = row[i];
        if (cell != CFG.missing_marker) {
          [idx, sound] = [cell[0], cell[2]];
          cogidx = (CFG._morphology_mode == "full") 
            ? 0 : WLS[idx][CFG._roots].split(" ").indexOf(String(cogid));
          ptns = WLS[idx][CFG._patterns].split(" + ");
          ptn = ptns[cogidx].split(" ");
          ptn[parseInt(posidx) - 1] = new_idx;
          ptns[cogidx] = ptn.join(" ");
          if (CFG._patterns == -1) {
            fakeAlert("cannot modify patterns with PATTERNS columns missing");
            return;
          }
          WLS[idx][CFG._patterns] = ptns.join(" + ");
          idxs.push(idx);
          cols.push(CFG._patterns);
          vals.push(ptns.join(" + "));
        }
      }
      storeModification(idxs, cols, vals);
      cons = row[PATS.length - 1][0][0];
      par.dataset["patternid"] = new_idx;
      par.onclick = function(){PATS.editPattern("", par)};
      pw = "<span>" + plotWord(cons, "span") + 
        ' / <span class="dolgo_ERROR">' + new_idx +"</span></span>";
      if (event.keyCode == 38) {
        PATS.move_up_or_down(par, "up");
      }
      else if (event.keyCode == 40) {
        PATS.move_up_or_down(par, "down");
      }
      par.innerHTML = pw;
    }
    else if (
      event.keyCode == 27 || ((
        event.keyCode == 13 || event.keyCode == 38 || event.keyCode == 40)
      && new_idx == patternid || event == "click")) {
      par.onclick = function(){PATS.editPattern("", par)};
      pw = "<span>" + plotWord(row[PATS.length - 1][0][0], "span", "pointed") + 
        ' / <span class="dolgo_ERROR">' + patternid + "</span></span>";
      //par.innerHTML = "<span>" + plotWord(row[PATS.length - 1][0][0], "span", "pointed") + 
      //  ' / <span class="dolgo_ERROR">' + patternid + "</span></span>";
      if (event.keyCode == 38) {
        PATS.move_up_or_down(par, "up");
      }
      else if (event.keyCode == 40) {
        PATS.move_up_or_down(par, "down");
      }
      par.innerHTML = pw;
      return;
    }
  }
  return;
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
  menu += '<label class="btn btn-primary mright" style="padding:4px;" title="threshold selection">THR.</label><input id="PATS_threshold" title="select threshold" style="width:60px;padding:4px;" class="btn btn-primary mright" value="'+PATS.threshold+'" type="number" min="2" max="' + WLS.width + '"/>';
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


PATS.lingrex_patterns = function(){
  if (WLS.header[CFG._patterns] == -1) {
    fakeAlert("You must assign the PATTERNS column first.")
    return;
  }
  console.log('lingrex patterns');
  var date = new Date().toString();
  var feedback = document.getElementById("ipatterns_table");
  var cognates = (CFG._morphology_mode == "partial") ? CFG._roots : CFG._cognates;
  var idx;
  var wordlist = "";

  for (idx in WLS) {
    if (!isNaN(idx)) {
      wordlist += idx + "\t" + 
        WLS[idx][CFG._taxa] + "\t" +
        WLS[idx][CFG._concepts] + "\t" +
        WLS[idx][CFG._segments] + "\t" + 
        WLS[idx][cognates] + "\t" +
        WLS[idx][CFG._alignments] + "\n";
    }
  }
  var idxs = [];
  var jdxs = [];
  var vals = [];
  $.ajax({
    async: false,
    type: "POST",
    url: 'patterns.py',
    contentType: 'application/text; charset=utf-8',
    data: {
      "wordlist": wordlist,
      "mode": CFG._morphology_mode,
      "ref": WLS.header[cognates]
    },
    dataType: "text",
    success: function(data) {
      showSpinner(function(){
        var lines = data.split("\n");
        var i, line;
        for (i = 0; i < (lines.length - 1); i += 1) {
          line = lines[i].split("\t");
          WLS[line[0]][CFG._patterns] = line[1];
          idxs.push(line[0]);
          jdxs.push(CFG._patterns);
          vals.push(line[1]);
        }
        storeModification(idxs, jdxs, vals, CFG["async"]);
        feedback.innerHTML = '<table class="data_table2">' +
          "<tr><th>Parameter</th><th>Setting</th></tr>" +
          "<tr><td>Run</td><td>" + date + "</td></tr>" +
          "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
          "<tr><td>Alignment Column</td><td>" + CFG._almcol + "</td></tr>" +
          "<tr><td>Cognate Column</td><td>" + WLS.header[cognates] + "</td></tr>" +
          "<tr><td>Pattern Column</td><td>" + WLS.header[CFG._patterns] + "</td></tr>" + 
          "<tr><td>Algorithm</td><td>CoPaR (LingRex)</td></tr>" +
          "</table>";
      }, 1);
    },
    error: function() {
      fakeAlert("Did not manage to compute alignments.");
    }
  });
  var pats = document.getElementById("patterns");
  if (pats === null || typeof pats == "undefined" || pats.style.display == "none") {
    var eve = {};
      eve.preventDefault = function(){
      return;
    };
    loadAjax(eve, 'sortable', "patterns", "largebox");
  }

  this.render_patterns();
  showWLS(getCurrent());
  CFG._recompute_patterns = false;
};

/* Check patterns for errors and add zero representations for those parts */
PATS.recheck = function(cognates){
  var cnt, idx, i, j, alms, ptns, alm, ptn, full_ptn, pos, new_pattern, new_patterns;
  if (typeof cognates == "undefined") {
    if (CFG._morphology_mode == "partial") {
      cognates = Object.keys(WLS.roots);
    }
    else {
      cognates = Object.keys(WLS.etyma);
    }
  }
  /* assemble by cognate set */
  var values;
  var modified_sequences = [];
  for (cnt = 0; cogid = cognates[cnt]; cnt += 1) {
    values = [];
    if (CFG._morphology_mode == "partial") {
      console.log("patterns", cogid, cognates[cnt], cognates);
      for (i = 0; i < WLS.roots[cogid].length; i += 1) {
        values.push(
          [
            WLS.roots[cogid][i][0],
            WLS.roots[cogid][i][1],
            MORPH.get_morphemes(
              WLS[WLS.roots[cogid][i][0]][CFG._alignments].split(" ")),
            MORPH.get_morphemes(
              WLS[WLS.roots[cogid][i][0]][CFG._patterns].split(" "))
          ]
        );
      }
    }
    else {
      for (i = 0; i < WLS.etyma[cogid].length; i += 1) {
        values.push(
          [
            WLS.etyma[cogid][i],
            0,
            [WLS[WLS.etyma[cogid][i]][CFG._alignments].split(" ")],
            [WLS[WLS.etyma[cogid][i]][CFG._patterns].split(" ")]
          ]
        );
      }
    }
    /* we have assembled all values for one alignment now, 
     * and we must modify them now, the condition is that the number of
     * entries is greater than one, otherwise, we have no cognate SET */
    if (values.length > 1) {
      /* assemble the relevant parts of the alignment, as a rule, we take
       * the entry with the lowest ID as binding here */
      values.sort(function (x, y) {return x[0] - y[0];});
      console.log("values sorted", values);
      for (i = 0; i < values.length; i += 1) {
        alm = ALIGN.alignable_parts(values[i][2][values[i][1]]);
        ptn = values[i][3][values[i][1]];
        full_ptn = values[i][3];
        pos = values[i][1];
        if (typeof ptn != "undefined" && !isNaN(ptn[0])){
          break
        }
      }
      if (typeof ptn == "undefined") {
        new_ptn = Array.from("0".repeat(alm.length));
      }
      else {
        new_ptn = [];
        for (i = 0; i < alm.length; i += 1) {
          if (typeof ptn[i] == "undefined") {
            new_ptn.push("0");
          }
          else if (isNaN(ptn[i]) || isNaN(parseInt(ptn[i]))) {
            new_ptn.push("0");
          }
          else {
            new_ptn.push(ptn[i]);
          }
        }
      }
      for (i = 0; i < values.length; i += 1) {
        new_patterns = [];
        for (j = 0; j < values[i][2].length; j += 1) {
          ptn = values[i][3][j];
          if (j != values[i][1]) {
            if (typeof ptn == "undefined") {
              new_patterns.push(Array.from("0".repeat(values[i][2][j].length)).join(" "));
            }
            else {
              new_patterns.push(ptn.join(" "));
            }
          }
          else {
            new_patterns.push(new_ptn.join(" "));
          }
        }
        new_patterns = new_patterns.join(" + ");
        if (WLS[values[i][0]][CFG._patterns] != new_patterns) {
          modified_sequences.push([
            WLS[values[i][0]][CFG._patterns], new_patterns
          ]);
          
          WLS[values[i][0]][CFG._patterns] = new_patterns;
          storeModification(
            values[i][0],
            WLS.header[CFG._patterns],
            new_patterns);
        }
      }
    }
  }
  return modified_sequences;
};


PATS.compute_patterns = function() {
  if (WLS.header[CFG._patterns] == -1) {
    fakeAlert("You must assign the PATTERNS column first.")
    return;
  }
  this.get_patterns();
  var idxs = [];
  var jdxs = [];
  var vals = [];
  var idx;
  for (idx in WLS) {
    if (!isNaN(idx)) {
      idxs.push(idx);
      jdxs.push(CFG._patterns);
      vals.push(WLS[idx][CFG._patterns]);
    }
  }
  var date = new Date().toString();
  var feedback = document.getElementById("ipatterns_table");
  var mode = (CFG.morphology_mode == "partial") ? CFG.root_formatter : CFG.formatter;
  
  showSpinner(
    function(){
      storeModification(idxs, jdxs, vals, CFG["async"]);
      feedback.innerHTML = '<table class="data_table2">' +
        "<tr><th>Parameter</th><th>Setting</th></tr>" +
        "<tr><td>Run</td><td>" + date + "</td></tr>" +
        "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
        "<tr><td>Alignment Column</td><td>" + CFG._almcol + "</td></tr>" +
        "<tr><td>Cognate Column</td><td>" + mode + "</td></tr>" +
        "<tr><td>Pattern Column</td><td>" + CFG.pattern_formatter + "</td></tr>" +
        "<tr><td>Algorithm</td><td>SortCluster (EDICTOR)</td</tr>" + 
        "</table>";
    },
    1
  );

  /* check if patterns is loaded */
  var pats = document.getElementById("patterns");
  if (pats === null || typeof pats == "undefined" || pats.style.display == "none") {
    var eve = {};
      eve.preventDefault = function(){
      return;
    };
    loadAjax(eve, 'sortable', "patterns", "largebox");
  }
  this.render_patterns();
  showWLS(getCurrent());
  CFG._recompute_patterns = false;
};

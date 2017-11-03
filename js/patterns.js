/* Pattern parser for edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-10-24 17:46
 * modified : 2017-10-26 16:36
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
  for (var i=0; i<x.length; i++) {
    if (x[i] != y[i] && x[i] != UTIL.settings.missing_marker && y[i] != UTIL.settings.missing_marker && x[i][0] != '!' && y[i][0] != '!') {
      return false;
    }
    else if (x[i] != UTIL.settings.missing_marker && y[i] != UTIL.settings.missing_marker && x[i][0] != '!' && y[i][0] != '!' && x[i] != CFG.gap_marker && y[i] != CFG.gap_marker){
      compatible += 1;
    }
  }
  if (compatible == 0) {
    return false;
  }
  return true;
};

/* consensus string for a given pattern */
/* XXX ameliorate XXX */
PATS.consensus = function(x) {
  var visited = [];
  var uniques = [];
  var freqs = [];
  for (var i=0; i<x.length; i++) {
    if (x[i] == UTIL.settings.missing_marker || x[i][0] == '!'){}
    else if (LIST.has(visited, x[i])) {}
    else {
      uniques.push(x[i]);
    }
  }
  var best_count = 0;
  var best_char = '';
  for (var i=0; i<uniques.length; i++) {
    var count = LIST.count(x, uniques[i]);
    if (count > best_count) {
      best_count = count;
      best_char = uniques[i];
    }
  }
  return best_char;
};

PATS.get_patterns = function(lengths){
  PATS.matrix = [];
  if (typeof lengths == 'undefined'){
    lengths = 3;
  }
  if (CFG._morphology_mode == 'partial'){
    var roots = WLS.roots;
    function get_wls(idx){return roots[idx].map(function (x){return x[0];})}
    function get_idx(lst, idx){return lst[idx][0]}
    function get_alm(etym){return MORPH.get_morphemes(WLS[etym[0]][CFG._alignments].split(' '))[etym[1]];}
  }
  else {
    var roots = WLS.etyma;
    function get_wls(idx){return roots[idx]}
    function get_idx(lst, idx){return lst[idx]}
    function get_alm(etym){return WLS[etym][CFG._alignments].split(' ');}
  }
  /* make proto first of the selected doculects */
  if (CFG.proto != -1 && LIST.has(CFG._selected_doculects, CFG.proto)) {
    PATS.selected_doculects = [CFG.proto];
    for (var i=0; i<CFG._selected_doculects.length; i++) {
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
  for (var etymon in roots) {
    if (roots[etymon].length >= lengths) {
      /* determine the taxa first */
      var etyma = [];
      for (var i=0; i < roots[etymon].length; i++) {
	var taxon = WLS[get_wls(etymon)[i]][CFG._tidx];
        if (PATS.selected_doculects.indexOf(taxon) != -1) {
          etyma.push(roots[etymon][i]);
        }	  
      }
      if (etyma.length > 1) {
        /* determine size of alignment */
        //var idx = etyma[0];
	var idx = get_idx(etyma, 0);
        var taxon = WLS[idx][CFG._tidx];
        var alm = get_alm(etyma[0]);
        var concept = WLS[idx][CFG._cidx];
        var tidx = PATS.selected_doculects.indexOf(taxon)+4;
        var rows = [];
        for (var i=0; i<alm.length; i++) {
          rows.push(Array.from('Ø'.repeat(PATS.length-1)))
          rows[i][0] = etymon;
          rows[i][1] = i+1;
          rows[i][3] = [concept];
          rows[i][tidx] = [idx, i, alm[i]];
        }
        for (var i=1; i<etyma.length; i++) {
	  var idx = get_idx(etyma, i);
          var taxon = WLS[idx][CFG._tidx];
          var tokens = get_alm(etyma[i]); 
          var concept = WLS[idx][CFG._cidx];
          var tidx = PATS.selected_doculects.indexOf(taxon)+4;
          for (var j=0; j<alm.length; j++) {
	    var segment = tokens[j];
	    if (typeof segment == 'undefined') {
	      segment = '?';
	    }
            rows[j][tidx] = [idx, j, segment, etymon];
            if (rows[j][3].indexOf(concept) == -1) {
              rows[j][3].push(concept);
            }
          }
        }
        for (var i=0; i<rows.length; i++) {
          rows[i].push(rows[i].slice(4,rows[i].length).map(function(x){
            if (x.length == 1) {return x}
            return x[2]}));
          PATS.matrix.push(rows[i]);
        }
      }
    }
  }
  /* first sort for the greedy algo */
  PATS.matrix.sort(function (x, y){
    var pA = x.slice(4, x.length).map(function(z){if (z.length == 1){return z} return z[2]});
    var pB = y.slice(4, y.length).map(function(z){if (z.length == 1){return z} return z[2]});
    if (pA[0] == '!') {
      pA = UTIL.settings.missing_marker;
    }
    if (pB[0] == '!') {
      pB = UTIL.settings.missing_marker;
    }
    var pAl = LIST.count(pA, UTIL.settings.missing_marker);
    var pBl = LIST.count(pB, UTIL.settings.missing_marker);
    var cpt = PATS.compatible(pA, pB);
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
    var consA = x[PATS.length-1][0].join(',');
    var consB = y[PATS.length-1][0].join(',');
    if (consA == consB) {
      return 0;
    }
    return consA.localeCompare(consB);
  });
  /* re-compute and resort consensus to refine search, compute proto-sounds
   * (sounds occuring in fhe first language in the sample for filtering */
  PATS.find_consensus();
  PATS.assign_patterns();
  PATS.matrix.sort(function (x, y){ if (x[PATS.matrix[0].length-1][1] > y[PATS.matrix[0].length-1][1]){return -1} else if (x[PATS.matrix[0].length-1][1] < y[PATS.matrix[0].length-1][1]) {return 1} return 0});
  PATS.proto_sounds = {};
  for (var i=0; i<PATS.matrix.length; i++) {
    if (PATS.matrix[i][4].length == 4) {
      var token = PATS.matrix[i][4][2]+' / '+PATS.matrix[i][1];
      if (token in PATS.proto_sounds) {
	      PATS.proto_sounds[token].push(i);
      }
      else {
	      PATS.proto_sounds[token] = [i];
      }
    }
  }
};

PATS.assign_patterns = function(){
  var pdict = {};
  for (var i=0; i<PATS.matrix.length; i++) {
    var row = PATS.matrix[i];
    var consensus = row[PATS.length-1][0];
    var consensus_char = PATS.consensus(consensus);
    consensus = consensus.join(' ');
    if (consensus in pdict) {
      var pattern = pdict[consensus]+'/'+consensus_char;
      PATS.patterns[pattern].push([row[0], row[1]]);
    }
    else {
      var next_idx = 1;
      if (consensus_char in pdict) {
        var next_idx = pdict[consensus_char];
        pdict[consensus_char] += 1;
      }
      else {
        pdict[consensus_char] = next_idx + 1;
      }
      var pattern = next_idx+'/'+consensus_char;
      pdict[consensus] = next_idx;
      PATS.patterns[pattern] = [[row[0], row[1]]];
    }
    PATS.matrix[i][2] = [pattern, row[0], row[1]];
  }
};

/* XXX make function better, not very good iplementation */
PATS.pattern_consensus = function(patterns) {
  var out = [];
  for (var i=0; i<patterns[0].length; i++) {
    var col = [];
    for (var j=0; j<patterns.length; j++) {
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
  if (matches.length == 1) {
    return 0;
  }
  var scores = CFG._selected_doculects.map(function(x){return 0});
  for (var i=0; i<matches.length; i++) {
    var pattern = PATS.matrix[matches[i]].slice(4, PATS.length-1).map(function (x){if (x.length==1){return x} return x[2]});
    for (var j=0; j<pattern.length; j++) {
      if (pattern[j] != UTIL.settings.missing_marker && pattern[j][0] != '!') {
        scores[j] += 1;
      }
    }
  }
  return LIST.sum(scores) / scores.length;
  
};

/* function calculates greedy clusters of compatible sets of nodes */
PATS.find_consensus = function(){
  var previous = PATS.matrix[0].slice(4, PATS.length-1).map(function(x){if (x.length == 1){return x} return x[2]});
  var matches = [];
  for (var i=0, row; row=PATS.matrix[i]; i++) {
    var next = PATS.matrix[i].slice(4, PATS.length-1).map(function(x){if (x.length == 1){return x} return x[2]});
    if (PATS.compatible(previous, next)) {
      matches.push(i);
      previous = PATS.pattern_consensus([previous, next]);
    }
    else {
      var patsum = PATS.score_patterns(matches);
      for (var j=0; j<matches.length; j++) {
      	PATS.matrix[matches[j]][PATS.length-1] = [previous, patsum, matches.length];
      }
      previous = next;
      matches = [i];
    }
  }
  var patsum = PATS.score_patterns(matches);
  for (var i=0; i<matches.length; i++) {
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
  var threshold = document.getElementById('PATS_threshold');
  if (threshold == null) {}
  else {
    PATS.threshold = threshold.value;
  }

  /* get settings depending on morphology mode */
  if (CFG._morphology_mode == 'partial') {
    var egroup = 'PART.editGroup(event, ';
  }
  else {
    var egroup = 'editGroup(event, ';
  }

  PATS.get_patterns(PATS.threshold);
  PATS.length = PATS.matrix[0].length;
  var _columns = function(cell, idx, head) {
    if (cell[0] == UTIL.settings.missing_marker){
    return '<td id="PATS_'+head+'_'+idx+'" title="missing data' + 
      '" style="background-color:lightgray;text-align:center;padding:0px;margin:0px;">Ø</td>';
    }
    return '<td class="pointed" data-toggle="1" data-idx="'+cell[0]+'" data-cogid="'+cell[3]+'" data-pos="'+cell[1]+'" data-segment="'+cell[2]+'" id="PATS_'+head+'_'+idx+'" title="click to show segments" onclick="PATS.show_words(this);" ' +
      '>'+plotWord(cell[2])+'</td>';
  };
  var columns = [function(cell, idx, head){
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
  for (var i=0; i<PATS.selected_doculects.length; i++) {
    columns.push(_columns);
  }
  columns.push(function(cell, idx, head){
    return '<td>'+Number(cell[1]).toFixed(2) + ' / ' + cell[2] +'</td>';
  });

  
  PATS.header = ['COGNATES', 'INDEX', 'PATTERN', 'CONCEPTS']
  for (var i=0,doculect; doculect=PATS.selected_doculects[i]; i++) {
    PATS.header.push(doculect.slice(0,3));
  }
  PATS.header.push('SIZE');
  var titles = ['cognate sets', 'pattern position', 'pattern number', 'concepts'].concat(PATS.selected_doculects);
  titles.push('pattern sizes');
  PATS.DTAB = getDTAB('PATS', PATS.header, PATS.matrix, columns, titles, PATS.preview);
  
  /* filter patterns */
  if (typeof PATS.selected != 'undefined' && PATS.selected.length > 0) {
    var idxs = [];
    for (var i=0; i<PATS.matrix.length; i++) {
      var row = PATS.matrix[i];
      var sound = row[PATS.matrix[0].length-1][0][0]+ ' / ' +row[1];
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
  if (CFG._alignments == -1) {
    fakeAlert('Your data does not contain alignments.');
    return;
  }
  if (typeof elm != 'undefined') {
    elm.display = 'none';
  }
  PATS.current = 0;
  var dtab = PATS.render_matrix();
  var menu = '<button onclick="PATS.select_proto();" class="btn btn-primary mright" title="filter by proto-language">FILTER</button>';
  menu +=  '<select id="pats_select_cognates" multiple="multiple" class="multiselect" title="Select patterns">';
  for (var sound in PATS.proto_sounds) {
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
    disableIfEmtpy: true,
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

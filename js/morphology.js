/* Morphology Module of the Edictor offers ways to handle morphology. The current version only
 * handles compound morphology in SEA languages.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * modified : 2021-03-05 15:01
 * modified : 2016-03-19 08:27
 *
 */

var MORPH = {};
MORPH.morphemes = {};


MORPH.toggle = function(event, elm){
  event.preventDefault();
  var par = elm.parentNode.dataset.value.split(/\s+/);
  var tidx = par.indexOf(elm.innerHTML);
  if (tidx == -1) {
    tidx = par.indexOf('_'+elm.innerHTML);
  }
  if (par[tidx][0] == '_'){
    par[tidx] = par[tidx].slice(1, par[tidx].length);
    elm.className = 'morpheme pointed';
  }
  else {
    par[tidx] = '_'+par[tidx];
    elm.className = 'morpheme-small pointed';
  }
  var idx = elm.parentNode.parentNode.id.split('_')[1];
  WLS[idx][CFG._morphemes] = par.join(' ');
  elm.parentNode.dataset.value = par.join(' ');
  storeModification(parseInt(idx), CFG._morphemes, par.join(' '));
};

/* function to split a word into morphemes */
MORPH.get_morphemes = function(word, return_morpheme_marks) {
  var out = [[]];
  var mm = [];
  var split = false;
  for (var i=0,segment; segment=word[i]; i++) {
    /* correct for badly encoded items */
    var addon = '';
    if (segment[0] == '!' && segment.length > 1) {addon='!'; segment=segment.slice(1, segment.length);}
    else if (segment[0] == '?' && segment.length > 1) {addon='?'; segment=segment.slice(1, segment.length);}
    if (split && CFG['morpheme_marks'].indexOf(segment) == -1 && (
      segment != CFG['gap_marker'] || split === 2)) {
      out.push([]);
      split = false;
    }
    
    if (CFG['split_on_tones'] != 'false' && CFG['tone_marks'].indexOf(segment[0]) != -1) {
      split = true;
      out[out.length-1].push(addon+segment);
    }
    else if (CFG['morpheme_marks'].indexOf(segment) != -1) {
      split = 2;
      mm.push(segment);
    }
    else {
      out[out.length-1].push(addon+segment);
    }
  }
  if (typeof return_morpheme_marks == 'undefined' || !return_morpheme_marks) {
    return out;
  }
  return [out, mm];
};

/* function returns all morphemes from indices, words and concepts */
MORPH.get_all_morphemes = function (indices, words, concepts) {
  var i, idx, word, concept, elms, elm;
  var M = {}; 
  for (i=0, idx, word, concept; idx=indices[i], word=words[i], concept=concepts[i]; i++) {
    elms = MORPH.get_morphemes(word);
    for (var j=0; j < elms.length; j++) {
      elm = elms[j].join(' ');
      if (elm in M) {
	      M[elm].push([idx, j, concept]);
      }
      else {
	      M[elm] = [[idx, j, concept]];
      }
    }
  }
  return M;
};

/* function searches user-submitted morphemes (annotated) and returns them as a touple of 
 * morpheme and the user-defined tag */
MORPH.get_user_morphemes = function (indices, words, concepts) {
  var M = {};
  if (CFG['_morphemes'] == -1) {
    fakeAlert('No regular user-annotated morphemes could be identified. Switching to automatically detected morphemes.');
    return MORPH.get_all_morphemes(indices, words, concepts);
  }
  var count = 1;
  for (var i=0,idx, word, concept; idx=indices[i], word=words[i], concept=concepts[i]; i++) {
    var elms = MORPH.get_morphemes(word);
    var ulms = WLS[idx][CFG['_morphemes']].split(/\s+/);
    for (var j=0; j < elms.length; j++) {
      var ulm = ulms[j];
      if (typeof ulm != 'undefined' && ulm && ulm[0] != '?') {
        if (ulm in M) {
          M[ulm].push([idx, j, concept]);
        }
        else {M[ulm] = [[idx, j, concept]];}
      }
      /* add identifier of word in case of errors or question marks */
      else {
	M[idx+'.'+j] = [[idx, j, concept]];
      }
    }
  }
  return M;
}

/* return morpheme graph in sigma.js format of nodes and edges*/
MORPH.get_morpheme_graph = function(indices, words, concepts, full) {
  full = (typeof full == 'undefined') ? false : true;
  var M = (typeof CFG['_morphology_style'] == 'undefined' || CFG['_morphology_style'] == 'auto') 
    ? MORPH.get_all_morphemes(indices, words, concepts)
    : MORPH.get_user_morphemes(indices, words, concepts)
    ;
  var G = { "nodes" : [], "edges" : [] };
  var idx = 1;
  var visited = [];
  for (m in M) {
    if (M[m].length > 1 || full) {
      var x = UTIL.randint(0,50);
      var y = UTIL.randint(0,50);
      G.nodes.push({
        id : 'n-'+idx,
        label : m.replace(/\s/g,''),
        x : x,
        y : y,
        size : M[m].length,
        color : '#dc143c'
      });
      for (var i=0; i<M[m].length; i++) {
        if (visited.indexOf('m-'+M[m][i][0]) == -1) { 
          G.nodes.push({
        	  id : 'm-'+M[m][i][0],
        	  label : words[indices.indexOf(M[m][i][0])].join('') + ' «'+M[m][i][2]+'»',
        	  x : x,
        	  y : y,
        	  size : 2,
        	  color : '#2D6CA2'
        	});
          visited.push('m-'+M[m][i][0]);
        }
	if (visited.indexOf('e-'+idx+'-'+M[m][i][0]) == -1) {
	  G.edges.push({
	    id : 'e-'+idx+'-'+M[m][i][0],
	    source : 'n-'+idx,
	    target : 'm-'+M[m][i][0],
	    color : (m == words[indices.indexOf(M[m][i][0])].join(' ')) ? '#a1b2c3' : '#000'
	  });
	  visited.push('e-'+idx+'-'+M[m][i][0]);
	}
      }
      idx += 1
    }
  }
  G['morphemes'] = idx - 1;
  G['words'] = visited.length;
  return G;
};

/* function retrieves all colexifications in the data */
MORPH.get_colexifications = function(indices, words, concepts) {
  var C = {};
  for (var i=0,idx, word, concept; idx=indices[i], word=words[i], concept=concepts[i]; i++) {
    var _word = typeof word == 'string' ? word : word.join(' ') ;
    if (_word in C) {
      C[_word].push([idx, concept]);
    }
    else {
      C[_word] = [[idx, concept]];
    }
  }
  return C;
};

MORPH.showGraph = function(graph, fullgraph, doculect, word, concept) {
  var url = (fullgraph) ? 'plugouts/sigma_big.html?'+graph : 'plugouts/springy_small.html?'+graph;
  var nid = document.createElement('div');
  nid.style.display = '';
  nid.className = 'editmode';

  var wftext = (!fullgraph) 
    ? 'Word family graph for '+doculect + ' '+plotWord(word, 'span', 'noresidue')+' «'+concept+'»:' 
    : 'Word family graph for '+doculect+' ('+word +'morphemes occur in '+concept+' words):';

  var text = '<div class="iframe-message" style="width:600px" id="wfgraph">' + 
    '<p style="color:white;font-weight:bold;">' +
    '<span class="main_handle pull-left" style="margin-left:0px;margin-top:2px;" ></span>' +
    wftext + 
    '</p>' +
    '<iframe id="iframe-graph" onload=UTIL.resizeframe(this);" src="'+url+'" style="width:90%;height:80%;min-height:400px;max-height:600px;border:2px solid #2D6CA2;"></iframe><br><div class="btn btn-primary okbutton" onclick="' + 
    "$('#editmode').remove(); document.onkeydown = function(event){basickeydown(event)};" +
    '")> OK </div></div>';
  nid.id = 'editmode';
  document.body.appendChild(nid);
  nid.innerHTML = text;
  $('#wfgraph').draggable({handle:'.main_handle'}).resizable();
}

MORPH.editMorphemeEntry = function(what, idx) {
  value = WLS[idx][CFG['_'+what]];
  entry = document.getElementById(what+'-'+idx);
  jdx = CFG['_'+what];
  entry.onclick = '';
  var ipt = document.createElement('input');
  ipt.setAttribute('class', 'cellinput');
  ipt.setAttribute('type', 'text');
  ipt.setAttribute('data-value', value);
  ipt.setAttribute('onblur', 'MORPH.unmodifyMorphemeEntry(\'' + what + '\','+idx+')');
  ipt.setAttribute('onkeyup', 'MORPH.modifyMorphemeEntry(event,'+ idx +',\''+what+'\',this.value)');
  ipt.size = value.length + 5;
  ipt.value = value;
  entry.innerHTML = '';
  entry.appendChild(ipt);
  ipt.focus();
};

MORPH.unmodifyMorphemeEntry = function(what, idx) {
  /* get the original values, as they are in the wordlist */
  var _segments = MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(/\s+/));
  var _morphemes =  WLS[idx][CFG['_morphemes']].split(/\s+/);
  
  var out = [];
  /* iterate over both, preference on segments, and assign values */
  for (var i=0; i<_segments.length; i++) {
    if (what == 'segments') {
      var segment = '<span style="display:table-cell">' +
	plotWord(_segments[i].join(' '), 'span') +
	'</span>';
      out.push(segment);
    }
    else if (what == 'morphemes') {
      var morpheme = (typeof _morphemes[i] != 'undefined' &&_morphemes[i] && _morphemes[i][0] != '?')
	      ? '<span class="morpheme">'+_morphemes[i]+'</span>'
	      : '<span class="morpheme-error">?</span>'
	    ;
      out.push(morpheme);
    }
  }
  out = out.join('<span class="small" style="display:table-cell">+</span>');
  var entry = document.getElementById(what+'-'+idx);
  entry.innerHTML = out;
  entry.onclick = function() {
    MORPH.editMorphemeEntry(what, idx);
  }
};

MORPH.modifyMorphemeEntry = function(event, idx, what, value) {
  
  CFG['entry_is_currently_modifying'] = true;
  var ovalue = (what == 'morphemes') ? WLS[idx][CFG['_morphemes']] : WLS[idx][CFG['_segments']];

  /* unmodify on escape */
  if (event.keyCode == 27) {
    CFG['entry_is_currently_modifying'] = false;
    MORPH.unmodifyMorphemeEntry(what, idx);
    return;
  }
  /* modify on enter */
  else if (event.keyCode != 13 && event != 'click' && [37, 38, 39, 40].indexOf(event.keyCode) == -1)  {
    CFG['entry_is_currently_modifying'] = false; 
    return;
  }
  else if (ovalue == value) {
    
    if (event.keyCode == 40) {
      var new_index = MORPH.indices[(MORPH.indices.indexOf(idx)+1)];
      MORPH.editMorphemeEntry(what, new_index);
      MORPH.unmodifyMorphemeEntry(what, idx);
      return;
    }
    if (event.keyCode == 38) {
      var new_index = MORPH.indices[(MORPH.indices.indexOf(idx)-1)];
      MORPH.editMorphemeEntry(what, new_index);
      MORPH.unmodifyMorphemeEntry(what, idx);
      return;
    }
    if (event.keyCode == 37 && event.ctrlKey) {
      MORPH.editMorphemeEntry('segments', idx);
      MORPH.unmodifyMorphemeEntry(what, idx);
      return;
    }
    if (event.keyCode == 39 && event.ctrlKey) {
      MORPH.editMorphemeEntry('morphemes', idx);
      MORPH.unmodifyMorphemeEntry(what, idx);
      return;
    }
  
    return;
  }
  
  /* get the original values, as they are in the wordlist */
  var _segments = (what != 'segments') 
    ? MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(/\s+/))
    : MORPH.get_morphemes(value.split(/\s+/))
    ;
  var _morphemes = (what != 'morphemes')
    ? WLS[idx][CFG['_morphemes']].split(/\s+/)
    : value.split(/\s+/)
    ;
  
  var outA = [];
  var outB = [];
  for (var i=0; i<_segments.length; i++) {
    outA.push(_segments[i].join(' '));
    outB.push(
	(typeof _morphemes[i] != 'undefined' && _morphemes[i] && _morphemes[i][0] != '?') 
	  ? _morphemes[i] 
	  : '?'
	);
  }
  var segments = (what != 'segments') ? WLS[idx][CFG['_segments']] : value;
  var morphemes = outB.join(' ');
  WLS[idx][CFG['_segments']] = segments;
  WLS[idx][CFG['_morphemes']] = morphemes;
  
  storeModification(idx, CFG['_'+what], value);

  if (event.keyCode == 40) {
    var new_index = MORPH.indices[(MORPH.indices.indexOf(idx)+1)];
    MORPH.editMorphemeEntry(what, new_index);
  }
  if (event.keyCode == 38) {
    var new_index = MORPH.indices[(MORPH.indices.indexOf(idx)-1)];
    MORPH.editMorphemeEntry(what, new_index);
  }
  if (event.keyCode == 37 && event.ctrlKey) {
    MORPH.editMorphemeEntry('segments', idx);
  }
  if (event.keyCode == 39 && event.ctrlKey) {
    MORPH.editMorphemeEntry('morphemes', idx);
  }
  MORPH.unmodifyMorphemeEntry(what, idx); 

  return;
};


/* display morphology */
function showMorphology(event, doculect, filter, sort, direction) {
  if (event) { if (event.keyCode != 13) { return; } }
  
  /* determine morphology mode */
  var mode = (typeof CFG['_morphology_mode'] == 'undefined') 
    ? 'partial' 
    : CFG['_morphology_mode'];
  var style = (typeof CFG['_morphology_style'] == 'undefined')
    ? 'auto'
    : CFG['_morphology_style'];
  var view = (typeof CFG['_morphology_view'] == 'undefined')
    ? 'inspect'
    : CFG['_morphology_view'];

  /* check for existing morphemes in the data */
  if (CFG['_morphemes'] == -1 && (view=='edit' || style=='user')) {
    fakeAlert('For manual option in ANALYSIS and edit option in VIEW, you need to supply annotated morpheme data. Switching to automatic analyses instead.');
    CFG['_morphology_style'] = 'auto';
    CFG['_morphology_view'] = 'inspect';
    
    document.getElementById('morphology_style_user').checked = false;
    document.getElementById('morphology_style_auto').checked = true;
    document.getElementById('morphology_view_edit').checked = false;
    document.getElementById('morphology_view_inspect').checked = true;
    return;
  }

  /* get current height of the window in order to determine maximal height of
   * the div */
  var heightA = document.getElementById('filedisplay').offsetHeight - 100;
  var heightB = window.innerHeight - 350;
  var cheight = (heightB-heightA > 300) ? heightB : heightA;

  document.getElementById('morphology_table').style.maxHeight =  cheight +'px';  
  var hid = document.getElementById('morphology_help');
  hid.innerHTML = '';
  hid.style.display = 'none';
  
  filter = (typeof filter == 'undefined') ? document.getElementById('morphology_filter').value : filter;
  if (typeof sort == 'undefined') {
    sort = (typeof CFG['_morphology_sort'] == 'undefined') 
      ? 'numeric' 
      : CFG['_morphology_sort'];
  }
  if (typeof direction == 'undefined') {
    direction = (typeof CFG['_morphology_direction'] == 'undefined')
      ? 1
      : CFG['_morphology_direction'];
  }
  if (CFG['_morphology_sort'] != sort) {
    direction = 1;
  }
  CFG['_morphology_directon'] = direction;
  CFG['_morphology_sort'] = sort;
  
  /* prepare the three arrays */
  var indices = WLS.taxa[doculect];
  if (sort == 'alphabetic') {
    var sorter = (direction == 1) 
      ? function (x, y) {return WLS[x][CFG._cidx].charCodeAt(0) - WLS[y][CFG._cidx].charCodeAt(0);}
      : function (y, x) {return WLS[x][CFG._cidx].charCodeAt(0) - WLS[y][CFG._cidx].charCodeAt(0);}
      ;
  }
  else if (sort == 'phonemes') {
    var sorter = (direction == 1) 
      ? function (x, y) { var a = getSoundClass(WLS[x][CFG['_segments']][0]).charCodeAt(0); var b = getSoundClass(WLS[y][CFG['_segments']][0]).charCodeAt(0); return a - b; }
      : function (y, x) { var a = getSoundClass(WLS[x][CFG['_segments']][0]).charCodeAt(0); var b = getSoundClass(WLS[y][CFG['_segments']][0]).charCodeAt(0); return a - b; }
      ;
  }
  else { 
    var sorter = (direction == 1) 
      ? function (x, y) {return x - y;}
      : function (y, x) {return x - y;}
      ;
  }
  indices.sort(sorter);

  var words = indices.map(function (x) {return WLS[x][CFG['_segments']].split(' ');});
  var concepts = indices.map(function (x) {return WLS[x][CFG._cidx];});

  switch (mode+'.'+style+'.'+view) {
    case 'full.auto.inspect' : 
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      var colexifications = MORPH.get_colexifications(indices, words, concepts);
      break;
    case 'full.auto.edit' :
      var morphemes = MORPH.get_user_morphemes(indices, words, concepts);
      var colexifications = MORPH.get_colexifications(indices, words, concepts);
      break;
    case 'full.user.inspect' :
      fakeAlert('Not implemented yet, switching ANALYSIS from "manual" to "automatic".');
      document.getElementById('morphology_style_user').checked = false;
      document.getElementById('morphology_style_auto').checked = true;
      style = 'auto';
      CFG['_morphology_style'] = 'auto';
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      var colexifications = MORPH.get_colexifications(indices, words, concepts);
      break;
    case 'full.user.edit' :
      fakeAlert('Not implemented yet, switching ANALYSIS from "manual" to "automatic".');
      document.getElementById('morphology_style_user').checked = false;
      document.getElementById('morphology_style_auto').checked = true;
      style = 'auto';
      CFG['_morphology_style'] = 'auto';
      var morphemes = MORPH.get_user_morphemes(indices, words, concepts);
      var colexifications = MORPH.get_colexifications(indices, words, concepts);
      break;
    case 'partial.auto.inspect' :
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      break;
    case 'partial.auto.edit' :
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      break;
    case 'partial.user.inspect' :
      var morphemes = MORPH.get_user_morphemes(indices, words, concepts);
      break;
    case 'partial.user.edit' :
      var morphemes = MORPH.get_user_morphemes(indices, words, concepts);
      break;
  }

  var id_sort = (CFG['_morphology_sort'] == 'numeric' && direction != 1) 
    ? 'style="background-color:crimson;" '
    : '';
  var concept_sort = (CFG['_morphology_sort'] == 'alphabetic') 
    ? 'style="background-color:crimson;" '
    : '';
  var morpheme_sort = (CFG['_morphology_sort'] == 'phonemes')
    ? 'style="background-color:crimson;" '
    : '';
  var th_edit = (view == 'edit') ? '<th class="titled">'+WLS.header[CFG['_morphemes']]+'</th>' : '';
  var th_graph = '<th class="titled">GRAPH</th>';
  
  /* write the header of the table */
  var text = '<table class="data_table2" style="padding-right:25px;"><thead>' +
    '<tr>' +
    '<th class="titled" title="double click to sort" '+ id_sort +
    'ondblclick="CFG[\'_morphology_direction\']='+(-1*direction)+';showMorphology(false,\''+doculect+'\',\'\',\'numeric\')">ID</th>' +
    '<th class="titled" '+concept_sort+'title="double click ot sort" ondblclick="CFG[\'_morphology_direction\']='+(-1*direction)+';showMorphology(false,\''+doculect+'\', \'\', \'alphabetic\')">'+WLS.header[CFG['_concepts']]+'</th>' +
    '<th class="titled" '+morpheme_sort+'title="click on segment to filter, double click to sort" ondblclick="CFG[\'_morphology_direction\']='+(-1*direction)+';showMorphology(false,\''+doculect+'\',\'\',\'phonemes\')">'+WLS.header[CFG['_segments']]+'</th>' +
    th_edit + 
    '<th class="titled">COLEXIFICATIONS</th>' + 
    th_graph + 
    '</tr></thead>'
    ;
  text += '<tbody>';
  /* iterate over data */
  for (var i=0, widx, word, concept; widx=indices[i], word=words[i], concept=concepts[i]; i++) {
    
    var these_morphemes = (style == 'auto') 
      ? MORPH.get_morphemes(word).map(function(x) {return x.join(' ')})
      : WLS[widx][CFG['_morphemes']].split(/\s+/);
    if (style == 'user') {
      var original_morphemes = MORPH.get_morphemes(word).map(function(x) {return x.join(' ')});
      for (var j=0,morpheme; morpheme=original_morphemes[j]; j++) {
        if (typeof these_morphemes[j] == 'undefined' || these_morphemes[j][0] == '?' || !these_morphemes[j]) {
          these_morphemes[j] = widx+'.'+j;
        } 
      }
      if (these_morphemes.length > original_morphemes.length) {
	these_morphemes = these_morphemes.slice(0,original_morphemes.length);
      }
    }
    var col_filter = [];
    var pcol_filter = [];
    var local_indices = [];
    var local_words = [];
    var local_concepts = [];
    if (!filter || these_morphemes.indexOf(filter) != -1) {
      /* the various text added to major text in table */
      var morpheme_data = []; // morphemes with click and filter
      var user_morphemes = [];
      var pcol_data = []; // partial colexifications
      var col_data = []; // full colexifications
      var p = []; // partial colexification
      for (var j=0; morpheme=these_morphemes[j]; j++) {
	_morph = (style=='auto') ? morpheme : original_morphemes[j];
        var these_concepts = [];
	if (view == 'inspect') {
	  if (style == 'auto'){
	    morpheme_data.push('<span style="display:table-cell;" title="click to filter" onclick="showMorphology(false,\''+doculect+'\',\''+morpheme+'\');">' + 
	      plotWord(_morph, 'span', 'pointed')+'</span>');
	  }
	  else if (style == 'user'){
	    
	    if (morpheme == widx + '.' + j) {
	      morpheme_data.push('<span style="display:table-cell;">' + 
	  	plotWord(_morph, 'span')+'<sub class="morpheme-error small">?</sub></span>')
	    }
	    else {
	      morpheme_data.push('<span style="display:table-cell;" title="click to filter"' +
	  	'onclick="showMorphology(false,\''+doculect+'\',\''+morpheme+'\');">' + 
	  	plotWord(_morph, 'span', 'pointed') +
	  	'<sub class="morpheme small">'+morpheme+'</sub>'+'</span>');
	    }
	  }
	}
	else if (view == 'edit') {
	  if (style == 'user') {
	    var sstring, mstring;
	    sstring = '<span style="display:table-cell;">' + plotWord(_morph, 'span')+'</span>';
	    mstring = (morpheme == widx + '.' + j) 
	      ? '<span class="morpheme-error">?</span>'
	      : '<span class="morpheme">'+morpheme+'</span>';
	    morpheme_data.push(sstring);
	    user_morphemes.push(mstring);
	  }
	  else if (style == 'auto') {
	    var sstring, mstring, tmpm;
	    sstring = '<span style="display:table-cell;">' + plotWord(_morph, 'span')+'</span>';
	    tmpm = WLS[widx][CFG['_morphemes']].split(/\s+/);
	    mstring = (typeof tmpm[j] == 'undefined' || !tmpm[j] || tmpm[j][0] == '?') 
	      ? '<span class="morpheme-error">?</span>'
	      : '<span class="morpheme">'+tmpm[j]+'</span>';
	    morpheme_data.push(sstring);
	    user_morphemes.push(mstring);
	  }
	}
	//-> console.log(style, mode, view, morpheme, morphemes);
        for (var k=0; k < morphemes[morpheme].length; k++) {
          var this_idx = morphemes[morpheme][k][0];
          var this_jdx = morphemes[morpheme][k][1];
          var this_concept = morphemes[morpheme][k][2];
          if (this_idx != widx) {
            p.push([this_idx, this_jdx, this_concept]);
	    pcol_data.push('<span>' +
	      this_concept + 
	      '<sup>'+(j+1) + '/'+ (this_jdx+1)+'</sup>' +
	      '</span>');
	  }
	  pcol_filter.push(WLS.c2i[this_concept]);
	  if (local_indices.indexOf(this_idx) == -1) {
	    local_indices.push(this_idx);
	    local_words.push(words[indices.indexOf(this_idx)]);
	    local_concepts.push(this_concept);
	  }
	}
      }
      if (mode == 'full') {
	var c = colexifications[word.join(' ')]; // full colexification
      	for (var j=0; j<c.length; j++) {
      	  var this_idx = c[j][0];
      	  var this_concept = c[j][1];
      	  if (this_idx != widx) {
      	    col_data.push('<span>' +
      	      this_concept +
      	      '</span>');
      	  }
      	  col_filter.push(WLS.c2i[this_concept]);
      	}
      }
    
      
      td_col = (col_data.length > 0) ? '<td class="pointed" title="show colexifications in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+col_filter.join(',')+'\')">' + col_data.join(', ') +'</td>' : '<td></td>';
      var graph = (local_indices.length > 1) ? MORPH.get_morpheme_graph(local_indices, local_words, local_concepts, true) : false;
      var td_pcol = (pcol_data.length > 0) ? '<td class="pointed" title="show partial colexifications in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+pcol_filter.join(',')+'\')">' + pcol_data.join(', ') + '</td>' : '<td></td>';
      var td_graph = (graph) ? '<td><button class="btn btn-primary okbutton" onclick="MORPH.showGraph(\''+JSURL.stringify(graph).replace(/'/g,"\\'")+'\',false,\''+doculect+'\',\''+word.join(' ')+'\',\''+concept+'\')">GRAPH</button></td>' : '<td></td>';
      var td_user = (view == 'edit') 
	? '<td title="click to edit" onclick="MORPH.editMorphemeEntry(\'morphemes\','+widx+')" id="morphemes-'+ widx+'" style="max-width:300px;">' + 
	  user_morphemes.join('<span class="small" style="display:table-cell">+</span>') +
	  '</td>' 
	: '';
      var td_seg = (view == 'edit') 
	? '<td title="click to edit" onclick="MORPH.editMorphemeEntry(\'segments\','+widx+')" id="segments-'+widx+'" style="width:350px;">' + morpheme_data.join('<span class="small" style="display:table-cell">+</span>') + '</td>'
	: '<td id="segments-'+widx+'" style="width:350px;">' + morpheme_data.join('<span class="small" style="display:table-cell">+</span>') + '</td>'
	  ;
      
      td_col = (mode == 'full') 
	? td_col
	: td_pcol
	;

      text += '<tr>' +
        '<td>' + widx + '</td>' +
	'<td class="pointed" title="show word in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+WLS.c2i[concept]+'\')">' + concept + '</td>' +
	td_seg + 
	td_user +
	td_col +
	td_graph +
        '</tr>'
	;
    }
  }
  //-> console.log(JSON.stringify(graph));

  text += '</tbody></table>';
  var mid = document.getElementById('morphology_table');
  
  var G = MORPH.get_morpheme_graph(indices, words, concepts);
  G['doculect'] = doculect;
  var button = document.getElementById('morphology_graph');
  button.onclick = function () {MORPH.showGraph(JSURL.stringify(G), true, doculect, G['morphemes'], G['words']);}; 
  mid.innerHTML = text;
  mid.style.display = 'block';

  /* store indices in MORPH, so that we can quickly edit them */
  MORPH.indices = indices;
};

if (typeof process != 'undefined' && typeof process.argv != 'undefined') {
  if (process.argv[2] == 'test') {
    /* test get morphemes */
    var test_morph = MORPH.get_morphemes('hant+shu');
    //-> console.log(test_morph);
    var test_morph = MORPH.get_morphemes(['h', 'a', 'o', '⁵⁵', 'm', 'a', '²¹']);
    //-> console.log(test_morph);

    /* test get_all_morphemes */
    var indices = [1,2,3,4,5,6,7];
    var words = ['hant+shu', 'shu+hand','hant+arbeit','arbeit+sam', ['h','a','o','₅₅','m','a','₂₂'], ['h','a','²¹','h','a','o','₅₅'], 'hant+shu'];
    var concepts = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    var M = MORPH.get_all_morphemes(indices, words, concepts);
    for (m in M) {
      M[m].forEach( function(elm) {
	//-> console.log(m,'\t', elm[0], elm[1], elm[2])
	}
	);
    }
    //-> console.log(M);

    var C = MORPH.get_colexifications(indices, words, concepts);
    for (m in C) {
      C[m].forEach( function(elm) {
	//-> console.log(m,'\t', elm[0], elm[1])
	}
	);
    }
    //-> console.log(C);

  }
}

/* Morphology Module of the Edictor offers ways to handle morphology. The current version only
 * handles compound morphology in SEA languages.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * modified : 2016-03-21 10:49
 * modified : 2016-03-19 08:27
 *
 */

var MORPH = {};
MORPH.morphemes = {};

/* function to split a word into morphemes */
MORPH.get_morphemes = function(word) {
  var out = [[]];
  var split = false;
  for (var i=0,segment; segment=word[i]; i++) {
    if (split && CFG['morpheme_marks'].indexOf(segment) == -1) {
      out.push([]);
      split = false;
    }
    if (CFG['tone_marks'].indexOf(segment[0]) != -1) {
      split = true;
      out[out.length-1].push(segment);
    }
    else if (CFG['morpheme_marks'].indexOf(segment) != -1) {
      split = true;
    }
    else {
      out[out.length-1].push(segment);
    }
  }
  return out;
};

/* function returns all morphemes from indices, words and concepts */
MORPH.get_all_morphemes = function (indices, words, concepts) {
  var M = {}; 
  for (var i=0,idx, word, concept; idx=indices[i], word=words[i], concept=concepts[i]; i++) {
    var elms = MORPH.get_morphemes(word);
    for (var j=0; j < elms.length; j++) {
      var elm = elms[j].join(' ');
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
  var M = MORPH.get_all_morphemes(indices, words, concepts);
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
  var url = (fullgraph) ? 'plugouts/sigma.big.html?'+graph : 'plugouts/springy.small.html?'+graph;
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
    '<iframe id="iframe-graph" onload=UTIL.resizeframe(this);" src="'+url+'" style="width:90%;height:80%;min-height:400px;border:2px solid #2D6CA2"></iframe><br><div class="btn btn-primary okbutton" onclick="' + 
    "$('#editmode').remove(); document.onkeydown = function(event){basickeydown(event)};" +
    '")> OK </div></div>';
  nid.id = 'editmode';
  document.body.appendChild(nid);
  nid.innerHTML = text;
  $('#wfgraph').draggable({handle:'.main_handle'}).resizable();
}

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

  /* get current height of the window in order to determine maximal height of
   * the div */
  var heightA = document.getElementById('filedisplay').offsetHeight - 100;
  var heightB = window.innerHeight - 350;
  var cheight = (heightB-heightA > 300) ? heightB : heightA;

  document.getElementById('morphology_table').style.maxHeight =  cheight +'px';  
  var hid = document.getElementById('morphology_help');
  hid.innerHTML = '';
  hid.style.display = 'none';
  
  if (typeof filter == 'undefined') {
    filter = sampa2ipa(document.getElementById('morphology_filter').value);
    sort = '';
    direction = 1;
  }
  else {
    document.getElementById('morphology_filter').value = filter;
    if (typeof sort == 'undefined') {
      sort = 'alphabetic';
      direction = 1;
    }
    else if (typeof direction == 'undefined') {
      direction = 1;
    }
  }
  
  /* prepare the three arrays */
  var indices = WLS.taxa[doculect];
  if (sort == 'alphabetic') {
    var sorter = function (x, y) {
      return WLS[x][CFG._cidx].charCodeAt(0) - WLS[y][CFG._cidx].charCodeAt(0);
    }
  }
  else if (sort == 'phonemes') {
    var sorter = function (x, y) {
      var a = getSoundClass(WLS[x][CFG['_segments']][0]).charCodeAt(0);
      var b = getSoundClass(WLS[y][CFG['_segments']][0]).charCodeAt(0);
      return a - b;
    }
  }
  else { 
    var sorter = function (x, y) {return x - y};
  }
  indices.sort(sorter);

  var words = indices.map(function (x) {return WLS[x][CFG['_segments']].split(' ');});
  var concepts = indices.map(function (x) {return WLS[x][CFG._cidx];});

  switch (mode+'.'+style) {
    case 'full.user' : 
      fakeAlert('Not yet implemented, showing automatic partial colexifications instead.');
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      break;
    case 'full.auto' : 
      fakeAlert('Not yet implemented, showing automatic partial colexifications instead.');
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      break
    case 'partial.user' :
      var morphemes = MORPH.get_user_morphemes(indices, words, concepts);
      break;
    case 'partial.auto' :
      var morphemes = MORPH.get_all_morphemes(indices, words, concepts);
      break;
  }

  /* write the header of the table */
  var text = '<table class="data_table2" style="padding-right:25px;"><thead>' +
    '<tr>' +
    '<th class="titled" title="double click to sort" ondblclick="showMorphology(false,\''+doculect+'\')">ID</th>' +
    '<th class="titled" title="double click ot sort" ondblclick="showMorphology(false,\''+doculect+'\', \'\', \'alphabetic\')">CONCEPT</th>' +
    '<th class="titled" title="click on segment to filter, double click to sort" ondblclick="showMorphology(false,\''+doculect+'\',\'\',\'phonemes\')">MORPHEMES</th>' +
    '<th class="titled">COLEXIFICATIONS</th>' + 
    '<th class="titled">GRAPH</th>' + 
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
    }
    var col_filter = [];
    var pcol_filter = [];
    var local_indices = [];
    var local_words = [];
    var local_concepts = [];
    if (!filter || these_morphemes.indexOf(filter) != -1) {
      /* the various text added to major text in table */
      var morpheme_data = []; // morphemes with click and filter
      var pcol_data = []; // partial colexifications
      var col_data = []; // full colexifications
      var p = []; // partial colexification
      for (var j=0; morpheme=these_morphemes[j]; j++) {
	_morph = (style=='auto') ? morpheme : original_morphemes[j];
        var these_concepts = [];
	if (style == 'auto'){
	  morpheme_data.push('<span style="display:table-cell;" title="click to filter" onclick="showMorphology(false,\''+doculect+'\',\''+morpheme+'\');">' + 
	    plotWord(_morph, 'span', 'pointed')+'</span>');
	}
	else {
	  if (morpheme == widx + '.' + j) {
	    morpheme_data.push('<span style="display:table-cell;">' + 
		plotWord(_morph, 'span')+'<sub class="morpheme-error">?</sub></span>')
	  }
	  else {
	    morpheme_data.push('<span style="display:table-cell;" title="click to filter"' +
		'onclick="showMorphology(false,\''+doculect+'\',\''+morpheme+'\');">' + 
		plotWord(_morph, 'span', 'pointed') +
		'<sub class="morpheme">'+morpheme+'</sub>'+'</span>');
	  }
	}
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
      //var c = colexifications[word.join(' ')]; // full colexification
      //for (var j=0; j<c.length; j++) {
      //  var this_idx = c[j][0];
      //  var this_concept = c[j][1];
      //  if (this_idx != widx) {
      //    col_data.push('<span>' +
      //      this_concept +
      //      '</span>');
      //  }
      //  col_filter.push(WLS.c2i[this_concept]);
      //}
    
      var graph = (local_indices.length > 1) ? MORPH.get_morpheme_graph(local_indices, local_words, local_concepts, true) : false;
      
      //td_col = (col_data.length > 0) ? '<td class="pointed" title="show colexifications in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+col_filter.join(',')+'\')">' + col_data.join(', ') +'</td>' : '<td></td>';
      td_pcol = (pcol_data.length > 0) ? '<td class="pointed" title="show partial colexifications in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+pcol_filter.join(',')+'\')">' + pcol_data.join(', ') + '</td>' : '<td></td>';
      td_graph = (graph) ? '<td><button class="btn btn-primary okbutton" onclick="MORPH.showGraph(\''+encodeURI(JSON.stringify(graph))+'\',false,\''+doculect+'\',\''+word.join(' ')+'\',\''+concept+'\')">GRAPH</button></td>' : '<td></td>';

      text += '<tr>' +
        '<td>' + widx + '</td>' +
	'<td class="pointed" title="show word in wordlist" onclick="filterOccurrences(\''+doculect+'\',\''+WLS.c2i[concept]+'\')">' + concept + '</td>' +
        '<td style="max-width:600px;width:350px;">' + morpheme_data.join('<span style="font-size:75%;display:table-cell">+</span>') + '</td>' +
	//td_col +
	td_pcol +
	td_graph +
        '</tr>'
	;
    }
  }

  text += '</tbody></table>';
  var mid = document.getElementById('morphology_table');
  
  var G = MORPH.get_morpheme_graph(indices, words, concepts);
  G['doculect'] = doculect;
  var button = document.getElementById('morphology_graph');
  button.onclick = function () {MORPH.showGraph(encodeURI(JSON.stringify(G)), true, doculect, G['morphemes'], G['words']);}; 
  mid.innerHTML = text;
  mid.style.display = 'block';
};

if (typeof process != 'undefined' && typeof process.argv != 'undefined') {
  if (process.argv[2] == 'test') {
    /* test get morphemes */
    var test_morph = MORPH.get_morphemes('hant+shu');
    console.log(test_morph);
    var test_morph = MORPH.get_morphemes(['h', 'a', 'o', '⁵⁵', 'm', 'a', '²¹']);
    console.log(test_morph);

    /* test get_all_morphemes */
    var indices = [1,2,3,4,5,6,7];
    var words = ['hant+shu', 'shu+hand','hant+arbeit','arbeit+sam', ['h','a','o','₅₅','m','a','₂₂'], ['h','a','²¹','h','a','o','₅₅'], 'hant+shu'];
    var concepts = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    var M = MORPH.get_all_morphemes(indices, words, concepts);
    for (m in M) {
      M[m].forEach( function(elm) {
	console.log(m,'\t', elm[0], elm[1], elm[2])}
	);
    }
    console.log(M);

    var C = MORPH.get_colexifications(indices, words, concepts);
    for (m in C) {
      C[m].forEach( function(elm) {
	console.log(m,'\t', elm[0], elm[1])}
	);
    }
    console.log(C);

  }
}

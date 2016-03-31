/* Phonology interface for the edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-20 10:07
 * modified : 2016-03-20 10:07
 *
 */

PHON = {};

PHON.showChart = function(url, doculect) {

  var url = 'plugouts/ipa_chart.html?'+url;
  var nid = document.createElement('div');
  nid.style.display = '';
  nid.className = 'editmode';
  var text = '<div class="iframe-message" id="ipachart">' + 
    '<p style="color:white;font-weight:bold;">' +
    '<span class="main_handle pull-left" style="margin-left:0px;margin-top:2px;" ></span>' +
    ' IPA chart for '+ doculect+':</p>' +
    '<iframe onload="UTIL.resizeframe(this)" id="ipaiframe" src="'+url+'" style="width:90%;min-height:600px;border:2px solid #2D6CA2;"></iframe><br><div class="btn btn-primary okbutton" onclick="' + 
    "$('#editmode').remove(); document.onkeydown = function(event){basickeydown(event)};" +
    '")> OK </div></div>';
  nid.id = 'editmode';
  document.body.appendChild(nid);
  nid.innerHTML = text;
  var ipa = document.getElementById('ipachart');
  ipa.style.width = document.getElementById('ipaiframe').contentWindow.document.body.scrollWidth + 'px';
  $(ipa).draggable({handle:'.main_handle'});
}

/* function shows the occurrences of phonemes in the data */
function showPhonology (event, doculect, sort, direction) {
  if (event) {
    if (event.keyCode != 13) {
      return;
    }
  }
  
  /* get current height of the window in order to determine maximal height of
   * the div */
  var heightA = document.getElementById('filedisplay').offsetHeight - 100;
  var heightB = window.innerHeight - 350;
  var cheight = (heightB-heightA > 300) ? heightB : heightA;

  document.getElementById('phonology_table').style.maxHeight =  cheight +'px';
  document.getElementById('phonology_help').style.display = 'none';

  if (typeof sort == 'undefined') {
    sort = 'alphabetic';
    direction = 1;
  }
  else if (typeof direction == 'undefined') {
    direction = 1;
  }
  
  //->console.log(doculect);

  /* create an object in which the data will be stored */
  var occs = {};
  var phonemes = [];

  /* get all indices of the taxa */
  var idxs = WLS['taxa'][doculect];

  /* get index of tokens and concepts*/
  var tidx = WLS.header.indexOf('TOKENS');
  var aidx = WLS.header.indexOf('ALIGNMENT');
  var iidx = WLS.header.indexOf('IPA');
  var c = CFG['_cidx'];

  /* define symbols we do not want to trace */
  var dontrace = ['∼','◦'];
  
  /* iterate over the data */
  for (var i=0,idx; idx = idxs[i]; i++) {
    /* first check for valid alignments */
    if (WLS[idx][aidx] != 'undefined' && WLS[idx][aidx]) {
      var _tokens = WLS[idx][aidx].split(' ');
      var tokens = [];
      for (var j=0; j<_tokens.length; j++) {
	if ('()-'.indexOf(_tokens[j]) == -1) {
	  tokens.push(_tokens[j]);
	}
      }
    }
    else if (WLS[idx][tidx] != 'undefined' && WLS[idx][tidx]) {
      var tokens = WLS[idx][tidx].split(' ');
    }
    else {
      var tokens = ipa2tokens(WLS[idx][iidx]).split(' ');
    }

    for (var j=0,token; token=tokens[j]; j++) {
      if (dontrace.indexOf(token) == -1) {
	try {
      	  occs[token].push(idx);
      	}
      	catch (e)
      	{
      	  occs[token] = [idx];
      	  phonemes.push(token);
      	}
      }
    }
  }

  /* go for the sorting stuff */
  function get_sorter (sort, direction) {
    if (sort == 'alphabetic') {
      var sorter = function (x,y) {
        return x.charCodeAt(0) - y.charCodeAt(0);
      };
    }
    else if (sort == 'phoneme') {
      var sorter = function (x,y) {
        var a = getSoundClass(x).charCodeAt(0);
        var b = getSoundClass(y).charCodeAt(0);
	if (a == b) {
	  return x.localeCompare(y);
	}
        return a - b;  
      };
    }
    else if (sort == 'occurrences') {
      var sorter = function (x,y) { 
        return occs[x].length - occs[y].length; 
      };
    }
    else if (sort == 'type' || sort == 'place' || sort == 'manner' || sort == 'misc1' || sort == 'misc2') {
      var sorter = function(x,y) {
	var a = getSoundDescription(x, sort, true);
	var b = getSoundDescription(y, sort, true);
	if (!a && !b) {return 0}
	if (!a && b) {return -1}
	if (!b && a) {return 1}

	return a.localeCompare(b);
      };
    }

    if (direction == 1) {
      return function (x,y) { return sorter(x,y) };
    }
    else {
      return function (x,y) { return sorter(y,x) };
    }
  }

  /* define featueres for convenience */
  var features = ['place','manner','type','misc1','misc2'];

  /* change selection for the current sorting scheme */
  if (sort == 'phoneme') {
    var p_dir = (direction == 1) ? 0 : 1;
    var o_dir = 1;
    var f_dir = 1;
    var pclass = 'sorted';
    var oclass = 'unsorted';
  }
  else if (sort == 'occurrences') {
    var p_dir = 1;
    var o_dir = (direction == 1) ? 0 : 1;
    var f_dir = 1;
    var pclass = 'unsorted';
    var oclass = 'sorted';
  }
  else if (features.indexOf(sort) != -1) {
    var f_dir = (direction == 1) ? 0 : 1;
    var p_dir = 1;
    var o_dir = 1;
    var pclass = 'unsorted';
    var oclass = 'unsorted';
  }
  else {
    var p_dir = 1;
    var o_dir = 1;
    var f_dir = 1;
    var pclass = 'unsorted';
    var oclass = 'unsorted';
  }

  /* create the text, first not really sorted */
  phonemes.sort(get_sorter(sort, direction));
  var text = '<table class="data_table"><tr>' + 
    '<th title="double click to sort" ondblclick="showPhonology(false,\''+doculect+'\')">No.</th>' +
    '<th title="double click to sort" class="'+ pclass + '" ' + 
    'ondblclick="showPhonology(false,\''+doculect+'\',\'phoneme\',\''+p_dir+'\')">SOUND</th>' + 
    '<th title="double click to sort" class="'+ oclass + '" ' + 
    'ondblclick="showPhonology(false,\''+doculect+'\',\'occurrences\',\''+o_dir+'\')">FREQ</th>' + 
    '<th ondblclick="showPhonology(false,\''+doculect+'\',\'type\','  +f_dir+')" title="double click to sort" class="features '+((sort == 'type') ? 'sorted' :  'unsorted')+'" >TYPE</th>' + 
    '<th ondblclick="showPhonology(false,\''+doculect+'\',\'manner\','+f_dir+')" title="double click to sort" class="features '+((sort == 'manner') ? 'sorted' :'unsorted')+'" >MANNER (HEIGHT)</th>' +
    '<th ondblclick="showPhonology(false,\''+doculect+'\',\'place\',' +f_dir+')" title="double click to sort" class="features '+((sort == 'place') ? 'sorted' : 'unsorted')+'" >PLACE (COLOR)</th>' +
    '<th ondblclick="showPhonology(false,\''+doculect+'\',\'misc1\',' +f_dir+')" title="double click to sort" class="features '+((sort == 'misc1') ? 'sorted' : 'unsorted')+'" >VOICE (NASAL)</th>' +
    '<th ondblclick="showPhonology(false,\''+doculect+'\',\'misc2\',' +f_dir+')" title="double click to sort" class="features '+((sort == 'misc2') ? 'sorted' : 'unsorted')+'" >SECONDARY</th>' +
    '<th>Concepts</th>' + 
    '</tr>';

  var normalized_sounds = [];
  for (var i=0,phoneme; phoneme=phonemes[i]; i++) {
    var noc = occs[phoneme].length;
    var keys = occs[phoneme];
    
    /* create concepts */
    var concepts = [];
    var cids = [];
    //->console.log('c2i',WLS.c2i);
    for (var j=0,idx; idx=keys[j]; j++) {
      var concept = WLS[idx][c];
      if (concepts.indexOf(concept) == -1) {
       concepts.push(concept);
       cids.push(WLS.c2i[concept]);
      }
      concepts.sort();
    }
    text += '<tr>';
    text += '<td>' + (i+1) + '</td>';
    text += '<td>' + 
      plotWord(phoneme, 'span') + '</td>';
    text += '<td>' + noc + '</td>';
    var normalized_sound = normalize_ipa(phoneme);
    if (normalized_sounds.indexOf(normalized_sound) == -1) {
      normalized_sounds.push(normalized_sound);
    }
    var description = getSoundDescription(normalized_sound);
    if (description) {
      text += '<td class="features">'+description.join('</td><td class="features">')+'</td>'; // TODO no inline css!
    }
    else {
      text += '<td></td><td></td><td></td><td></td><td></td>';
    }
    text += '<td onclick="filterOccurrences(\''+doculect+'\',\''+cids.join(',')+'\')" class="concepts pointed" title="click to filter the occurrences of this phoneme">' + concepts.join(', ') + '</td>';
    text += '</tr>';
  }
  text += '</table>';

  /* make url for link */
  var link = 'phonobank.html?doculect='+encodeURIComponent(doculect)+'&sound_list='+encodeURIComponent(normalized_sounds.join(','));
  var url = 'doculect='+encodeURIComponent(doculect)+'&sound_list='+encodeURIComponent(normalized_sounds.join(','));
  var ipa_chars = document.getElementById('ipa_charts');
  ipa_charts.style.display="inline";
  ipa_charts.onclick = function() {PHON.showChart(url, doculect)};

  var did = document.getElementById('phonology_table');
  did.innerHTML = text;
  did.style.display = '';
}


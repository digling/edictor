/* <++>
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-21 14:14
 * modified : 2016-03-21 14:14
 *
 */

var PART = {};
PART.data = {};
PART.rootids = {};
PART.storage = [];

PART.partial_alignment = function(event, widx) {
  event.preventDefault();
  var idx_string = WLS[widx][CFG['_roots']];
  var concept = WLS[widx][CFG['_concepts']];
  var doculect = WLS[widx][CFG['_taxa']];
  var idxs = idx_string.split(' ');
  var words = {};

  var all_taxa = []; /* collect all taxa in the sample */
  var text = '<div class="edit_links" id="editlinks">' + 
    '<p>'+doculect+' «'+concept+'» ('+CFG['root_formatter']+': '+idxs+')'; 
  var cogids = [];
  for (var i=0,cogid; cogid=idxs[i]; i++) {
    words[cogid] = {morphemes: [], indices: [], positions: [], taxa: []};
    for (var j=0; j<WLS.roots[cogid].length; j++) {
      var idx = WLS.roots[cogid][j][0];
      var jdx = WLS.roots[cogid][j][1];
      var word = WLS[idx][CFG['_segments']];
      var morphemes = MORPH.get_morphemes(word.split(' '));
      var this_morpheme = morphemes[jdx];
      if (typeof this_morpheme != 'undefined') {
	words[cogid]['taxa'].push(WLS[idx][CFG['_taxa']]);
	words[cogid]['morphemes'].push(this_morpheme);
	words[cogid]['indices'].push(idx);
	words[cogid]['positions'].push(jdx);
      }
    }
    if (words[cogid]['taxa'].length != 0) {
      words[cogid]['alignment'] = $.extend(true, {}, ALIGN);
      words[cogid]['alignment']['ALMS'] = words[cogid]['morphemes'];
      words[cogid]['alignment']['TAXA'] = words[cogid]['taxa'];
      words[cogid]['alignment'].normalize(words[cogid]['alignment']['ALMS']);
      if (words[cogid]['taxa'].length > 1) {cogids.push(cogid);}
    }
  }
  text += '<div class="alignments" id="alignments">' + 
    '<table>' + 
    '<tr>'+'<th class="pchead">DOCULECTS</th><td style="width:3px"></td>';
  for (var i=0;i<cogids.length; i++) {
    var cogid = cogids[i];
    if (words[cogid]['taxa'].length > 1){
      text += '<th class="pchead" colspan="'+words[cogid]['alignment']['ALMS'][0].length+'">ID: '+cogid+'</th>';
      for (var j=0,taxon; taxon=words[cogid]['taxa'][j]; j++) {
	if (all_taxa.indexOf(taxon) == -1) {
	  all_taxa.push(taxon);
	}
      }
      if (i <cogids.length-1) {text += '<td style="width:3px"></td>';}
    }
  }
  text += '</tr>';
  all_taxa.sort();
  for (var i=0; i<all_taxa.length; i++) {
    var taxon = all_taxa[i];
    text += '<tr>' +
      '<td class="alm_taxon">' + all_taxa[i] + '</td><td style="width:3px"></td>';
    for (var j=0; j<cogids.length; j++) {
      var almidx = words[cogids[j]]['alignment']['TAXA'].indexOf(taxon);
      var almlen = words[cogids[j]]['alignment']['ALMS'][0].length;
      console.log('partlast', almidx, almlen, words[cogids[j]]['alignment']);
      if (almidx != -1) {
	text += plotWord(words[cogids[j]]['alignment']['ALMS'][almidx].join(' '), 'td');
	if (j != cogids.length-1){text += '<td></td>';}
      }
      else {
	for (var k=0;k<almlen;k++) {
	  text += '<td class="missing">Ø</td>';
	}
	if (j != cogids.length-1) {text += '<td></td>';}
      }
    }
    text += '</tr>';
  }
  text += '</table></div>';
  text += '<div><input class="btn btn-primary submit" type="button" onclick="ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="CLOSE" /></div><br><br></div>';
  console.log(cogids, all_taxa);
  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';
  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editmode').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  };

  $('#editlinks').draggable({handle:'.main_handle'}).resizable();

};

/* basic handler class that initiates the multiselect and other functionalities

 
* which are later needed for the cognate set panel */
PART.handle_partial_selection = function () {

  /* check whether formatter is true or not */
  if (!CFG['root_formatter']) {
    fakeAlert("Your data does not contain a column which stores partial cognates.");
    return;
  }
  
  /* get selector */
  var slc = document.getElementById('partial_select_concepts');
  
  /* retrieve concepts and add them to selection */
  var txt = '';
  for (concept in WLS['concepts']) {
    txt += '<option id="concept_'+WLS.c2i[concept]+'" value="'+concept+'">'+concept+'</option>';
  }
  slc.innerHTML = txt;
  slc.options[0].selected = true;
  CFG['_current_partial'] = slc.options[0].value;

  $('#partial_select_concepts').multiselect({
        disableIfEmtpy: true,
        includeSelectAllOption : true,
        enableFiltering: true,
        maxHeight: window.innerHeight-100,
        buttonClass : 'btn btn-primary mright submit pull-left',
        enableCaseInsensitiveFiltering: true,
        buttonContainer: '<div id="partial_select_concepts_button" class="select_button" />',
        buttonText: function (options, select) {
          return 'Select Concepts <b class="caret"></b>';
        }
      });

  PART.display_partial(CFG['_current_partial']);
  document.getElementById('partial_current_concept').innerHTML = CFG['_current_partial'];
};

PART.display_partial = function (concept) {
  /* retrieve all indices for the concept */
  var indices = WLS['concepts'][concept];
  var new_rootid = partialCognateIdentifier('?');
  
  this.data = {};
  this.rootids = []; 
  var tbody = [];
  for (var i=0,idx; idx=indices[i]; i++) {
    var roots = WLS[idx][CFG['_roots']].split(/\s+/);
    var taxon = WLS[idx][CFG['_taxa']];
    var concept = WLS[idx][CFG['_concepts']];
    var morphemes = MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(' '));
    var morpheme_strings = [];
    this.data[idx] = {};
    for (var j=0,morpheme; morpheme = morphemes[j]; j++) {
      var rootid = (typeof roots[j] != 'undefined' && roots[j] && !isNaN(parseInt(roots[j])))
        ? roots[j]
        : 0
        ;
      /* store root id for assembling current ids */
      if (rootid != 0 && this.rootids.indexOf(rootid) == -1) {
	this.rootids.push(rootid)
      };
      var tmp_color = (!rootid || rootid == 0) 
	? 'Crimson'
	: 'DarkGreen'
	; 
      var opacity = (!rootid || rootid==0)
	? ''
	: 'opacity:0.75'
	;
      this.data[idx][rootid] = [taxon, concept, morpheme, j];
      morpheme_strings.push('<span style="border: 2px solid white;display:table-cell;'+opacity+'" class="pointed" id="morph-'+idx+'-'+j+'" onclick="PART.storeEntry('+idx+','+j+');">'+plotWord(morpheme.join(' '), 'span', 'pointed') +
          '<sup style="display:table-cell;color:'+tmp_color+'">'+rootid+'</sup></span>');
    }
    tbody.push('<tr>' + 
      '<td class="alm_taxon">'+taxon+'</td>' +
      '<td></td>' + 
      '<td>'+concept+'</td>' +
      '<td></td>' +
      '<td>'+morpheme_strings.join('')+'</td>');
  }
  this.rootids.push(new_rootid);
  var tbody_text = '';
  for (var i=0,idx; idx=indices[i]; i++) {
    tbody_text += tbody[i];
    for (var j=0,rootid; rootid=this.rootids[j]; j++) {
      tbody_text += (rootid in this.data[idx]) 
	? '<td></td><td class="pointed" title="remove item from current cognate set" onclick="PART.remove_rootid('+idx+','+rootid+')" id="morpheme-'+idx+'-'+this.data[idx][3]+'">'+plotWord(this.data[idx][rootid][2].join(' '))+'</td>'
	: '<td></td><td></td>';
    }
    tbody_text += '</tr>';
  }

  var thead = '<table id="partial_alignments" class="alignments">' +
    '<tr>' +
    '<th class="pointed alm_bdl alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_taxa']]+'</th>' +
    '<th style="width:5px"></th>' +
    '<th class="pointed alm_bdr alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_concepts']]+'</th>' + 
    '<th style="width:5px"></th>' +
    '<th class="pointed alm_bdl alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_segments']]+'</th>' + 
    this.rootids.map(function (x) {
      return '<th style="width:5px"></th>' + 
	'<th onclick="PART.modifyJudgment('+x+')" class="pointed alm_bdr alm_head">ID-'+x+'</th>';
    }).join('') +
    '</tr>';

  var tab = document.getElementById('partial_table');
  tab.innerHTML = thead + tbody_text+'</table>';
};

PART.modifyJudgment = function (rootid) {
  console.log(this.data);
  for (var i=0,idf; idf=this.storage[i]; i++) {
    var idxjdx = idf.split('-').map(function (y) {return parseInt(y);});
    var idx = idxjdx[0];
    var jdx = idxjdx[1];
    /* get data for the current index */
    var taxon = WLS[idx][CFG['_taxa']];
    var concept = WLS[idx][CFG['_concepts']];
    var morphemes = MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(' '))[jdx];
    var rootids = WLS[idx][CFG['_roots']].split(' ').map(function (y) {return parseInt(y)});
    if (typeof morphemes[jdx] != 'undefined') {
      this.data[idx][rootid] = [taxon, concept, morphemes[jdx], jdx];
      rootids[jdx] = rootid;
      WLS[idx][CFG['_roots']] = rootids.join(' ');
    }
  }
  resetRootFormat(CFG['root_formatter']);
  this.display_partial(CFG['_current_partial']);
  PART.storage = [];
};

PART.remove_rootid = function (idx, rootid) {
  var rootids = WLS[idx][CFG['_roots']].split(' ').map(function (x){return parseInt(x);});
  var ridx = rootids.indexOf(rootid);
  rootids[ridx] = 0;
  WLS[idx][CFG['_roots']] = rootids.join(' ');
  console.log(rootids, ridx, rootid, WLS[idx][CFG['_roots']]);
  resetRootFormat(CFG['root_formatter']);
  PART.display_partial(CFG['_current_partial']);
  PART.storage = [];
};

PART.storeEntry = function(idx, j) {
  var idf = idx + '-' + j;
  if (PART.storage.indexOf(idf) == -1) {
    PART.storage.push(idf);
    document.getElementById('morph-'+idf).style.border = "2px solid crimson";
  }
  else {
    var new_storage = [];
    for (var i=0,part; part=PART.storage[i]; i++) {
      if (part != idf) {
	new_storage.push(part);
      }
    }
    PART.storage = new_storage;
    document.getElementById('morph-'+idf).style.border = "2px solid white";
  }
  console.log(PART.storage);
};

PART.display_previous_partial = function() {
  
  var ccon = CFG['_current_partial'];
  var acon = Object.keys(WLS.concepts);
  var pcon = acon[(acon.indexOf(ccon)-1)];
  PART.display_partial(pcon);
  document.getElementById('partial_current_concept').innerHTML = pcon;
  CFG['_current_partial'] = pcon;
}; 

PART.display_next_partial = function() {

  var ccon = CFG['_current_partial'];
  var acon = Object.keys(WLS.concepts);
  var ncon = acon[(acon.indexOf(ccon)+1)];
  PART.display_partial(ncon);

  document.getElementById('partial_current_concept').innerHTML = ncon;
  CFG['_current_partial'] = ncon;
};

PART.display_current_partial = function() {
  if (!CFG['_concept_multiselect']) {
    var ccon = CFG['_current_partial'];
    PART.display_partial(ccon);
  }
  else {
    PART.display_partial();
  }
};


PART.store = function (idx, jdx) {

};


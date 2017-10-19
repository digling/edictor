/* Utility functions
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-20 10:44
 * modified : 2016-03-23 18:25
 *
 */


var UTIL = {};
UTIL.log = {};
UTIL.show_help = function(topic, table, container) {
  container = (typeof container == "undefined") ? topic : container;
  table = (typeof table == 'undefined') ? topic+'_table' : table;
  //-> console.log(UTIL.log);
  if (topic in UTIL.log && UTIL.log[topic]) {
    document.getElementById(table).style.display = '';
    document.getElementById(topic+'_help').style.display = 'none';
    UTIL.log[topic] = false;
  }
  else if (topic in UTIL.log) {
    document.getElementById(table).style.display = 'none';
    document.getElementById(topic+'_help').style.display = '';
    UTIL.log[topic] = true;
  }
  else {
    $.ajax({
      async: true,
      type: "GET",
      url: "help/"+topic+'.html',
      dataType: "text",
      success: function(data) {
        var mid = document.getElementById(table);
        var hid = document.getElementById(topic+'_help');
        var eid = document.getElementById(container);
        hid.innerHTML = data;
        hid.style.width = eid.offsetWidth-50; 
        hid.style.display = '';
        mid.style.display = 'none';
        hid.style.minWidth = '70%';
	UTIL.log[topic] = true;
      }
    });
  }
}

UTIL.randint = function (min, max) {
  return Math.random() * (max - min) + min;
};

UTIL.resizeframe = function (iframe) {
  iframe.height = (10 + iframe.contentWindow.document.body.clientHeight) + 'px';
  iframe.width =  (iframe.contentWindow.document.body.clientWidth) + 'px';
}

UTIL.settings = {
  'remote_databases' : ['germanic', 'huber1992', 'burmish', 'sinotibetan', 'tukano'],
  'triple_path' : 'triples/triples.py',
  'summary_path' : 'triples/summary.py',
  'basics' : ['DOCULECT', 'GLOSS', 'CONCEPT', 'IPA', 'TOKENS', 'COGID', 
    'TAXON', 'TAXA', 'PROTO', 'PROTO_TOKENS', 'ETYMONID', 'CHINESE', 'CONCEPTLIST',
    'ORTHOGRAPHY','WORD','TRANSCRIPTION','SEGMENTS', 'PARTIALIDS', 'NOTE'],
  'preview': 10,
  'noid': false, 
  'sorting': false, 
  'formatter': false, 
  'root_formatter'    : false,
  '_alignment':false,
  '_patterns':-1, /* patterns of sound correspondences */
  'highlight': ['TOKENS','ALIGNMENT', 'SEGMENTS'],
  'sampa' : ['IPA','TOKENS', 'SEGMENTS', 'TRANSCRIPTION'],
  'pinyin' : ['CHINESE'],
  'css': ["menu:show","database:hide"],
  'status' : {},
  'server_side_files' : [],
  'server_side_bases' : [],
  'storable' : false,
  'last_time' : false, 
  'parsed' : false,
  'doculects' : false,
  'concepts' : false,
  'columns' : false,
  'remote_dbase' : 'triples.sqlite3',
  '_cpentry' : false,
  '_almcol' : 'ALIGNMENT',
  'template' : false,
  'update_mode' : "save",
  'align_all_words' : true,
  'async' : false,
  'tone_marks' : '⁰¹²³⁴⁵⁶₀₁₂₃₄₅₆',
  'morpheme_marks' : '+_◦←→',
  'navbar' : true,
  'gap_marker' : '-',
  'missing_marker' : 'Ø',
  'morpheme_separator' : '◦',
  'check_remote_intervall' : 10,
  '_proto' : false,
  '_note' : 'NOTE',
  'separator': "\t",
  'comment': '#'
}

UTIL.settable = {
  "lists" : [
    "highlight", 
    "sampa",
    "pinyin",
    "css",
    "basics",
    "_selected_doculects",
    "_selected_concepts"
  ],
  "items" : [
    "missing_marker",
    "separator",
    "gap_marker",
    "formatter",
    "root_formatter",
    "preview",
    "note_formatter",
    "pattern_formatter",
    "publish",
    "_almcol",
    "filename",
    "navbar"
  ],
  "dicts" : [
  ]
};

UTIL.open_remote_dbase = function(dbase, frame) {
  var idx = document.getElementById(dbase);
  for (var i=0,option; option=idx.options[i]; i++) {
    if (option.selected) {
      _fr = option.value.split('.');
      file = _fr[1];
      remote = _fr[0];
      //-> console.log(file, remote, _fr, option.value);
      var url = UTIL.settings.summary_path +"?file="+file+'&remote_dbase='+remote+'&summary=summary';
      document.getElementById(frame).src = url;
      break;
    }
  }
}

UTIL.load_settings = function() {

  var settables = ['preview', 'cognates', 'alignments', 'morphemes', 'roots', 'highlight', 'sampa',
    'pinyin', 'sources', 'note', 'proto'];
  var entries = {};
  for (var i=0, settable; settable=settables[i]; i++) {
    entries[settable] = document.getElementById('settings_'+settable);
  }

  /* start with preview */
  entries['preview'].value = CFG['preview'];

  /* now add cognates for fun */
  if (typeof CFG._fidx != 'undefined') {
    entries['cognates'].value = (CFG['_fidx'] != -1) 
      ? WLS['header'][CFG['_fidx']]
      : ''
      ;
  }
  entries['roots'].value = (CFG['_roots'] != -1) 
    ? WLS['header'][CFG['_roots']]
    : ''
    ;
  entries['alignments'].value = (CFG['_alignments'] != -1) 
    ? WLS['header'][CFG['_alignments']]
    : ''
    ;
  entries['morphemes'].value = (CFG['_morphemes'] != -1) 
    ? WLS['header'][CFG['_morphemes']]
    : ''
    ;

  for (var i=0,val; val=['highlight', 'sampa', 'pinyin'][i]; i++) {
    var defaults = CFG[val];
    var outs = [];
    for (var j=0,def; def=defaults[j]; j++) {
      if (WLS.header.indexOf(def) != -1) {
	outs.push(def);
      }
    }
    entries[val].value = outs.join(',');
  }
      
  for (var i=0,entry; entry=['cognates', 'alignments', 'morphemes', 'roots', 'note'][i]; i++) {
    console.log(entries[entry]);
    $(entries[entry]).autocomplete({
        source: WLS.header });
  }
  $(entries['proto']).autocomplete({source: Object.keys(WLS.taxa)});

};

UTIL.refresh_settings = function() {

  var settables = ['preview', 'cognates', 'alignments', 'morphemes', 'roots', 'highlight', 'sampa', 
    'pinyin', 'sources', 'note', 'proto' ];
  var entries = {};
  for (var i=0, settable; settable=settables[i]; i++) {
    entries[settable] = document.getElementById('settings_'+settable);
  }
  
  CFG['preview'] = parseInt(entries['preview'].value);
  
  for (var i=0,entry; entry=['cognates', 'alignments', 'morphemes', 'roots', 'sources', 'note'][i]; i++) {
    if (entry == 'cognates') {
      var this_entry = '_fidx';
    }
    else {
      var this_entry = '_'+entry;
    }
    if (entries[entry].value) {
      var idx = WLS.header.indexOf(entries[entry].value);
      CFG[this_entry] = (idx != -1)
	? idx
	: -1;
      if (entry == 'cognates' && CFG[this_entry] != -1) {
	resetFormat(entries[entry].value);
      }
      if (entry == 'roots' && CFG[this_entry] != -1) {
	resetRootFormat(entries[entry].value);
      }
      if (entry == 'note' && CFG[this_entry] != -1) {
	CFG['note_formatter'] = WLS.header[CFG['_note']];
      }
    }
    else {
      CFG[this_entry] = -1;
      if (entry == 'cognates') {
	resetFormat(false);
      }
      if (entry == 'roots') {
	resetRootFormat(false);
      }
    }
  }

  for (var i=0,entry; entry=['highlight', 'sampa', 'pinyin'][i]; i++) {
    var vals = entries[entry].value.split(',');
    var new_vals = [];
    for (var j=0; j<vals.length; j++) {
      if (WLS.header.indexOf(vals[j]) != -1) {
	new_vals.push(vals[j]);
      }
    }
    CFG[entry] = new_vals;
    entries[entry].value = new_vals.join(',');
  }
  showWLS(getCurrent());
  //-> console.log(CFG['_fidx'])
};

UTIL.check_wls = function(wls) {
  
};

UTIL.filter_by_concept = function(concept) {
  $('#select_concepts').multiselect('deselectAll', false);
  $('#select_concepts').multiselect('select', concept);
  applyFilter();
  showWLS(getCurrent());
};

UTIL.display_next_concept = function() {
  if (typeof CFG._current_concept == 'undefined') {
    CFG._current_concept = WLS.c2i[1];
  }
  var ccon = CFG._current_concept;
  var ncon = CFG.sorted_concepts[(CFG.sorted_concepts.indexOf(ccon)+1)];
  if (typeof ncon == 'undefined') {
    ncon = CFG.sorted_concepts[0];
  }
  this.filter_by_concept(ncon);
  CFG['_current_concept'] = ncon;
};

UTIL.display_previous_concept = function() {
  if (typeof CFG._current_concept == 'undefined') {
    CFG._current_concept = WLS.c2i[1];
  }
  var ccon = CFG._current_concept;
  var ncon = CFG.sorted_concepts[(CFG.sorted_concepts.indexOf(ccon)-1)];
  if (typeof ncon == 'undefined') {
    ncon = CFG.sorted_concepts[(CFG.sorted_concepts.length-1)];
  }
  this.filter_by_concept(ncon);
  CFG['_current_concept'] = ncon;
};


var ALIAS = {
  'doculect': ['TAXON', 'LANGUAGE', 'DOCULECT', 'DOCULECTS', 'TAXA', 'LANGUAGES', 'CONCEPTLIST'],
  'concept': ['CONCEPT', 'GLOSS'],
  'segments' : ['SEGMENTS', 'TOKENS'],
  'alignment' : ['ALIGNMENT'],
  'morphemes' : ['MORPHEMES'],
  'transcription' : ['IPA', 'TRANSCRIPTION'],
  'cognates' : ['COGID'],
  'roots' : ['PARTIALIDS', 'COGIDS'],
  'alignments' : ['ALIGNMENT'],
  'glottolog' : ['GLOTTOLOG', 'GLOTTOCODE'],
  'concepticon' : ['CONCEPTICON', 'CONCEPTICONID'],
  'sources' : ['SOURCE', "REFERENCE", "SOURCES"],
  'note' : ['NOTE', 'COMMENT', 'NOTES', 'COMMENTS'],
  'patterns' : ['PATTERNS']
}

/* text object stores text-related functions */
var TEXT = {};

/* make sure that no bad characters are mistakenly displayed when rendering
 * html or other markup */
TEXT.encodeComments = function(text) {
  var subs = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#039;',
    '<': '&lt;',
    '>': '&gt;'
  };
  
  var out = '';
  for (var i=0,c; c=text[i]; i++) {
    if (c in subs) {
      out += subs[c];
    }
    else {
      out += c;
    }
  }
  return out;
};

/* function replaces quotes in text by the Finnish ones, to avoid problems here */
TEXT.escapeValue = function(text) {
  var out = '';
  if (typeof text != 'string') {
    text = ''+text;
  }
  for (var i=0,c; c=text[i]; i++) {
    if (c == '"') {
      out += '”';
    }
    else {
      out += c;
    }
  }
  return out;
};

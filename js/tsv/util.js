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
  console.log(UTIL.log);
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
      'basics' : ['DOCULECT', 'GLOSS', 'CONCEPT', 'IPA', 'TOKENS', 'COGID', 
      'TAXON', 'TAXA', 'PROTO', 'PROTO_TOKENS', 'ETYMONID', 'CHINESE', 'CONCEPTLIST',
      'ORTHOGRAPHY','WORD','TRANSCRIPTION','SEGMENTS', 'PARTIALIDS'],
  'preview': 10,
  'noid': false, 
  'sorting': false, 
  'formatter': false, 
  'root_formatter'    : false,
  '_alignment':false,
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
  'morpheme_marks' : '+_◦',
  'navbar' : true
}

UTIL.open_remote_dbase = function(dbase, frame) {
  var idx = document.getElementById(dbase);
  for (var i=0,option; option=idx.options[i]; i++) {
    if (option.selected) {
      var url = UTIL.settings.triple_path +"?file="+option.value+'&remote_dbase='+option.value+'&summary=summary';
      document.getElementById(frame).src = url;
      console.log(url);
      break;
    }
  }
}

UTIL.refresh_settings = function() {

  var settables = ['preview', 'cognates', 'alignments', 'morphemes', 'roots'];
  var entries = {};
  for (var i=0, settable; settable=settables[i]; i++) {
    entries[settable] = document.getElementById('settings_'+settable);
  }

  /* start with preview */
  entries['preview'].value = CFG['preview'];

  /* now add cognates for fun */
  entries['cognates'].value = (CFG['_fidx'] != -1) 
    ? WLS['header'][CFG['_fidx']]
    : ''
    ;
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
  for (var i=0,entry; entry=['cognates', 'alignments', 'morphemes', 'roots'][i]; i++) {
    $(entries[entry]).autocomplete({
        source: WLS.header });
  }

  console.log('modified settings');
  
};

ALIAS = {
  'doculect': ['TAXON', 'LANGUAGE', 'DOCULECT', 'DOCULECTS', 'TAXA', 'LANGUAGES', 'CONCEPTLIST'],
  'concept': ['CONCEPT', 'GLOSS'],
  'segments' : ['SEGMENTS', 'TOKENS'],
  'alignment' : ['ALIGNMENT'],
  'morphemes' : ['MORPHEMES'],
  'transcription' : ['IPA', 'TRANSCRIPTION'],
  'cognates' : ['COGID'],
  'roots' : ['PARTIALIDS', 'COGIDS'],
  'alignments' : ['ALIGNMENT']
}


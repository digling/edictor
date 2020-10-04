/* Utility functions
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-20 10:44
 * modified : 2020-10-01 18:09
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
  'root_formatter' : false,
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
  'morpheme_separator' : '+',
  'check_remote_intervall' : 10,
  '_proto' : false,
  '_note' : 'NOTE',
  'separator': "\t",
  'comment': '#',
  'proto' : -1,
  '_morphology_mode': 'full',
  'display': ['filedisplay'],
  'quintiles': 'QUINTILES',
  'loaded_files': ['filedisplay']
}

UTIL.settable = {
  "lists" : [
    "highlight", 
    "sampa",
    "pinyin",
    "css",
    "basics",
    "_selected_doculects",
    "_selected_concepts",
    "sorted_taxa",
    "sorted_concepts",
    "display"
  ],
  "items" : [
    "missing_marker",
    "separator",
    "gap_marker",
    "formatter",
    "root_formatter",
    "note_formatter",
    "pattern_formatter",
    "publish",
    "_almcol",
    "filename",
    "navbar",
    "_morphology_mode"
  ],
  "integers" : [
    "preview"
  ],
  "bools" : [
    "publish",
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
    'pinyin', 'sources', 'note', 'proto', 'doculectorder'];
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
  $(entries['proto']).autocomplete({source: CFG.sorted_taxa});
  $(entries['doculectorder']).autocomplete({source: CFG.sorted_taxa});
  entries['doculectorder'].value = CFG.sorted_taxa.join(',');
};

UTIL.refresh_settings = function() {

  var settables = ['preview', 'cognates', 'alignments', 'morphemes', 'roots', 'highlight', 'sampa', 
    'pinyin', 'sources', 'note', 'proto', 'doculectorder'];
  var entries = {};
  for (var i=0, settable; settable=settables[i]; i++) {
    entries[settable] = document.getElementById('settings_'+settable);
  }

  CFG['preview'] = parseInt(entries['preview'].value);
  CFG['proto'] = (entries['proto'].value != '') ? entries['proto'].value : -1;
  if (CFG['sorted_taxa'].value != '') {
    var stax = [];
    var names = entries['doculectorder'].value.split(',');
    for (var i=0; i<names.length; i++) {
      if (LIST.has(CFG.sorted_taxa, names[i])) {
        stax.push(names[i]);
      }  
    }
    if (stax.length == CFG.sorted_taxa.length) {
      CFG.sorted_taxa = stax;
    }
    else {
      fakeAlert('The doculects you selected do not match with the names in your data!');
      entries['doculectorder'].value = CFG.sorted_taxa.join(',');
    }
  }
  
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
};

UTIL.check_wls = function(wls) {
  
};

UTIL.filter_by_concept = function(concept) {
  $('#select_concepts').multiselect('deselectAll', false);
  $('#select_concepts').multiselect('select', concept);
  if (document.getElementById('cognates_select_concepts') != null) {
    $('#cognates_select_concepts').multiselect('deselectAll', false);
    $('#cognates_select_concepts').multiselect('select', concept);
    display_cognates(concept);
  }
  if (document.getElementById('partial_select_concepts') != null) {
    $('#partial_select_concepts').multiselect('deselectAll', false);
    $('#partial_select_concepts').multiselect('select', concept);
    PART.display_partial(concept);
  }
  applyFilter();
  showWLS(1);
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
  /* check whether cognate panel is also active */
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

UTIL.show_quintuples = function(event, widx) {
  event.preventDefault();
  var entry = WLS[widx][WLS.header.indexOf(CFG.quintiles)];
  var segments = entry.split(' ');
  var i, j, quint, start, content;
  var text = '';
  var sdata = [];
  var tds = {};
  var bleft, bright;

  var morphemes = MORPH.get_morphemes(segments);
  text += '<tr>';
  for (i=0; i<morphemes.length; i++) {
    if (i != 0) {
      text += '<th></th>';
    }
    if (CFG.root_formatter) {
      content = CFG.root_formatter+': '+WLS[widx][CFG._roots].split(' ')[i];
    }
    else {
      content = '---';
    }
    text += '<th style="color:white;padding:6px;border-top:5px solid black;border-left:5px solid black;border-right:5px solid black;" colspan="'+morphemes[i].length+'">'+content+'</th>';
  }
  text += '</tr>';
  text += '<tr>';
  var tokens = MORPH.get_morphemes(WLS[widx][CFG._alignments].split(' '));
  for (i=0; i<morphemes.length; i++) {
    if (i!=0) {
      text += '<td></td>';
    }
    if (morphemes[i].length == 1) {
      text += '<td style="border:5px solid black;">'+plotWord(tokens[i].join(' '))+'</td>';
    }
    else {
      for (j=0; j<tokens[i].length; j++) {
        text += '<td style="border:5px solid black;">'+plotWord(tokens[i][j])+'</td>';
      }
    }
  }
  text += '</tr>';
  
  for (j=0; j<6; j++) {
    text += '<tr>';
    for (i=0; i<segments.length; i++) {
      quint = segments[i].split('|');
      if (quint.length == 1) {
        if (quint == CFG.morpheme_separator) {
                text += '<td style="border: 5px transparent white;border-right: 5px solid black;">';
              }
              else if (j == 0) {
                text += '<td style="border-right:5px solid black;border-left:5px solid black;">';
              }
              else if (j == 4 || j == 5) {
                text += '<td style="border-bottom:5px solid black;border-right:5px solid black;border-left:5px solid black;">';
              }
              else {
                text += '<td style="border-bottom:5px solid white;border-right:5px solid black;border-left:5px solid black;border-top:5px solid white;">';
              }
      }
      else if (j == 5) {
              text += '<td style="text-align:center;border-bottom:5px solid black;border-right:5px solid black;border-left:5px solid black;border-top:5px solid black;">';
      }
      else if (quint[j-1] != quint[j] && j > 0 && segments[i] != "+" && segments[i] != "?") {
              if (j != 4) {
                text += '<td style="border-bottom:5px transparent white;border-right:5px solid black;border-left:5px solid black;border-top:5px solid black;">';
              }
              else {
                text += '<td style="border-bottom:5px solid black;border-right:5px solid black;border-left:5px solid black;border-top:5px solid black;">';
              }
      }
      else if (j == 0) {
              text += '<td style="border-bottom:5px transparent white;border-right:5px solid black;border-left:5px solid black;border-top:5px solid black;">';
      }
      else if (j == 4) {
              text += '<td style="border-bottom:5px solid black;border-right:5px solid black;border-left:5px solid black;border-top:5px solid white;">';
      }
      else {
              text += '<td style="border-bottom:5px transparent black;border-right:5px solid black;border-left:5px solid black;border-top:5px solid white;">';
      }
      
      if (j == 5 && typeof quint[j] != 'undefined') {
              text += '<span style="color:white;font-weight:normal;">'+quint[j]+'</span>';
      }
      else if (j == 5) {
        text += ' ';
      }
      else if (typeof quint[j] != 'undefined' && quint != CFG.morpheme_separator && quint != "?") {
              text += plotWord(quint[j], span='span');
      }
      else if (quint == CFG.morpheme_separator) {
        text += ' ';
      }
      else if (quint == '?' || typeof quint[j] == 'undefined' || quint.length == 1) {
              text += '<span style="color:white">Ø</span>';
      }
      else {
              text += plotWord(quint[0], span='span');
      }
    }
    text += '</td></tr>';
  }
  //text += '<tr><td style="border-bottom:4px solid black;" colspan="'+segments.length+'"></td>';
  text = '<div style="padding:5px;border:6px solid white;"><table style="padding:20px;">'+text+'</table></div>';
  text = '<div class="edit_links niceblue" id="quintuple-popup" data-value="'+widx+'">'+
    '<span class="main_handle pull-left" style="margin-left:5px;margin-top:2px;"></span>' +
    '<p>Probability representation of «'+widx+'»:</p>' + text;
  text += '<input class="btn btn-primary submit" type="button" onclick="$(\'#quintuple-overview\').remove();basickeydown(event);" value="CLOSE" />' + 
    '</div><br><br></div>';
  var popup = document.createElement('div');
  popup.id = 'quintuple-overview';
  popup.className = 'editmode';
  document.body.appendChild(popup);
  popup.innerHTML = text;
  $('#quintuple-popup').draggable({handle:'.main_handle'}).resizable();
}

      
  


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


var LIST = {};
LIST.count = function(x, y){
  var count = 0;
  for(var i = 0; i < x.length; ++i){
      if(x[i] == y)
          count++;
  }
  return count;
};
LIST.has = function(x, y){
  if (x.indexOf(y) != -1){
    return true;
  }
  return false;
};
LIST.sum = function(x) {
  /* https://stackoverflow.com/questions/3762589/fastest-javascript-summation */
  return x.reduce(function(pv, cv) { return pv + cv; }, 0);
};

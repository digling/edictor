/* Wordlist main library
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-06-28 09:48
 * modified : 2024-06-08 22:48
 *
 */

function reset() {
  WLS = {};
  CFG = $.extend(true, {}, UTIL.settings);
  STORE = '';
  var BL = ['file'];

  /* make array for list-type entries */
  var list_types = ['sorted_taxa', 'highlight', 'sound_classes', 'sampa', 'css', 'doculects', 'columns', 'basics', 'concepts'];
  var eval_types = ['async', 'navbar'];
  
  var param, value;
  for (param in PARAMS) {
    value = PARAMS[param];
    console.log(value, param)

    if (BL.indexOf(param) == -1) {
      if (param == "morphology_mode") {
        CFG["_morphology_mode"] = value;
      }
      else if (!isNaN(parseInt(value))) {
        CFG[param] = parseInt(value);
      }
      else if (list_types.indexOf(param) != -1) {
        CFG[param] = [];
        var values = value.split('|');
        for (var i=0,val;val=values[i];i++) {
          if (val != '') {
            CFG[param].push(decodeURIComponent(val));
          }
        }
      }
      else if (eval_types.indexOf(param) != -1) {
        CFG[param] = eval(value);
      }
      else {
        CFG[param] = PARAMS[param];
        console.log("CFG", CFG[param], param, value);
      }
    }
  }
}

/* the wordlist object */
var WLS = {};

/* the basic configuration */
var CFG = $.extend(true, {}, UTIL.settings); 
var STORE = ''; // global variable to store the text data in raw format
var PARAMS = {};

/* function for resetting the formatter, that is the basic column that handles
 * what is treated as a cognate or not */
/* +++ TODO reset the format to allow for cognates with non-integers */
function resetFormat(value) {
  var tmp;
  if (!value) {
    CFG['formatter'] = false;
    WLS['etyma'] = [];
    CFG['_fidx'] = false;
    CFG['_cognates'] = false;
  }
  else {
    var size = 0;
    CFG['formatter'] = value;
    var format_selection = {};
    var format_idx = WLS.header.indexOf(value);
    for (key in WLS) {
      if (!isNaN(key)) {
        tmp = WLS[key][format_idx];
        if (String(tmp)[0] == "!") {
          tmp = tmp.slice(1, tmp.length);
        }
        if (tmp in format_selection) {
          format_selection[tmp].push(key);
        }
        else if (tmp && parseInt(tmp) != 0) {
          format_selection[tmp] = [key];
        }
        size += 1;
      }
    }
    WLS['etyma'] = format_selection;
    CFG['_fidx'] = WLS.header.indexOf(CFG['formatter']);
    CFG['_cognates'] = CFG['_fidx'];
  }
}

/* reset the root format for partial cognates in the data */
function resetRootFormat(value) {
  if (!value) {
    CFG['root_formatter'] = false;
    WLS['roots'] = [];
    CFG['_roots'] = false;
  }
  else {
    var size = 0;
    CFG['root_formatter'] = value;
    var format_selection = {};
    var format_idx = WLS.header.indexOf(value);
    for (key in WLS) {
      if (!isNaN(key)) {
        var tmpkeys = WLS[key][format_idx].split(' ');
        for (var i=0; i<tmpkeys.length; i++) {
          tmp = tmpkeys[i];
          if (tmp in format_selection) {
            format_selection[tmp].push([key,i]);
          }
          else if (tmp && parseInt(tmp) != 0) {
            format_selection[tmp] = [[key,i]];
          }
          size++;
        }
      }
    }
    /* ordertaxa */
    if (CFG.doculects) {
      for (key in format_selection) {
        format_selection[key].sort(function (x, y) {
          X = WLS[x[0]][CFG._tidx];
          Y = WLS[y[0]][CFG._tidx];
          //console.log(X, Y, CFG.doculects.indexOf(X));
          return CFG.doculects.indexOf(X) - CFG.doculects.indexOf(Y);
        });
      }
    }
    WLS['roots'] = format_selection;
    CFG['_roots'] = WLS.header.indexOf(CFG['root_formatter']);
  }
}


/* load qlc-file, core function to handle a wordlist text file and 
 * display it with the edictor */
function csvToArrays(allText, separator, comment, keyval) {
  var allTextLines = allText.split(/\r\n|\n/);
  var qlc = {};
  var taxa = {};
  var concepts = {};
  var tIdx = -1;
  var cIdx = -1;
  var cogid = -1;
  var selection = [];
  var subgroup_idx = -1;
  var columns = {};
  var count = 1;
  var uneditables = [];
  var column_names = {};
  var subgroups = {};
  var all_subgroups = [];

  var firstLineFound = false;
  var noid = false;
  var apply_filters = false; /* make sure to apply filters after showing wordlist */
  for (var i = 0; i < allTextLines.length; i++) {
    line = allTextLines[i];
    if (line.charAt(0) == comment || line.replace(/\s*/g,'') == '' || line.charAt(0) == keyval) {
      if (line.charAt(0) == comment) {
        if (line.charAt(1) == '@') {
                apply_filters = true;
          keyval = line.slice(2,line.length).trim().split('=');
          if (keyval.length == 2) {
            key = keyval[0];
            vals = keyval.slice(1,keyval.length).join('=');
                  if (vals == 'true') {
                    vals = true;
                  }
                  else if (vals == 'false') {
                    vals = false;
                  }
                  else if (UTIL.settable.lists.indexOf(key) != -1) {
                    vals = vals.split('|');
                  }
                  else if (UTIL.settable.integers.indexOf(key) != -1) {
                    vals = parseInt(vals);
                  }
                  else if (UTIL.settable.dicts.indexOf(key) != -1) {
                    var vals_ = vals.split('|');
                    vals = {};
                    for (var k=0,val; val=vals_[k]; k++) {
                            var keyval = val.split(':');
                            vals[keyval[0]] = keyval[1];
                          }
                    }
                  if (vals != 'undefined') {
                    CFG[key] = vals;
                    console.log(key, vals);
                  }
          }
        }
      }
      continue;
    }
    var data = line.split(separator);
    if (data[0] == 'ID') {
      firstLineFound = true;

      /* get the header */
      var header = [];
      for (j = 1; j < data.length; j++) {
        var datum = data[j].toUpperCase();

        if (!CFG['columns'] || CFG['columns'].indexOf(datum) != -1) {
          /* check for prohibited columns */
          if (datum.slice(0,1) == '_') {
            datum = datum.slice(1,datum.length);
            var tmp = datum.replace(/_/g,' ');
            datum = datum.replace(/_/g,'');
            column_names[datum] = tmp;
            uneditables.push(datum);
            //->console.log(datum,column_names,uneditables,tmp);
          }
          else {
            var tmp = datum.replace(/_/g,' ');
            datum = datum.replace(/_/g,'');
            column_names[datum] = tmp;
          }

          header.push(datum);

          if (ALIAS['doculect'].indexOf(datum) != -1) { tIdx = j; }
          else if (ALIAS['concept'].indexOf(datum) != -1) { cIdx = j; }
          else if (ALIAS['segments'].indexOf(datum) != -1) { sIdx = j; }
          else if (ALIAS['alignment'].indexOf(datum) != -1) { aIdx = j; }
          else if (ALIAS['transcription'].indexOf(datum) != -1) { iIdx = j; }
          else if (ALIAS['morphemes'].indexOf(datum) != -1) { mIdx = j; }
          else if (ALIAS['subgroup'].indexOf(datum) != -1) {subgroup_idx = j;}
          else if (ALIAS['sources'].indexOf(datum) != -1) { srcIdx = j; }
          if (CFG['basics'].indexOf(datum) != -1) { columns[datum] = j; }
          else { columns[datum] = -j; }
        }
      }
      /* apply check for tidx and cidx */
      if (tIdx == -1 && cIdx == -1) {tIdx = 1;cIdx = 2; CFG['tc_status'] = 'notc'}
      else if (cIdx == -1 && tIdx > 1) {cIdx = 1; CFG['tc_status'] = 'noc' }
      else if (cIdx == -1 && tIdx <= 1 && tIdx > -1) {cIdx = 2; CFG['tc_status'] = 'noc'}
      else if (tIdx == -1 && cIdx > 1) {tIdx = 1; CFG['tc_status'] = 'not' }
      else if (tIdx == -1 && cIdx <= 1 && cIdx > -1) {tIdx = 2; CFG['tc_status'] = 'not'}
      else { CFG['tc_status'] = ''; }

      /* append to basics if it is not already defined, but be careful with other stuff */
      if (CFG['tc_status'].indexOf('t') != -1) {
        columns[header[tIdx-1]] = Math.abs(columns[header[tIdx-1]]);
        CFG['basics'].push(header[tIdx-1]);
      }
      if (CFG['tc_status'].indexOf('c') != -1) {
        columns[header[cIdx-1]] = Math.abs(columns[header[cIdx-1]]);
        CFG['basics'].push(header[cIdx-1]);
      }
    }
    /* handle cases where no ID has been submitted */
    else if (firstLineFound == false) {
      firstLineFound = true;
      noid = true;
      CFG['noid'] = true;

      data = data.forEach(function(x) {x.replace(/"/,'&quot;');});

      /* get the header */
      var header = [];
      for (j = 0; j < data.length; j++) {
        var datum = data[j].toUpperCase();

        if (!CFG['columns'] || CFG['columns'].indexOf(datum) != -1) {

          /* check for prohibited columns */
          if (datum.slice(0,1) == '_') {
            datum = datum.slice(1,datum.length);
            var tmp = datum.replace(/_/g,' ');
            datum = datum.replace(/_/g,'');
            column_names[datum] = tmp;
            uneditables.push(datum);
          }
          else {
            var tmp = datum.replace(/_/g,' ');
            datum = datum.replace(/_/g,'');
            column_names[datum] = tmp;
          }
          header.push(datum);
          if (ALIAS['doculect'].indexOf(datum) != -1) { tIdx = j; }
          else if (ALIAS['concept'].indexOf(datum) != -1) { cIdx = j; }
          else if (ALIAS['segments'].indexOf(datum) != -1) { sIdx = j; }
          else if (ALIAS['alignment'].indexOf(datum) != -1) { aIdx = j; }
          else if (ALIAS['transcription'].indexOf(datum) != -1) { iIdx = j; }
          else if (ALIAS['morphemes'].indexOf(datum) != -1) { mIdx = j; }
          else if (ALIAS['sources'].indexOf(datum) != -1) { srcIdx = j; }
          if (CFG['basics'].indexOf(datum) != -1) { columns[datum] = j + 1; }
          else { columns[datum] = -(j + 1); }
        }
      }

      /* apply check for tidx and cidx */
      if (tIdx == -1 && cIdx == -1) {tIdx = 1;cIdx = 2; CFG['tc_status'] = 'notc'}
      else if (cIdx == -1 && tIdx > 1) {cIdx = 1; CFG['tc_status'] = 'noc' }
      else if (cIdx == -1 && tIdx <= 1 && tIdx > -1) {cIdx = 2; CFG['tc_status'] = 'noc'}
      else if (tIdx == -1 && cIdx > 1) {tIdx = 1; CFG['tc_status'] = 'not' }
      else if (tIdx == -1 && cIdx <= 1 && cIdx > -1) {tIdx = 2; CFG['tc_status'] = 'not'}

      /* append to basics */
      columns[data[tIdx].toUpperCase()] = Math.abs(columns[data[tIdx].toUpperCase()]);
      columns[data[cIdx].toUpperCase()] = Math.abs(columns[data[cIdx].toUpperCase()]);
      CFG['basics'].push(data[tIdx].toUpperCase());
      CFG['basics'].push(data[cIdx].toUpperCase());
    }
    /* successively load the data into the wordlist object */
    else if (firstLineFound) {
      if (data.length != header.length + 1) {
        fakeAlert("Line «"+data.join('|')+"» has "+data.length+" cells, but we expect "+(1+header.length)+'!');
      }
      /* check for header */
      var taxon = data[tIdx];
      var concept = data[cIdx];

      /* now, suppose we have a restricted taxa- or concept list, we check
       * whether the items occur in this selection */
      if (
          (typeof concept != 'undefined') &&
          (!CFG['doculects'] || CFG['doculects'].indexOf(taxon) != -1) &&
          (!CFG['concepts'] || CFG['concepts'].indexOf(concept) != -1)
         ) {

        /* check for the index */
        if (!noid) {var idx = parseInt(data[0]); count += 1;}
        else {var idx = count; count += 1;}

        /* the following lines append taxonomic values */
        if (typeof taxa[taxon] == 'object') {
        taxa[taxon].push(idx);
        }
        else {
          taxa[taxon] = [idx];
        }

        /* add subgroup information */
        if (typeof subgroups[taxon] != "object") {
          if (subgroup_idx > -1){
            if (data[subgroup_idx] != "") {
              if (all_subgroups.indexOf(data[subgroup_idx]) == -1){
                all_subgroups.push(data[subgroup_idx]);
              }
              subgroups[taxon] = data[subgroup_idx];
            }
          }
          else {
            subgroups[taxon] = 'NAN'; 
            if (all_subgroups.length != 1){
              all_subgroups.push('NAN');
            }
          }
        }

        /* these lines append concepts */
        /* note that we need to make the object typecheck here, since gecko-engines and firefox
         * define the watch-property for arrays, which clashes when trying to fill it (awful) */
        if (typeof concepts[concept] == 'object') {
          concepts[concept].push(idx);
        }
        else {
          concepts[concept] = [idx];
        }

        if (!noid) {
          /* check whether columns have been passed via configs */
          if (!CFG['columns']) {
            qlc[idx] = data.slice(1, data.length);
          }
          else {
            qlc[idx] = [];
            for (key in columns) {
              qlc[idx].push(data[Math.abs(columns[key])]);
            }
          }
        }
        else {
          qlc[idx] = data.slice(0,data.length);
        }
        selection.push(idx);
      }
    }
  }
  
  /* create a concept - id converter and vice versa for various purposes */
  var c2i = {};
  var ccount = 1;
  for(c in concepts) {
    c2i[ccount] = c;
    c2i[c] = ccount;
    ccount += 1;
  }
  
  WLS = qlc;
  WLS['header'] = header;
  WLS['taxa'] = taxa;
  WLS['concepts'] = concepts;
  WLS['rows'] = selection;
  WLS['_trows'] = selection.slice();
  WLS['columns'] = columns;
  WLS['filename'] = CFG['filename'];
  WLS['uneditables'] = uneditables;
  WLS['column_names'] = column_names;
  WLS['c2i'] = c2i;

  /* organize coloring of subgroups */
  all_subgroups.sort();
  for (taxon in subgroups) {
    i = all_subgroups.indexOf(subgroups[taxon]);
    if (i < 24){
      styler = UTIL.subgroups[i];
    }
    else {
      styler = '';
    }
    subgroups[taxon] = [subgroups[taxon], styler];
  }

  WLS['subgroups'] = subgroups;




  /* ! attention here, this may change if no ids are submitted! */
  CFG['_tidx'] = tIdx-1; // index of taxa
  CFG['_cidx'] = cIdx-1; // index of concepts
  CFG['_concepts'] = cIdx-1;
  CFG['_subgroup'] = subgroup_idx-1;
  CFG['_taxa'] = tIdx-1;
  CFG['_segments'] = (typeof sIdx != 'undefined') ? sIdx-1 : -1;
  CFG['_alignments'] = (typeof aIdx != 'undefined') ? aIdx-1 : -1;
  CFG['_transcriptions'] = (typeof iIdx != 'undefined') ? iIdx-1 : -1;
  CFG['_morphemes'] = (typeof mIdx != 'undefined') ? mIdx-1: -1;
  CFG['morpheme_formatter'] = (typeof mIdx != 'undefined') ? WLS.header[(mIdx-1)] : -1;
  CFG['_sources'] = (typeof srcIdx != 'undefined') ? srcIdx-1: -1;
  CFG['parsed'] = true;
  if (typeof CFG['sorted_taxa'] == 'undefined'){
    if (typeof CFG["doculectorder"] != "undefined") {
      CFG["sorted_taxa"] = CFG["doculectorder"].split("|");
    }
    else {
      CFG['sorted_taxa'] = Object.keys(WLS.taxa);
      CFG['sorted_taxa'].sort(
        function (x, y){
          if (WLS['subgroups'][x][0] == WLS['subgroups'][y][0]) {
            return x.localeCompare(y);
          }
          else {
            return WLS['subgroups'][x][0].localeCompare(WLS['subgroups'][y][0]);
          }
        }
      );
    }
  }
  if (!('_selected_doculects' in CFG)){
    CFG['_selected_doculects'] = CFG['sorted_taxa'];
  }
  
  /* create array in cfg for concepts in sorted form */
  concept_keys = Object.keys(WLS.concepts);
  if (typeof CFG.sorted_concepts == 'undefined') {
    CFG['sorted_concepts'] = [];
    for (var i=0; i<concept_keys.length; i++) {
      CFG['sorted_concepts'].push(WLS.c2i[i+1]);
    }
  }
  if (!('_selected_concepts' in CFG)){
    CFG['_selected_concepts'] = CFG['sorted_concepts'];
  }

  if ("morphology_mode" in PARAMS) {
    UTIL.settings["_morphology_mode"] = PARAMS["morphology_mode"];
    CFG._morphology_mode = PARAMS["morphology_mode"];
  }

  if (CFG._morphology_mode == "partial") {
    document.getElementById("mmodef").checked = false;
    document.getElementById("mmodep").checked = true;
  }
  else {
    document.getElementById("mmodef").checked = true;
    document.getElementById("mmodep").checked = false;
  }

  WLS['height'] = CFG['sorted_concepts'].length;
  WLS['width'] = CFG['sorted_taxa'].length;
  WLS['length'] = count;

  /* check for glottolog and concepticon in header */
  for (var i=0, head; head=WLS.header[i]; i++) {
    if (ALIAS['glottolog'].indexOf(head) != -1) {CFG['_glottolog'] = i;}
    if (ALIAS['concepticon'].indexOf(head) != -1) {CFG['_concepticon'] = i;}
    if (ALIAS['patterns'].indexOf(head) != -1) {CFG['_patterns'] = i; CFG['pattern_formatter'] = head;}
    if (ALIAS['note'].indexOf(head) != -1) {
      CFG['_note'] = i;
      CFG['note_formatter'] = head;
    }
  }
  if (typeof CFG._glottolog == 'undefined') {
    CFG._glottolog = -1;
  }
  if (typeof CFG._concepticon == 'undefined') {
    CFG._concepticon = -1;
  }
  if (typeof CFG._note == 'undefined') {
    CFG._note = -1;
  }

  /* first get all id headers into an array */
  var formattable_keys = [];
  for (key in WLS['columns']) {
    if (key.indexOf('ID') == key.length -2) {
      formattable_keys.push(key);
    }
  }

  /* check for cogid or glossid first */
  if (CFG['formatter']) {}
  else if (formattable_keys.indexOf('COGID') != -1) { CFG['formatter'] = 'COGID'; }
  else if (formattable_keys.indexOf('GLOSSID') != -1) { CFG['formatter'] = 'GLOSSID'; }
  else if (formattable_keys.length > 0){ CFG['formatter'] = formattable_keys[0]; }
  else { CFG['formatter'] = false; }
  /* add cognate index to CFG as "_fidx" if formatter is found */
  if (CFG['formatter']) {CFG['_fidx'] = WLS.columns[CFG['formatter']];}
  /* reset the format to the currently chosen formatting option */
  if (CFG['formatter']) {
    resetFormat(CFG['formatter']);
  }
  /* handle root formatter */
  var root_formattable_keys = [];
  for (key in WLS['columns']) { if (key.indexOf('IDS') == key.length -3) { root_formattable_keys.push(key); } }
  if (CFG['root_formatter']) {}
  else if (root_formattable_keys.indexOf('COGIDS') != -1) {CFG['root_formatter'] = 'COGIDS';}
  else if (root_formattable_keys.indexOf('PARTIALIDS') != -1) {CFG['root_formatter'] = 'PARTIALIDS';}
  else {CFG['root_formatter'] = false;}
  CFG['_roots'] = (CFG['root_formatter']) ? WLS.columns[CFG['root_formatter']] : -1;
  
  if (CFG['_roots'] != -1) {resetRootFormat(CFG['root_formatter']);} 
  /* create selectors */
  createSelectors();
  /* sort the data following the default sorting options */
  sort_rows = function (x,y){
    var _x = WLS[x][CFG['_cidx']] + ' ' + WLS[x][CFG['_tidx']];
    var _y = WLS[y][CFG['_cidx']] + ' ' + WLS[y][CFG['_tidx']];
    return _x.localeCompare(_y);
  }
  WLS._trows.sort(sort_rows);
  WLS.rows.sort(sort_rows);
  if (apply_filters) {
    applyFilter();
  }

  /* add statistic information */
  $('#wordlist-statistics').removeClass('hidden').html(
      '&lt;'+CFG['filename'] +
      '&gt; ('+WLS.length+' rows, '+WLS.height+' concepts, '+WLS.width+' doculects)');
  /* check for other items in the display which should be loaded */
  if ('display' in CFG) {
    if (CFG.display.indexOf('filedisplay') == -1) {
      document.getElementById('toggle_filedisplay').onclick({"preventDefault": function(x){return x}}, 'filedisplay');
    }
    for (var i=0, display; display=CFG.display[i]; i++) {
      if (display != 'filedisplay'){
        document.getElementById('toggle_'+display).onclick({"preventDefault": function(x){return x}}, 'sortable', display, 'colx largebox');
      }
    }
  }
}

/* create selectors for languages, concepts, and columns */
function createSelectors() {
  /* check first if the selectors have been created already, if so, destroy them */
  var doculect_button = document.getElementById('select_doculects_button');
  if (typeof doculect_button != 'undefined') {
    $('#select_doculects').multiselect('destroy');
  }
  var concepts_button = document.getElementById('select_concepts_button');
  if (typeof doculect_button != 'undefined') {
    $('#select_concepts').multiselect('destroy');
  }
  var columns_button = document.getElementById('select_columns_button');
  if (typeof doculect_button != 'undefined') {
    $('#select_columns').multiselect('destroy');
  }
  
  /* for taxa and concepts, we should check whether they are actually 
   * in the data passed to the app. If they are missing, we shouldn't bother 
   * displaying the stuff */
  if (CFG['tc_status'] != 'not' && CFG['tc_status'] != 'notc') {
    //->console.log('creating columns');
    var did = document.getElementById('select_doculects');
    var doculects = CFG['sorted_taxa'];
    var txt = '';
    var taxon_addon = '';
    for (var i=0,doculect; doculect=doculects[i]; i++) {
      var sel = '" selected>';
      if (CFG['_selected_doculects'].indexOf(doculect) == -1) {
	sel = '">';
      }
      if (WLS['subgroups'][doculect][0] != 'NAN'){
        taxon_addon = ' ('+WLS['subgroups'][doculect][0].slice(0, 3)+')';
      }
      txt += '<option value="'+doculect+sel+doculect+taxon_addon+'</option>';
    }
    did.innerHTML = txt;
  }
  if (CFG['tc_status'] != 'noc' && CFG['tc_status'] != 'notc') {
    var cid = document.getElementById('select_concepts');
    txt = ''
    for (var i=0,concept; concept=CFG['sorted_concepts'][i]; i++) {
      var sel = '" selected>';
      if (CFG['_selected_concepts'].indexOf(concept) == -1) {
	sel = '">';
      }
      txt += '<option value="'+concept+sel+concept+'</option>';
    }
    cid.innerHTML = txt;
  }
 
  /* column selection, however, will always be displayed */
  var eid = document.getElementById('select_columns');
  var columns = Object.keys(WLS.columns);
  columns.sort();
  txt = '';
  //->console.log(columns);

  for (var i=0,column; column=columns[i]; i++) {
    if (WLS.columns[column] > 0) {
      txt += '<option value="'+column+'" selected>'+WLS.column_names[column]+'</option>';
    }
    else {
      txt += '<option value="'+column+'">'+WLS.column_names[column]+'</option>';
    }
  }
  eid.innerHTML = txt;
  
  /* check again fro taxa */
  if (CFG['tc_status'] != 'not' && CFG['tc_status'] != 'notc'){
    $('#select_doculects').multiselect({
      disableIfEmtpy: true,
      includeSelectAllOption : true,
      enableFiltering: true,
      maxHeight: window.innerHeight-100,
      buttonClass : 'btn btn-primary mright submit pull-left',
      enableCaseInsensitiveFiltering: true,
      buttonContainer: '<div id="select_doculects_button" class="select_button" />',
      buttonText: function (options, select) {
        return 'Select Doculects <b class="caret"></b>';
      }
    });
  }
  else {
    document.getElementById('select_doculects').style.display = "none";
  }

  /* check again for concepts */
  if (CFG['tc_status'] != 'noc' && CFG['tc_status'] != 'notc') {
    $('#select_concepts').multiselect({
      disableIfEmpty: true,
      includeSelectAllOption : true,
      enableFiltering: true,
      maxHeight: window.innerHeight-100,
      buttonClass : 'btn btn-primary mright submit pull-left',
      enableCaseInsensitiveFiltering: true,
      buttonContainer: '<div id="select_concepts_button" class="select_button" />',
      buttonText: function (options, select) {
        return 'Select Concepts <b class="caret"></b>';
      }
    });
  }
  else {
    document.getElementById('select_concepts').style.display = "none";
  }
  
  $('#select_columns').multiselect('destroy');
  $('#select_columns').multiselect({
    disableIfEmpty: true,
    includeSelectAllOption : true,
    enableFiltering: true,
    maxHeight: window.innerHeight-100,
    buttonClass : 'btn btn-primary mright submit pull-left',
    enableCaseInsensitiveFiltering: true,
    buttonContainer: '<div id="select_columns_button" class="select_button" />',
    buttonText: function (options, select) {
      return 'Select Columns <b class="caret"></b>';
    }
  });
  
}

/* major function for displaying the Wordlist panel of the Edictor */
function showWLS(start){
  if (!CFG['parsed']) {
    if (CFG['storable']) {
      CFG['last_time'] = new Date();
    }
    if (typeof localStorage.text != 'undefined' && !CFG['load_new_file']) {
      //-> console.log('found text', localStorage.text);
      CFG['filename'] = localStorage.filename;
      csvToArrays(localStorage.text, CFG['separator'], '#', '@');
    }
    else {
      csvToArrays(STORE, CFG['separator'], '#', '@');
    }
  }
  else {
    /* if we are dealing with a storable session, we now call ajax to tell us
     * which files have most recently (within a ten minutes time frame) been updated
     * we compare these with our own data and replace all cases where our own data 
     * differs */
    if (CFG['storable']) {
      var now = new Date();
      var passed_time = (now - CFG['last_time']) / 6000;
      if (passed_time > CFG['check_remote_intervall']) {
        /* create the url */
        var url = 'triples/modifications.py';
        var postdata = {
          'remote_dbase': CFG['remote_dbase'],
          'file': CFG['filename'],
          'date': parseInt(CFG['last_time'].getTime() / 1000)
        };
        var txt = '';
        /* make the ajax call */ 
        $.ajax({
          async: true,
          type: "POST",
          data: postdata,
          contentType: "application/text; charset=utf-8",
          url: url,
          dataType: "text",
          success: function(data) {
            txt = data;
            /* iterate over all lines and check for updates */
            var lines = txt.split('\n');
            var i, line, cells, idx, col, col_idx, val;
            var count = 0;
            for (i = 0; line = lines[i]; i += 1){
              cells = line.split('\t');
              idx = parseInt(cells[0]);
              col = cells[1].replace(/_/g,'');
              col_idx = WLS.header.indexOf(col);
              /* check if column actually exists (it may just have been created
               * and will thus not appear in the current application, which is 
               * also not needed for now */
              if (col_idx != -1) {
                val = cells[2];
                //-> console.log(col_idx, val, col);
                if (WLS[idx][col_idx] != val) {
                  WLS[idx][col_idx] = val;
                  count += 1;
                }
              }
            }
            CFG['last_time'] = now;
            var saved = document.getElementById("data_saved");
            if (typeof saved != "undefined" && saved !== null) {
              var time = now.toLocaleDateString() + " " + now.toLocaleTimeString();
              if (count > 0) {
                saved.innerHTML = "Found " + count + " entries from remote server at " + time + ".";
              }
              else {
                saved.innerHTML = "Checked with remotely modified data at " + time + ".";
              }
            }
          },
          error: function() {
            CFG['storable'] = false;
            fakeAlert("Could not retrieve data from the database.");
          }    
        });

      }
    }
  }

  var text = '<table id="qlc_table">';

  /* we create the header of the table first */
  text += '<col id="ID" />';
  var thtext = ''; // ff vs. chrome problem
  for (i in WLS['header']) {
    var head = WLS['header'][i];
    if (WLS['columns'][head] > 0) {
      text += '<col id="' + head + '" />';
      thtext += '<th class="titled" title="Double-click for sorting along this column."' 
        + 'id="HEAD_'+head+'" '
        + 'ondblclick="sortTable(event,'+"'"+head+"'"+')">' + 
        WLS.column_names[head] + '</th>';
    }
    else {
      text += '<col id="' + head + '" style="visibility:hidden;" />';
      thtext += '<th style="display:none">' + WLS.column_names[head] + '</th>';
    }
  }

  text += '<tr>';
  text += '<th>ID</th>';
  text += thtext;
  var count = 1;
  //console.log('wls.rows',WLS.rows);
  if (CFG['formatter'] || CFG['root_formatter']) {
    var previous_format = '';
    var tmp_class = 'd0';
    for (i in WLS['rows'])  {
      var idx = WLS['rows'][i];
      var current_format = WLS[idx][WLS['header'].indexOf(CFG['formatter'])];
      if (!isNaN(idx) && count >= start) {
        var rowidx = parseInt(i) + 1;
        if (current_format == 0) {
          tmp_class = 'd2';
          previous_format = current_format;
        }
        else if (previous_format == 0) {
          tmp_class = 'd0';
          previous_format = current_format;
        }
        else if (current_format != previous_format) {
          if (tmp_class == 'd0') {
            tmp_class = 'd1';
          }
          else {
            tmp_class = 'd0';
          }
          previous_format = current_format;
        }

        text += '<tr class="'+tmp_class+'" id="L_' + idx + '">';
        text += '<td title="Click to add a new line or to remove the current line." onclick="editLine(event,'+
          idx+');" class="ID pointed" title="LINE ' + rowidx + '">' + idx + '</td>';
        for (j in WLS[idx]) {
          var jdx = parseInt(j) + 1;

          var head = WLS['header'][j];
          if (WLS['columns'][head] > 0) { var cell_display = ''; }
          else { var cell_display = ' style="display:none"';  }

          if ([CFG.note_formatter, CFG.formatter, CFG.root_formatter, CFG.pattern_formatter, CFG.quintiles].indexOf(WLS.header[j]) == -1 && WLS.uneditables.indexOf(WLS.header[j]) == -1 && !CFG['publish']) {
            var on_click = 'onclick="editEntry(' + idx + ',' + jdx + ',0,0)" ';
            var on_title = 'title="Modify entry '+idx+'/'+jdx+'." ';
            var on_ctxt = ''; //(j != CFG._morphemes) ? 'oncontextmenu="copyPasteEntry(event,'+idx+','+jdx+','+j+')" ': '';
            var this_class = 'class="'+WLS['header'][j]+'" ';
          }
          else if (WLS.uneditables.indexOf(WLS.header[j]) != -1 || CFG['publish']) {
            var on_click = '';
            var on_title = '';
            var this_class = 'class="uneditable '+WLS['header'][j]+'" ';
            if (WLS.header[j] == CFG.formatter) {
              var on_ctxt = 'oncontextmenu="editGroup(event,\''+WLS[idx][j]+'\')" ';
            }
            else if (WLS.header[j] == CFG.root_formatter) {
              var on_ctxt = 'oncontextmenu="PART.partial_alignment(event,\''+idx+'\')" ';
            }
            else if (WLS.header[j] == CFG.note_formatter) {
              var on_ctxt = 'oncontextmenu="COMMENTS.edit_comment(event,\''+idx+'\')" ';
            }
            else if (WLS.header[j] == CFG.quintiles) {
              var on_ctxt = 'oncontextmenu="UTIL.show_quintuples(event,\''+idx+'\')" ';
            }
            else {
              var on_ctxt = '';
            }
          }
          else {
            var on_click = 'onclick="editEntry(' + idx + ',' + jdx + ',0,0)" ';
            var on_title = 'title="Modify entry '+idx+'/'+jdx+'." ';
            var this_class = 'class="'+WLS['header'][j]+'" ';
            if (WLS.header[j] == CFG.formatter) {
              var on_ctxt = 'oncontextmenu="editGroup(event,\''+WLS[idx][j]+'\')" ';
            }
            else if (WLS.header[j] == CFG.root_formatter) {
              var on_ctxt = 'oncontextmenu="PART.partial_alignment(event,\''+idx+'\')" ';
            }
            else if (WLS.header[j] == CFG.note_formatter) {
              var on_ctxt = 'oncontextmenu="COMMENTS.edit_comment(event,\''+idx+'\')" ';
            }
            else if (WLS.header[j] == CFG.pattern_formatter) {
              var on_ctxt = 'oncontextmenu="COMMENTS.show_pattern(event,\''+idx+'\')" ';
            }
            else if (WLS.header[j] == CFG.quintiles) {
              var on_ctxt = 'oncontextmenu="UTIL.show_quintuples(event,\''+idx+'\')" ';
            }
            else {
              var on_ctxt = '';
            }
          }
          /* format the languages */
          if (j == CFG['_tidx'] && CFG['_subgroup'] > -1){
            taxon_addon = WLS['subgroups'][WLS[idx][j]][1].replace('FFF', WLS['subgroups'][WLS[idx][j]][0].slice(0, 3));
          }
          else {
            taxon_addon = '';
          }
          /* need to escape text-values otherwise messes up HTML */
          var escaped_value = TEXT.escapeValue(WLS[idx][j]);
          var data_value = 'data-value="'+escaped_value+'" ';
          text += '<td ' +
            this_class + 
            on_title +
            on_click +
            on_ctxt + 
            data_value + cell_display+'>'+escaped_value+taxon_addon+'</td>';
        }
        text += '</tr>';
        count += 1;
      }
      else {count += 1;}
      if (count >= start + CFG['preview']) {
        break;
      }
    }
  }
  else {
    for (i in WLS['rows'])  {
      var idx = WLS['rows'][i];
      if (!isNaN(idx) && count >= start) {
        var rowidx = parseInt(i) + 1;
        text += '<tr class="'+tmp_class+'" id="L_' + idx + '">';
        text += '<td title="Click to add a new line or to remove the current line." onclick="editLine(event,'+idx+');" class="ID pointed" title="LINE ' + rowidx + '">' + idx + '</td>';
        for (j in WLS[idx]) {
          var jdx = parseInt(j) + 1;

          var head = WLS['header'][j];
          if (WLS['columns'][head] > 0) {
            var cell_display = '';
          }
          else {
            var cell_display = ' style="display:none"'; // ff vs. chrome problem
          }
          text += '<td class="' + WLS['header'][j] + '" title="MODIFY ENTRY ' + idx + '/' + jdx + '" onclick="editEntry(' + idx + ',' + jdx + ',0,0)" data-value="' + WLS[idx][j] + '" ' + cell_display + '>';
          text += WLS[idx][j];
          text += '</td>';
        }
        text += '</tr>';
        count += 1;
      }
      else {count += 1;}
      if (count >= start + CFG['preview']) {
        break;
      }
    }
  }
  text += '</table>';
  qlc.innerHTML = text;
  qlc.style.display = '';
  document.getElementById('wordlist_help').style.display = 'none';

  var db = document.getElementById('db');

  // modify previous and next
  var previous = document.getElementById('previous');
  if (parseInt(start) - CFG['preview'] >= 0) {
    previous.onclick = function() {showWLS(start - CFG['preview']);};
    var prestart = start - CFG['preview'];
    var startbefore = start - 1;
    previous.value = prestart + '-' + startbefore;
    toggleClasses(['previous'],'hidden','unhidden');
  }
  else {
    toggleClasses(['previous'],'unhidden','hidden');
  }
  var next = document.getElementById('next');
  if (WLS['rows'].length >= start + CFG['preview']) {
    var poststart = start + parseInt(CFG['preview']);
    var postpoststart = start + 2 * parseInt(CFG['preview']) - 1;
    if (postpoststart >= WLS['rows'].length) {
      postpoststart = WLS['rows'].length;
    }
    next.onclick = function() {showWLS(poststart);};
    next.value = poststart + '-' + postpoststart;

    toggleClasses(['next'],'hidden','unhidden');
  }
  else {
    toggleClasses(['next'],'unhidden','hidden');
  }


  var current = document.getElementById('current');
  var following = start + CFG['preview'] - 1;
  if (following >= WLS['rows'].length) {
    following = WLS['rows'].length;
  }
  current.innerHTML = 'Showing ' + start + ' - ' + following + ' of ' + parseInt(WLS['rows'].length) + ' entries';
  toggleClasses(['first','filename','current'],'hidden','unhidden');
  document.getElementById('view').style.display = 'none';
  if (CFG['navbar']) {
    document.getElementById('mainsettings').style.display = 'inline';
  }
  //document.getElementById('filedisplay').style.display = 'block';
  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;' + CFG['filename'] + '&gt;';
  highLight();

  if (CFG['sorted']) {
    //->console.log(CFG['sorted']);
    var tmp = CFG['sorted'].split('_');
    document.getElementById('HEAD_'+tmp.slice(1,tmp.length-1).join('_')).style.backgroundColor = 'Crimson';
    //document.getElementById('HEAD_'+CFG['sorted'].split('_').[1]).style.backgroundColor = 'Crimson';
  }
  if (CFG._selected_concepts.length > 1) {
    document.getElementById('wordlist_current_concept').innerHTML = ''+
      CFG._selected_concepts[0]+', ...';
    CFG._current_concept = CFG._selected_concepts[0];
  }
  else {
    document.getElementById('wordlist_current_concept').innerHTML = CFG._selected_concepts[0] + ' (' +
        WLS['c2i'][CFG._selected_concepts[0]]+'/'+WLS.height+')';
  }
  //document.location.hash = 'qlc';
  return 1;
}

/* function handles copy-pasting of elements */
function copyPasteEntry(event,idx,jdx,j) {

  var cpval = document.getElementById('copy_value');

  /* make everything to false if event is passed as "abort" */
  if (event == 'abort') {
    CFG['_cpentry'] = false;
    cpval.innerHTML = '';
    cpval.style.display = 'none';
    return;
  }

  event.preventDefault();
  if (!CFG['_cpentry']) {
    CFG['_cpentry'] = WLS[idx][j];

    /* manage visual feedback */
    var txt = '<span class="info_mark">?</span><span class="main_handle" style="position:absolute;left:23px;top:8px;"></span>'
      + '<table cellpadding="5"><tr><th colspan="2">CACHED ENTRY</th></tr>'
      + '<tr><td>VALUE</td><td>&quot;'+CFG['_cpentry']+'&quot;</td></tr>'
      + '<td>ROW</td><td>'+idx+'</td></tr><tr><td>CELL</td><td>'+j+'</td></tr>'
      + '<tr><td colspan="2" style="text-align:center">'
      + '<div class="btn-group-vertical"><button onclick="copyPasteEntry(\'abort\')"'
      + ' title="click to abort" class="btn btn-primary submit3"'
      + '>CLEAR CACHE</button>'
      + '<button onclick="showHistory(\''+idx+','+j+'\')"'
      + ' title="show previous versions of this entry"'
      + ' class="btn btn-primary submit3">SHOW HISTORY</button>'
      + '</div>'
      + '</td></tr></table>';

    cpval.innerHTML = txt;
    cpval.style.display = 'table';
    $(cpval).draggable({handle: '.main_handle'});
  }
  else {
    var entry = CFG['_cpentry'];
    CFG['_cpentry'] = false;
    editEntry(idx,jdx,0,0,entry)

      /* remove visual feedback */
      cpval.innerHTML = '';
    cpval.style.display = 'none';

  }
}

/* specific customized functions for adding a column to the wordlist */
function addColumn(event) {
  var col = document.getElementById('add_column');

  if (event.keyCode != 13) {
    return;
  }

  var name = col.value.trim();
  var modify_entry = false;
  name = name.toUpperCase();
  var new_name = [];
  for (i = 0; i < name.length; i += 1){
    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ>".indexOf(name[i]) != -1) {
      new_name.push(name[i]);
    }
  }
  name = new_name.join("");

  var source;

  if (name.indexOf('>') != -1) {
    [source, name] = name.split(">");
    modify_entry = true;
  }

  var idx;
  if (name in WLS['columns'] && modify_entry) {
    console.log(modify_entry);
    var sidx = WLS.header.indexOf(source);
    var nidx = WLS.header.indexOf(name);
    if (modify_entry) {
      for (idx in WLS) {
        if (!isNaN(idx)) {
          WLS[idx][nidx] = WLS[idx][sidx];
        }
      }
      showWLS(getCurrent());
    }
    col.value = "";
    return;
  }
  else if (name in WLS["columns"]) {
    col.value = "";
    return;
  }

  /* modify entries in wordlist */
  var new_val;
  for (idx in WLS) {
    var nidx = WLS.header.indexOf(source);
    if (!isNaN(idx)) {
      if (modify_entry) {
        new_val = WLS[idx][nidx];
      }
      else {
        new_val = "";
      }
      WLS[idx].push(new_val);
    }
  }
  
  /* adjust name to new name */
  var new_name = name.replace(/_/g,'');
  var name_name = name.replace(/_/g, ' ');
  WLS['header'].push(new_name);
  WLS['column_names'][new_name] = name_name;
  WLS['columns'][new_name] = WLS.header.length - 1;
  if (CFG['basics'].indexOf(new_name) == -1) {
    CFG['basics'].push(new_name);
  }

  /* check for alignments */
  var i, entry;
  for (i = 0; entry = ['morphemes', 'alignments', 'cognates', 'roots', 'patterns'][i]; i += 1) {
    if (ALIAS[entry].indexOf(new_name) != -1) {
      CFG['_' + entry] = WLS['header'].indexOf(new_name);
    }
  }

  col.value = '';
  createSelectors();
  showWLS(1);
}

function editEntry(
  idx, jdx, from_idx, from_jdx, special_value) {
  var line = document.getElementById('L_' + idx);

  /* if line is undefined, check for next view */
  if (line == null || typeof line == 'undefined') {
    var ridx = WLS['rows'].indexOf(idx);
    var fidx = WLS['rows'].indexOf(from_idx);
    if (ridx == -1 && fidx == -1) {
      fakeAlert("Error with the IDs, cannot find the correct indices for "+ridx+" and "+fidx);
      return;
    }
    else if (ridx == -1 && fidx == 0) {
      var wlsidx = WLS['rows'].length - CFG['preview'] - 1;
      showWLS(wlsidx);
      editEntry(WLS['rows'][(WLS['rows'].length-1)],jdx,0,0);
      return;
    }
    else if (ridx == -1 && fidx == WLS['rows'].length-1) {
      showWLS(1);
      editEntry(WLS['rows'][0],jdx,0,0);
      return;
    }
    else if (ridx > fidx) {
      var next = document.getElementById('next');
      if (typeof next != 'undefined') {
        var to_idx = parseInt(next.value.split('-')[0]);
        showWLS(to_idx);
        editEntry(idx, jdx, from_idx, from_jdx);
        return;
      }
      else {
        fakeAlert("Error with following entry, it seems to be undefined.");
        return;
      }
    }
    else if (ridx < fidx) {
      var previous = document.getElementById('previous');
      if (typeof previous != 'undefined') {
        var to_idx = parseInt(previous.value.split('-')[0]);
        showWLS(to_idx);
        editEntry(idx, jdx, from_idx, from_jdx);
        return;
      }
      else {
        fakeAlert("Error with preceeding entry, it seems to be undefined.");
      }
    }
    else {
      return;
    }
  }

  var entry = line.childNodes[jdx];

  if (jdx < 1 || jdx - 1 == WLS['header'].length) {
    if (jdx < 1) {
      jdx = WLS['header'].length;
      from_jdx = jdx + 1;
      editEntry(idx, jdx, from_idx, from_jdx);
      return;
    }
    else if (jdx - 1 == WLS['header'].length) {
      jdx = 1;
      from_jdx = 0;
      editEntry(idx, jdx, from_idx, from_jdx);
      return;
    }
  }
  
  /* check for uneditable fields */
  if (entry.className.indexOf('uneditable') != -1) {
    if (from_jdx > jdx) {
      editEntry(idx, jdx-1, from_idx, from_jdx);
    }
    else if (from_jdx < jdx) {
      editEntry(idx, jdx+1, from_idx, from_jdx);
    }
    return;
  }

  /* check for hidden columns and skip them if necessary */
  var col = document.getElementById(entry.className);
  if (col.style.visibility == 'hidden') {
    if (from_jdx > jdx) {
      editEntry(idx, jdx - 1, from_idx, from_jdx);
    }
    else if (from_jdx < jdx) {
      editEntry(idx, jdx + 1, from_idx, from_jdx);
    }
    return;
  }
  
  /* now we format the entry and turn it into a text-input field */
  entry.onclick = '';

  /* check whether special value is submitted or alternatively whether CFG contains 
   * a valid value to be inserted */
  if (typeof special_value == 'undefined') { 
    var value = entry.dataset.value;
    var special_value = entry.dataset.value;
  }
  else {
    var value = entry.dataset.value;
  }
  
  var size = value.length + 5;

  var ipt = document.createElement('input');
  ipt.setAttribute('class', 'cellinput');
  ipt.setAttribute('type', 'text');
  ipt.setAttribute('id', 'modify_' + idx + '_' + jdx);
  ipt.setAttribute('value', special_value);
  ipt.setAttribute('data-value', value);
  ipt.setAttribute('ondblclick', 'modifyEntry("click",'+idx+','+jdx+',this.value)');
  ipt.setAttribute('onblur', 'unmodifyEntry(' + idx + ',' + jdx + ',"' + value + '")');
  ipt.setAttribute('onkeyup', 'modifyEntry(event,' + idx + ',' + jdx + ',this.value)');

  ipt.size = size;
  entry.innerHTML = '';
  entry.appendChild(ipt);
  ipt.focus();

}

/* function modifies entries automatically using undo-redo facility */
function autoModifyEntry(idx, jdx, value, current) {
  
  var tcurrent = parseInt(getCurrent());
  current = parseInt(current);
  
  //-> console.log(current,tcurrent);

  if (tcurrent != current && !isNaN(current)) {
    var tmp = showWLS(current);
  }
  var line = document.getElementById('L_' + idx);
  if (line !== null) {
    var entry = line.childNodes[jdx];
    entry.dataset.value = value;
    entry.innerHTML = value;
    entry.style.border = '1px solid Crimson';
  }
  var j = parseInt(jdx) - 1;
  WLS[idx][j] = value;
  
  /* store modification in case this is possible */
  storeModification(idx, j, value);
  
  highLight();
}

/* function modifies a given entry, at the same time, various checks are carried out
 * e.g., that cogid should be integer, that comments should not have real quotes, etc. */
function modifyEntry(event, idx, jdx, xvalue) {
  
  CFG['entry_is_currently_modifying'] = true;

  var process = false;
  var nxvalue;

  /* get current index in the current view */
  var cdx = WLS['rows'].indexOf(idx);
  var bdx = WLS['rows'][cdx - 1];
  var ndx = WLS['rows'][cdx + 1];
  var j = parseInt(jdx) - 1;

  var entry = document.getElementById('L_' + idx).cells[jdx];
	
  /* move up and down */
  if (event.keyCode == 38) {
    process = true;
    ni = bdx;
    nj = jdx;
  }
  else if (event.keyCode == 40) {
    process = true;
    ni = ndx;
    nj = jdx;
  }
  /* move to left and right */
  else if (event.keyCode == 37 && event.ctrlKey) {
    process = true;
    ni = idx;
    nj = jdx - 1;
  }
  else if (event.keyCode == 39 && event.ctrlKey) {
    process = true;
    ni = idx;
    nj = jdx + 1;
  }
  /* unmodify on escape */
  else if (event.keyCode == 27) {
    CFG['entry_is_currently_modifying'] = false;
    unmodifyEntry(idx, jdx, entry.dataset.value);
    return;
  }
  /* modify on enter */
  else if (event.keyCode != 13 && event != 'click') {
    CFG['entry_is_currently_modifying'] = false; 
    return;
  }

  /* change sampa to ipa if entries are ipa or tokens */
  if (CFG['sampa'].indexOf(entry.className) != -1) {
    xvalue = sampa2ipa(xvalue); 
  }

  /* modify cogid to get unique id if no integer is chosen */
  var reset_format = false;
  if (CFG['formatter'] == entry.className) {
    nxvalue = cognateIdentifier(xvalue, idx);
    reset_format = true;
    if (nxvalue != xvalue) {
      xvalue = nxvalue;
    }
  }
  else if (CFG['root_formatter'] == entry.className) {
    nxvalue = partialCognateIdentifier(xvalue, idx);
    reset_format = true;
    if (nxvalue != xvalue) {
      xvalue = nxvalue;
    }
  }
  /* XXX tokenize entry  */ 
  else if (CFG['highlight'].indexOf(entry.className) != -1) {
    if (xvalue.length > 1 && xvalue[0] == " ") {
      nxvalue = ipa2tokens(xvalue.slice(1, xvalue.length));
      //-> console.log('transforming',xvalue,nxvalue);
      if (nxvalue != xvalue) {
	      xvalue = nxvalue;
      }
    }
  }

  /* tokens -> alignment, this function is important
   * to make sure that all entries in tokens and alignmetns are synchronized
   * tokens2alignment
   */
  if (jdx - 1 == CFG._segments && CFG._alignments != - 1) {
    var new_alm, alm_bunch, cnt, new_alms, new_segments;
    new_segments = xvalue;

    /* iterate over alignment segments */
    if (new_segments.indexOf(" + ") != -1) {
      alm_bunch = WLS[idx][CFG._alignments].split(" + ");
      seg_bunch = new_segments.split(" + ");
      if (alm_bunch.length == seg_bunch.length) {
        new_alms = [];
        for (cnt=0; cnt<alm_bunch.length; cnt++) {
          new_alm = UTIL.tokens2alignment(
            seg_bunch[cnt].split(" "),
            alm_bunch[cnt].split(" "));
          if (new_alm != alm_bunch[cnt]) {
            new_alms.push(new_alm);
          }
          else {
            new_alms.push(alm_bunch[cnt]);
          }
        }
        new_alms = new_alms.join(" + ");
        if (new_alms != WLS[idx][CFG._alignments]) {
          autoModifyEntry(
            idx,
            CFG._alignments+1,
            new_alms,
            WLS[idx][CFG._alignments]);
        }
      }
      /* reset if the entries don't match*/
      else {
        autoModifyEntry(
          idx, 
          CFG._alignments+1,
          new_segments,
          WLS[idx][CFG._alignments]);
      }
    }
    else {
      /* */
      alm = WLS[idx][CFG._alignments].split(' ');
      new_alm = UTIL.tokens2alignment(
        new_segments.split(" "),
        WLS[idx][CFG._alignments].split(" ")
      );
      if (new_alm != WLS[idx][CFG._alignments]){
        autoModifyEntry(
          idx, 
          CFG._alignments+1, 
          new_alm, 
          WLS[idx][CFG._alignments]);
      }
    }
  }
  /* format the languages */
  if (j == CFG['_tidx'] && CFG['_subgroup'] > -1){
    taxon_addon = WLS['subgroups'][WLS[idx][j]][1].replace('FFF', WLS['subgroups'][WLS[idx][j]][0].slice(0, 3));
  }
  else {
    taxon_addon = '';
  }

  var prevalue = entry.dataset.value;
  
  entry.dataset.value = xvalue;

  entry.innerHTML = xvalue;
  entry.onclick = function() {editEntry(idx, jdx, 0, 0)};
  
  /* check whether the value has been modified, if so, change the underlying
   * entry in the big WLS Object */
  if (prevalue != xvalue) {
    undoManager.add({
      undo: function() {autoModifyEntry(idx, jdx, prevalue, current);},
      redo: function() {autoModifyEntry(idx, jdx, xvalue, current);}  
    });
    WLS[idx][(jdx - 1)] = xvalue;
    
    /* trigger store modification in case this is possible for the current session */
    storeModification(idx, (jdx-1), xvalue);
  }
  
  if (process == true) {
    editEntry(ni, nj, idx, jdx);
  }
  highLight();
  
  /* reset format means that we change coloration of entries in the 
   * data representation of the wordlist */
  if (reset_format) {
    var start = '';
    var cclass = 'd1';
    var cogids = document.getElementsByClassName(CFG['formatter']);
    for (var i=0,cogid; cogid=cogids[i]; i++) {
      if (cogid.dataset.value != start) {
        start = cogid.dataset.value;
        if (cclass == 'd1') {
          cclass = 'd0';
        }
        else {
          cclass = 'd1';
        }
      }      
      cogid.parentNode.className = cclass;
    }
    resetFormat(CFG['formatter']);
    resetRootFormat(CFG['root_formatter']);
  }

  if (undoManager.hasUndo() == true) {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }

  CFG['entry_is_currently_modifying'] = false;
}

/* function stores (if possible) a given modification in the project's triple store */
function storeModification(idx, jdx, value, async_) {
  if (typeof async_ == 'undefined') {
    async_ = CFG['async'];
  }

  /* check whether idx, jdx, and value contain multiple entries */
  if (typeof idx == 'number' && typeof jdx == 'number') {
    var idxs = [idx];
    var jdxs = [jdx];
    var values = [value];
  }
  else {
    var idxs = idx;
    var jdxs = jdx;
    var values = value;
  }

  
  /* if storable is set to "true" and we are working with a remote server, 
   * make the modifying ajax-call to ensure that the data has been edited 
   * and stored */
  if (CFG['storable']) {
    var new_url = 'triples/update.py'; //?remote_dbase='+CFG['remote_dbase'] +     
    var ids = [];
    var cols = [];
    var vals = [];

    var i, idx, jdx, val;
    for (i = 0; i < idxs.length; i += 1) {
      /* get the three values from the arrays */
      idx = idxs[i];
      jdx = jdxs[i];
      val = values[i];

      ids.push(idx);
      cols.push(WLS.column_names[WLS.header[jdx]].replace(/ /g,'_'));
      vals.push(encodeURIComponent(val));

      if (CFG['update_mode'] == 'save') {
        /* add two ids, very simple */
        ids.push(idx);
        ids.push(idx);
        
        /* add the column names */
        cols.push('CONCEPT');
        cols.push('DOCULECT');
        
        /* add the values */
        vals.push(WLS[idx][CFG['_cidx']]);
        vals.push(WLS[idx][CFG['_tidx']]);
      }
    }

    $.ajax({
      async: CFG['async'],
      type: "POST",
      contentType: "application/text; charset=utf-8",
      url: new_url,
      dataType: "text",
      data: {
        "ids": ids.join("|||"), 
        "cols": cols.join("|||"), 
        "vals": vals.join("|||"), 
        "remote_dbase": CFG["remote_dbase"], 
        "file": CFG["filename"], 
        "update": true
      }, 
      success: function(data) {
        if(data.indexOf("UPDATE") != -1) {
          dataSavedMessage("update");
        }
        else if(data.indexOf("INSERTION") != -1) {
          dataSavedMessage("insertion");
        }
        else {
	        fakeAlert("PROBLEM IN SAVING THE VALUE ENCOUNTERED! «" + new_url+'»');
	      }
      },
      error: function(a, b, c) {
        console.log("error", a, b, c);
        fakeAlert('data could not be stored '+new_url);
      }
    });
  }
}

/* revert a given entry to its original value */
function unmodifyEntry(idx, jdx, xvalue)
{
  /* check whether key is currently modified to prevent that the onblur-event 
   * pre-catches the real modifying event */
  if (CFG['entry_is_currently_modifying']) {
    return;
  }
  var entry = document.getElementById('L_' + idx).cells[jdx];
  var value = xvalue; //entry.innerText;
  entry.onclick = function() {editEntry(idx, jdx, 0, 0)};
  var j = parseInt(jdx) - 1;
  WLS[idx][j] = value;
  /* check for taxa */
  if (jdx-1 == CFG['_tidx'] && CFG['_subgroup'] > -1){
    taxon_addon = WLS['subgroups'][WLS[idx][CFG['_tidx']]][1].replace('FFF', WLS['subgroups'][WLS[idx][CFG['_tidx']]][0].slice(0, 3));
  }
  entry.innerHTML = '';
  entry.innerHTML = value;
  highLight();
}

function filterColumnValue(event) {
  if(event.keyCode != 13) {
    return;
  }
  applyFilter();
  showWLS(getCurrent());
}

function applyFilter(){
  /* get filters for taxa */
  var tid = document.getElementById('select_doculects');
  var tlist = [];
  for (var i=0,option; option=tid.options[i]; i++) {
    if (option.selected) {
      tlist.push(option.value);
    }
  }

  /* check for empty selection, we need to guarantee that at least
   * one taxon has been selected */
  if (tlist.length == 0) {
    tlist = CFG['sorted_taxa'];
    
    if (CFG['tc_status'] != 'not' && CFG['tc_status'] != 'notc') {
      $('#select_doculects').multiselect('select',tlist);
    }
  }
  /* sort, following predefined order */
  tlist.sort(function (x, y) {
    idxA = CFG.sorted_taxa.indexOf(x);
    idxB = CFG.sorted_taxa.indexOf(y);
    if (idxA == idxB) {
      return 0;
    }
    else if (idxA > idxB) {
      return 1;
    }
    else {
      return -1;
    }
  });
  CFG['_selected_doculects'] = tlist;

  var trows = [];
  for (var i=0,taxon; taxon=tlist[i]; i++) {
    trows.push.apply(trows, WLS['taxa'][taxon]);
  }

  /* get filters for concepts */
  var cid = document.getElementById('select_concepts');
  var clist = [];
  for (var i=0,option; option=cid.options[i]; i++) {
    if (option.selected) {
      clist.push(option.value);
    }
  }
  
  /* make sure list is not empty to avoid that nothing is selected */
  if (clist.length == 0) {
    clist = CFG.sorted_concepts;
    if (CFG['tc_status'] != 'noc' && CFG['tc_status'] != 'notc') {
      $('#select_concepts').multiselect('select',clist);
    }
  }

  CFG['_selected_concepts'] = clist;

  var crows = [];
  for (var i=0,concept; concept=clist[i]; i++) {
    crows.push.apply(crows, WLS['concepts'][concept]);
  }

  /* get filters for columns (fields) */
  var fid = document.getElementById('select_columns');
  var flist = [];
  for (var i=0,option; option=fid.options[i]; i++) {
    if (option.selected) {
      flist.push(option.value);
    }
  }
  CFG['basics'] = flist; /* reassign basics to make sure it is stored */

  /* check for empty list of columns, if this is given, we
   * select all columns in basics */
  if (flist.length == 0) {
    for (var i=0,basic; basic=CFG.basics[i]; i++) {
      if (WLS.header.indexOf(basic) != -1) {
        flist.push(basic);
      }
    }
    $('#select_columns').multiselect('deselectAll',false);
    $('#select_columns').multiselect('select',flist);
  }
  
  /* handle custom filters */
  var custom = document.getElementById('filter_all');
  var arows = [];
  var alist = custom.value;

  /* now it starts */
  if (alist.replace(/\s*/,'') != '') {
    if (alist.indexOf('==') != -1) {
      var keyval = alist.split(/\s*==\s*/);
      var key = keyval[0].toUpperCase();
      var val = keyval[1];
      var compare = 'identical';
    }
    else if (alist.indexOf('=') != -1) {
      var keyval = alist.split(/\s*=\s*/);
      var key = keyval[0].toUpperCase();
      var val = keyval[1];
      var compare = 'similar';
    }
    else 
    {
      var compare = 'error';
    }
    
    if (compare != 'error') {
      for (var i=0; i < WLS._trows.length;i++) {
        var idx = WLS._trows[i];
        
        var value = WLS[idx][WLS.header.indexOf(key)];
        if (typeof value == 'undefined') {
          fakeAlert("The values specified in the custom filter are erroneous.");
          custom.value = '';
          break;
        }
        if (compare == 'identical' && value == val) {
          arows.push(idx);
        }
        else if (compare == 'similar' && value.indexOf(val) != -1) {
          arows.push(idx);
        }
      }
    }
    else {
      fakeAlert("The values specified in the custom filter are erroneous.");
      custom.value = '';
    }
    
    if (custom.value == '') {
      arows = WLS._trows.slice();
    }
  }
  
  /* handle filtering of columns */
  for (i in WLS['header']) {
    var head = WLS['header'][i];
    if (flist.indexOf(head) != -1) {
      WLS['columns'][head] = Math.abs(WLS['columns'][head]);
    }
    else {
      WLS['columns'][head] = -Math.abs(WLS['columns'][head]);
    }
  }

  /* sort both lists */
  trows.sort(function(x, y) {return x - y});
  console.log(trows);
  crows.sort(function(x, y) {return x - y});
  if (arows.length > 0){
    arows.sort(function(x, y) {return x - y});}

  /* function taken from http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript */
  function intersection_destructive(a, b){
    var result = new Array();
    while (a.length > 0 && b.length > 0) {
       if (a[0] < b[0]) { a.shift(); }
       else if (a[0] > b[0]) { b.shift(); }
       else /* they're equal */{
         result.push(a.shift());
         b.shift();}}
    return result;
  }

  var rows = intersection_destructive(trows, crows);
  if (arows.length > 0){
    rows = intersection_destructive(rows, arows);}

  //->console.log('applyFilter6:',rows);

  if (rows.length < 1) {
    fakeAlert("No entries matching your filter criteria could be found. All filters will be reset.");
    custom.value = '';
    applyFilter();
  }
  else {

    sort_rows = function (x,y){
      var _x = WLS[x][CFG['_cidx']] + ' ' + WLS[x][CFG['_tidx']];
      var _y = WLS[y][CFG['_cidx']] + ' ' + WLS[y][CFG['_tidx']];
      return _x.localeCompare(_y);
    }
    WLS['rows'] = rows.sort(sort_rows);
  }
  console.log('applied filter');
}

/* filter the columns in the data */
function filterColumns(column)
{

  var columns = document.getElementById('columns');

  if (columns.value.indexOf(column) != -1) {
    columns.value = columns.value.replace(column + ', ', '');
  }
  else {
    columns.value += column + ', ';
  }

  applyFilter();
  showWLS(getCurrent());
}

/* function returns the current index of the wordlist display, note 
 * that this function is potentially dangerous, since it may return
 * erroneous indices if the wordlist display has changed its size, so
 * we probably should disable it for the moment and just show the very 
 * first index whenever it is called */
function getCurrent()
{
  var previous = document.getElementById('previous');
  var current_index = 1;
  if (previous === null) {
    current_index = 1;
  
  CFG['_cognates'] = CFG['_fidx'];}
  else {
    current_index = parseInt(previous.value.split('-')[1]) + 1;
  }
  return current_index;
}

/* file-handler function from http://www.html5rocks.com/de/tutorials/file/dndfiles/ */
function handleFileSelect(evt) 
{
  var files = evt.target.files; /* FileList object */
  var file = files[0];
  
  reset();
  
  CFG['filename'] = file.name;
  CFG['load_new_file'] = true;
  localStorage.filename = file.name;
  STORE = '';

  /* create file reader instance */
  var reader = new FileReader({async: false});
  reader.onload = function(e) {STORE = reader.result;};
  reader.readAsText(file);

  /* modify this part !!! */
  var modify = ['view'];
  for (i in modify) {
    tmp = document.getElementById(modify[i]);
    tmp.style.display = 'block';
  }
  var modify = ['first', 'previous', 'next', 'current',];
  for (i in modify) {
    $('#' + modify[i]).removeClass('unhidden');
    $('#' + modify[i]).addClass('hidden');
  }
  document.getElementById('qlc').innerHTML = '';

  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;' + CFG['filename'] + '&gt;';
  
  /* toggle display if the wordlist is not hidden */
  var fd = document.getElementById('filedisplay');
  if (fd.style.display != 'none' && fd.style.display != ''){
    toggleDisplay(evt, 'filedisplay');
  }
}

/* this function actually writes the whole wordlist to file, so it does 
 * not refresh it but rather prepares it for writing...*/
function refreshFile(){
  var text = 'ID';
  var i, j, idx, key, head, concept, tmp, val;

  for (i = 0; head=WLS['header'][i]; i += 1) {
    if (WLS['uneditables'].indexOf(head) != -1) {
      text += '\t_' + WLS.column_names[head].replace(/ /g,'_');
    }
    else {
      text += '\t' + WLS.column_names[head].replace(/ /g,'_');
    }
  }
  text += '\n';
  for (concept in WLS['concepts']) {
    for (i in WLS['concepts'][concept]) {
      idx = WLS['concepts'][concept][i];

      if (!isNaN(idx)) {
	text += idx;
	for (j = 0; head=WLS['header'][j]; j += 1) {
	  text += '\t' + WLS[idx][j];
	}
	text += '\n';
      }
    }
  }
  CFG.display = [];
  for (i = 0; i < CFG.loaded_files.length; i += 1) {
    if (document.getElementById(CFG.loaded_files[i]).style.display != 'none'){
      CFG.display.push(CFG.loaded_files[i]);
    }
  }
  for (i = 0; key = UTIL.settable.lists[i]; i += 1) {
    text += '#@' + key + '=' + CFG[key].join('|') + '\n';
  }
  for (i = 0; key=UTIL.settable.items[i]; i += 1) {
    text += '#@'+key+'='+CFG[key]+'\n';
  }
  for (i = 0,key; key=UTIL.settable.dicts[i]; i += 1) {
    text += '#@' + key + '=';
    tmp = [];
    for (val in CFG[key]) {
      tmp.push(key + ':' + CFG[val]);
    }
    text += tmp.join('|')+'\n';
  }


  STORE = text;
  WLS['edited'] = true;
  localStorage.text = text;
  localStorage.filename = CFG['filename'];
  toggleClasses(['undo','redo'],'unhidden','hidden');
  undoManager.clear();
  showWLS(getCurrent());
  
}

function fakeAlert(text){
  var falert = document.createElement('div');
  falert.id = 'fake';
  var text = '<div class="message"><p>' + text + '</p>';
  text += '<div class="btn btn-primary okbutton" onclick="' + "$('#fake').remove(); document.onkeydown = function(event){basickeydown(event)};" + '")> OK </div></div>';
  falert.className = 'fake_alert';

  document.body.appendChild(falert);
  falert.innerHTML = text;
  document.onkeydown = function(event){$('#fake').remove(); document.onkeydown = function(event){basickeydown(event);};};
}

/* basic function for modifying lines */
function editLine(event, rowidx) {
  event.preventDefault();
   
  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';

  var text = '<div class="message"><p>What do you want to do?</p>';
  text += '<p>';
  text += '<button class="btn btn-submit submit3 mright" onclick="deleteLine('+rowidx+');">DELETE ROW</button>';
  text += '<button class="btn btn-submit submit3 mright" onclick="addLine('+rowidx+');">ADD ROW AFTER</button>';
  text += '<button class="btn btn-submit submit3 mright" onclick="$(\'#editmode\').remove();">CANCEL</button>';
  text += '</p>';
  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editmode').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  }; 
}

/* function deletes a given line by removing it from all references */
function deleteLine(rowidx) {
  
  /* get index of item in rowns array */
  var index_in_row = WLS.rows.indexOf(rowidx);
  WLS.rows.splice(index_in_row, 1);

  /* get index of item in taxon array */
  var taxon = WLS[rowidx][CFG['_tidx']];
  var index_in_row = WLS.taxa[taxon].indexOf(rowidx);
  WLS.taxa[taxon].splice(index_in_row, 1);

  /* get index of iten in concepts array */
  var concept = WLS[rowidx][CFG['_cidx']];
  var index_in_row = WLS.concepts[concept].indexOf(rowidx);
  WLS.concepts[concept].splice(index_in_row, 1);
  
  /* finally delete the full entry from the WLS object */
  delete WLS[rowidx];

  if (CFG['storable']) {

    /* create url first */
    var new_url = 'triples/update.py?' + 
      'remote_dbase='+CFG['remote_dbase'] + 
      '&file='+CFG['filename'] +
      '&delete=true' + 
      '&ID='+rowidx;

    $.ajax({
      async: true,
      type: "GET",
      contentType: "application/text; charset=utf-8",
      url: new_url,
      dataType: "text",
      success: function(data) {
	      dataSavedMessage('deletion', rowidx);
      },
      error: function() {
        fakeAlert('data could not be stored');
      }
    });
  }
  else {
    console.log('storable failed somehow %o',CFG['storable']);
  }

  resetFormat(CFG['formatter']);
  
  $('#editmode').remove();

  showWLS(getCurrent());
}

/* function adds a new line right behind the given index */
function addLine(rowidx) {
  /* in order to prevent confusion, we always add indices to the top, 
   * that is, we search for the highest current index, and add a new
   * one for it, this is not save in terms of tracking changes, if we
   * add many new entries and remove them afterwards, but currently, 
   * I don't know how to manage this otherwise.
   * For remote sessions, we can always go through data and history and
   * request the information, so here we are save regarding the consistency
   * of IDs being assigned ot the data.
   */
  if (!CFG['storable']) {
    var current_rows = [];
    for (key in WLS) {
      if (!isNaN(parseInt(key))) {
        current_rows.push(parseInt(key));
      }
    }
    current_rows.sort(function (x,y){return x - y;});
    var maxInt = current_rows[current_rows.length-1];
    var newIdx = maxInt + 1;
  }
  else {
    /* create url first */
    var new_url = 'triples/new_id.py';
    var postdata = {
      'file' : CFG['filename'],
      'remote_dbase': CFG['remote_dbase'], 
      'new_id' : 'true'
    };
    var newIdx = 0;
    
    $.ajax({
      async: false,
      type: "POST",
      data: postdata,
      contentType: "application/text; charset=utf-8",
      url: new_url,
      dataType: "text",
      success: function(data) {
	      newIdx = parseInt(data);
      },
      error: function() {
        fakeAlert('data could not be stored');
      }
    });
  }
  
  /* now that we received the new index, we can go on by defining new 
   * contents, here, we should insist on a specific taxon and a specific 
   * meaning, and we add them suggestively, but the user can modify 
   * afterwards */
  var taxon = WLS[rowidx][CFG['_tidx']];
  var concept = WLS[rowidx][CFG['_cidx']];
  var text = '<div class="message">';
  text += '<p>Please select doculect and concept for the new entry ('+newIdx+'):</p>';
  text += '<p>';
  text += '<label style="min-width:100px">Doculect</label> <input id="addline_taxon" class="form-control textfield mleft" type="text" value="'+taxon+'" /><br><br>';
  text += '<label style="min-width:100px">Concept</label> <input id="addline_concept" class="form-control textfield mleft" type="text" value="'+concept+'" /><br><br>';
  text += '<button onclick="finishAddLine('+newIdx+');" class="btn submit3 btn-submit mright">SUBMIT</button>';
  text += '<button onclick="$(\'#editmode\').remove();" class="btn submit3 btn-submit mright">CANCEL</button>';
  text += '</p></div>';
  $('#editmode').remove();

  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';

  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    
    if (event.keyCode == 27) {
      $('#editmode').remove(); 
      document.onkeydown = function(event) {
        basickeydown(event);
      };
    }
  }; 

  $('#addline_taxon').autocomplete({
    delay: 0,
    source: CFG.ordered_taxa
  });
  $('#addline_concept').autocomplete({
    delay: 0,
    source: CFG.ordered_concepts
  });
}

/* due to the interactive component, we need to add a funciton that finalizes
 * the adding of a new line to the data */
function finishAddLine(new_idx) {
  
  /* get concept and taxon */
  var taxon = document.getElementById('addline_taxon').value;
  var concept = document.getElementById('addline_concept').value;
  
  /* check if taxon and concept are in the original list */
  if (!(taxon in WLS.taxa)) {
    fakeAlert('The doculect you selected does not occur in the list!');
    $('#editmode').remove();
    return;
  }
  if (!(concept in WLS.concepts)) {
    fakeAlert('The concept you selected does not occur in the list!');
    $('#editmode').remove();
    return;
  }

  /* add the new entry if everything is fine */
  WLS[new_idx] = [];
  for (var i=0, headline; headline=WLS.header[i]; i++) {
    if (headline.indexOf('ID') == headline.length -2) {
      WLS[new_idx].push(0);
    }
    else {
      WLS[new_idx].push('');
    }
  }
  WLS[new_idx][CFG['_tidx']] = taxon;
  WLS[new_idx][CFG['_cidx']] = concept;

  /* resort the concept array and the like */
  WLS.concepts[concept].push(new_idx);
  WLS.taxa[taxon].push(new_idx);

  /* add the stuff to trows */
  WLS._trows.push(new_idx);

  applyFilter();
  
  /* reset format */
  resetFormat(CFG['formatter']);

  /* if storable is set to "true" and wer are working with a remote server, 
   * make the modifying ajax-call to ensure that the data has been edited 
   * and stored */
  if (CFG['storable']) {
    //->console.log('encountered storable stuff');

    /* create url first */
    var new_url1 = 'triples/update.py?' + 
      'file='+CFG['filename'] +
      '&remote_dbase='+CFG['remote_dbase'] + 
      '&update=true' + 
      '&ids='+new_idx +
      '&cols='+ WLS.column_names[WLS.header[CFG['_tidx']]].replace(/ /g,'_') +
      '&vals='+taxon;
    var new_url2 = 'triples/update.py?' + 
      'file='+CFG['filename'] +
      '&remote_dbase='+CFG['remote_dbase'] + 
      '&update=true' + 
      '&ids='+new_idx +
      '&cols='+ WLS.column_names[WLS.header[CFG['_cidx']]].replace(/ /g,'_') +
      '&vals='+concept;
    console.log(new_url1, new_url2, taxon, concept, new_idx);

    $.ajax({
      async: true,
      type: "GET",
      contentType: "application/text; charset=utf-8",
      url: new_url1,
      dataType: "text",
      success: function(data) {
        if(data.indexOf("UPDATE") != -1) {
          dataSavedMessage("update");
        }
        else if(data.indexOf("INSERTION") != -1) {
          dataSavedMessage("insertion");
        }
	      else {fakeAlert(data)};
      },
      error: function() {
        fakeAlert('data could not be stored');
      }
    });
    $.ajax({
      async: true,
      type: "GET",
      contentType: "application/text; charset=utf-8",
      url: new_url2,
      dataType: "text",
      success: function(data) {
        if(data.indexOf("UPDATE") != -1) {
          dataSavedMessage("update");
        }
        else if(data.indexOf("INSERTION") != -1) {
          dataSavedMessage("insertion");
        }
      },
      error: function() {
        fakeAlert('data could not be stored');
      }
    });
  }
  
  showWLS(getCurrent());
  $('#editmode').remove();
}

/* save file */
function saveFile() {
  refreshFile();
  var blob = new Blob([STORE], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, CFG['filename']);
}


/* save file for server */
function saveFileInPython() { 
  refreshFile();
  var filename = (CFG["filename"].slice(CFG["filename"].length - 4, CFG["filename"].length) != ".tsv") 
    ? CFG["filename"] + ".tsv" 
    : CFG["filename"];
  $.ajax({
    async: true,
    type: "POST",
    contentType: "application/text; charset=utf-8",
    url: "download.py",
    data: {"file": filename, "data": STORE},
    dataType: "text",
    success: function(data) {
      if(data.indexOf("success") != -1) {
        fakeAlert("Data written to file «" + filename + "».");
      }
      else {
        fakeAlert("failed");
      }
    },
    error: function(a, b, c) {
      console.log("error", a, b, c);
      fakeAlert('data could not be stored' + c);
    }
  });
}

function saveTemplate()
{
  /* disallow saving when document was not edited */
  if (!CFG['template']) {
    fakeAlert('You need to create a template before you can download it.');
    return;
  }

  //var store = document.getElementById('store');
  var blob = new Blob([CFG['template']], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, 'template.tsv');
}

/* save one alignment from the data into file */
function saveAlignment(idx)
{
  /* check for valid alignment first */
  if (!CFG['_alignment']) {
    fakeAlert("No valid alignment was specified.");
    return;
  }
  var blob = new Blob([CFG['_alignment']],{type: 'text/plain;charset=utf-8'});
  saveAs(blob, CFG['filename'].replace('.tsv','_'+idx+'_.msa'));
}

function getDate(with_seconds) {
  if (typeof with_seconds == 'undefined') {
    with_seconds = false;
  }
  
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  var hh = today.getHours();
  var mins = today.getMinutes();
  if (with_seconds) {
    var secs = today.getSeconds();
  }

  if (dd < 10) {
      dd = '0' + dd;
  }

  if (mm < 10) {
      mm = '0' + mm;
  }

  today = [yyyy, mm, dd].join('-') + ' ' + hh + ':' + mins;
  if (with_seconds) {
    today += '.'+secs;
  }
  return today;
}

/* highlight all IPA entries which are specified as such */
function highLight()
{
  var items, i, tokens, roots, word, m, concepts, concept, morphemes, parts, part, j, textout, k, morph;

  for (i = 0; head = WLS.header[i]; i += 1) {
    if (CFG['highlight'].indexOf(head) != -1 ) {
      tokens = document.getElementsByClassName(head);
      for (j=0; j<tokens.length; j++) {
        if (tokens[j].innerHTML == tokens[j].dataset.value) {
          word = plotWord(tokens[j].dataset.value);
          tokens[j].innerHTML = '<div class="lock_alignment">'+word+"</div>";
        }
      }
    }
    else if (i === CFG['_roots']){
      roots = document.getElementsByClassName(head);
      for (j = 0; j < roots.length; j += 1){
        if (roots[j].innerHTML == roots[j].dataset.value){
          parts = roots[j].dataset.value.split(/\s+/);
          textout = [];
          if (parts.length > 0) {
            for (k = 0; k < parts.length; k += 1) {
              part = WLS.roots[parts[k]];
              if (typeof part != 'undefined'){
                if (part.length == 1){
                  textout.push('<span class="cognate singleton">'+parts[k]+'</span>');
                }
                else {
                  concepts = [];
                  for (m=0; m<WLS.roots[parts[k]].length; m++) {
                    concept = WLS[WLS.roots[parts[k]][m][0]][CFG._cidx];
                    if (concepts.indexOf(concept) == -1){
                      concepts.push(concept);
                    }
                  }
                  if (concepts.length > 1){
                    textout.push('<span class="cognate polysem">'+parts[k]+'<sup>'+WLS.roots[parts[k]].length+'</sup></span>');
                  }
                  else {
                    textout.push('<span class="cognate">'+parts[k]+'<sup>'+WLS.roots[parts[k]].length+'</sup></span>');
                  }
                }
              }
              else {
                textout.push('<span class="zero">'+parts[k]+'</span>');
              }
            }
            roots[j].innerHTML = textout.join(' ');
          }
        }
      }
    }
    else if (i === CFG['_cognates']){
      roots = document.getElementsByClassName(head);
      for (j=0; j<roots.length; j++){
        if (roots[j].innerHTML == roots[j].dataset.value){
          k = roots[j].dataset.value;
          textout = '';
          if (typeof WLS.etyma[k] != 'undefined' && WLS.etyma[k].length == 1){
            textout = '<span class="cognate singleton">'+k+'</span>';
          }
          else if (typeof WLS.etyma[k] != 'undefined'){
            textout = '<span class="cognate">'+k+'<sup>'+WLS.etyma[k].length+'</sup></span>';
          }
          else {
            textout = '<span class="zero">'+k+'</span>';
          }
          roots[j].innerHTML = textout;
        }
      }
    }

    else if (i === CFG['_morphemes']) {
      morphemes = document.getElementsByClassName(head);
      for (j=0; j < morphemes.length; j++) {
        if (morphemes[j].innerHTML == morphemes[j].dataset.value) {
          parts = morphemes[j].dataset.value.split(/\s+/);
          textout = [];
          for (k=0;k<parts.length; k++) {
            morph = (parts[k] && parts[k][0] != '?') 
              ? ((parts[k][0] != '_') ? '<span title="right-click to toggle" oncontextmenu="MORPH.toggle(event, this);" class="morpheme pointed">'+parts[k]+'</span>' : '<span title="right-click to toggle" oncontextmenu="MORPH.toggle(event, this);" class="morpheme-small pointed">'+parts[k].replace(/^_/, '')+'</span>')
              : '<span class="morpheme-error">'+parts[k]+'</span>'
            ;
            textout.push(morph);
          }
          morphemes[j].innerHTML = textout.join('<span class="small" style="display:table-cell">+</span>');
        }
      }
    }
    else if (i === CFG['_glottolog']) {
      items = document.getElementsByClassName(head);
      for (j=0; item=items[j]; j++) {
        if (item.innerHTML == item.dataset.value) {
          item.innerHTML = '<a class="outlink" href="http://glottolog.org/resource/languoid/id/'+item.dataset.value+'" target="_blank">'+item.dataset.value+'</a>';
	        item.oncontextmenu = function (){};
        }
      }
    }
    else if (i === CFG['_concepticon']) {
      items = document.getElementsByClassName(head);
      for (j=0; item=items[j]; j++) {
        if (item.innerHTML == item.dataset.value) {
          item.innerHTML = '<a class="outlink" href="http://concepticon.clld.org/parameters/'+item.dataset.value+'" target="_blank">'+item.dataset.value+'</a>';
	  item.oncontextmenu = function (){};
        }
      }
    }
    else if (i === CFG['_sources']) {
      items = document.getElementsByClassName(head);
      for (j=0; item=items[j]; j++) {
        if (item.innerHTML == item.dataset.value) {
	        if (item.dataset.value.indexOf(':bib:') != -1) {
	          item.innerHTML = item.dataset.value.replace(/:bib:([0-9A-Za-z\-]+)/g,'<a class="outlink" href="http://bibliography.lingpy.org?key=$1">$1</a>');
	          item.oncontextmenu = function (){};
          }
        }
      }
    }
    else if (i === CFG['_note']) {
      items = document.getElementsByClassName(head);
      for (j=0; item=items[j]; j++) {
        if (item.innerHTML == item.dataset.value) {
          item.innerHTML = '<span class="comment">'+COMMENTS.markdown(TEXT.encodeComments(
            item.dataset.value))+'</span>';
        }
      }
    }
    else if (i === WLS.columns[CFG.quintiles]-1) {
      items = document.getElementsByClassName(head);
      for (j=0; item=items[j]; j++) {
        if (item.innerHTML == item.dataset.value) {
          tokens = item.dataset.value.split(' ');
          morphemes = [];
          for (k=0; k<tokens.length; k++) {
            if (tokens[k] == '?') {
              morphemes.push("??");
            }
            else {
              morphemes.push(tokens[k].split('|')[0]);
            }
          }
          item.innerHTML = plotWord(morphemes.join(' '));
        }
      }
    }
    else {}
  }
}

/* sort the table according to specific criteria */
function sortTable(event,head)
{
  sort_rows = function (x,y){
    var _x = WLS[x][CFG['_cidx']] + ' ' + WLS[x][CFG['_tidx']];
    var _y = WLS[y][CFG['_cidx']] + ' ' + WLS[y][CFG['_tidx']];
    return _x.localeCompare(_y);
  }
  
  if (CFG['sorted'] == 'th_'+head+'_0') {
    WLS['rows'].sort(sort_rows);
    CFG['sorted'] = false;
  }
  else if (CFG['sorted'] == 'th_'+head+'_1') {
    var rows = WLS.rows.slice();

    WLS['rows'] = rows.sort(
        function(x,y)
        {
          var a = WLS[x][WLS.header.indexOf(head)];
          var b = WLS[y][WLS.header.indexOf(head)];
          var c = parseInt(a);
          var d = parseInt(b);

          if (!isNaN(c) && !isNaN(d)) {
            return d - c;
          }
          else {
            return b.localeCompare(a);
          }
        }
        );
    CFG['sorted'] = 'th_'+head+'_0';
  }
  else {
    var rows = WLS.rows.slice();

    WLS['rows'] = rows.sort(
        function(x,y)
        {
          var a = WLS[x][WLS.header.indexOf(head)];
          var b = WLS[y][WLS.header.indexOf(head)];
          var c = parseInt(a);
          var d = parseInt(b);

          if (!isNaN(c) && !isNaN(d)) {
            return c - d;
          }
          else {
            return a.localeCompare(b);
          }
        }
        );
    CFG['sorted'] = 'th_'+head+'_1';
  }
  showWLS(1);
}

function editGroup(event, idx) {
  /* function handles the display of alignments */

  var X, Y, i, r, alm, this_idx, fall_back, seq_idx;

  event.preventDefault();
  
  /* check for various data, consider using switch statement here */
  if (idx == 0 || idx == '') {
    fakeAlert("This entry cannot be edited, since it is not related to any other entry.");
    return;
  }

  /* check for proper values to be displayed for alignment analysis */
  var rows = WLS['etyma'][idx];

  /* sort the rows */
  rows.sort(function (x, y) {
    X = WLS[x][CFG._tidx];
    Y = WLS[y][CFG._tidx];
    if (CFG.sorted_taxa) {
      return CFG.sorted_taxa.indexOf(X) - CFG.sorted_taxa.indexOf(Y);
    }
    return (X < Y) ? -1 : (X < Y) ? 1 : 0;
  });

  /* check for proper alignments first */
  if (CFG['_alignments'] != -1) {
    this_idx = CFG['_alignments']; 
    fall_back = CFG['_segments']; 
  }
  else if (CFG['_segments'] != -1) { 
    this_idx  = CFG['_segments']; 
    fall_back = CFG['_transcriptions'];
  }
  else if (CFG['_transcriptions'] != -1) {
    this_idx = CFG['_transcriptions'];
  }
  else {
    fakeAlert('No phonetic entries were specified in the data.');
    return;
  }

  /* check for sequence index */
  if (CFG['_segments'] != -1) {
    seq_idx = CFG['_segments'];
  }
  else if (CFG['_transcriptions'] != -1) {
    seq_idx = CFG['_transcriptions'];
  }

  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';


  var alms = [];
  var langs = [];
  var blobtxt = '';

  CFG['_current_alms'] = [];
  CFG['_current_taxa'] = [];
  CFG['_current_idx'] = rows;
  CFG['_current_seqs'] = [];
  
  var current_line, this_seq, lang;

  /* now create an alignment object */
  for (i=0; r=rows[i]; i++) {
    
    current_line = WLS[r][this_idx];
    if(!current_line) {
      current_line = WLS[r][fall_back];
    }
    /* add stuff to temporary container for quick alignment access */
    CFG['_current_alms'].push(current_line.split(' '));
    CFG['_current_taxa'].push(WLS[r][CFG['_tidx']]);

    /* add sequence data to allow for automatic alignment */
    this_seq = WLS[r][seq_idx];
    if (!this_seq) {
      this_seq = current_line;
    }
    if (this_seq.indexOf(' ') == -1) {
      CFG['_current_seqs'].push(this_seq.split());
    }
    else {
      CFG['_current_seqs'].push(this_seq.split(' '));
    }

    alm = plotWord(current_line, "td");
    //console.log("alm", alm);
    lang = WLS[r][CFG['_tidx']];
    if (WLS['subgroups'][lang] != 'NAN'){
      taxon_addon = ' ('+WLS['subgroups'][WLS[r][CFG['_tidx']]][0].slice(0, 3)+') '; 
    }
    else {
      taxon_addon = "";
    }

    /* only take those sequences into account which are currently selected in the alignment */
    /* span +++ todo error here +++ */
    if (CFG['_selected_doculects'].indexOf(lang) != -1 || CFG['align_all_words'] != "false") {
      alms.push('<td class="alm_taxon">' + lang + taxon_addon +'</td>'+alm);
      blobtxt += r+'\t'+lang+'\t'+WLS[r][this_idx].replace(new RegExp(' ','gi'),'\t')+'\n';
    }
  }
  CFG['_alignment'] = blobtxt;
  
  if (alms.length == 1) {
    fakeAlert(CFG['formatter']+' &quot;'+idx+'&quot; links only one entry.');
    return;
  }
  var text = '<div class="edit_links" id="editlinks">';
  text += '<p>';
  text += '<span class="main_handle pull-left" style="margin-left:-7px;margin-top:2px;" ></span>';
  text += CFG['formatter'] + ' &quot;'+idx+'&quot; links the following '+alms.length+' entries:</p>';
  text += '<div class="alignments" id="alignments"><table onclick="fakeAlert(\'Press on EDIT or ALIGN to edit the alignments.\');">';
  for (i=0;alm=alms[i];i++) {
    text += '<tr>'+alm+'</tr>';
  }
  text += '</table></div>';
  text += '<div class="submitline">';
  text += '<input id="edit_alignment_button" class="btn btn-primary submit" type="button" onclick="editAlignment()" value="EDIT" /> ';
  text += '<input id="automatic_alignment_button" class="btn btn-primary submit" type="button" onclick="automaticAlignment();" value="ALIGN" /> ';
  text += '<input id="submit_alignment_button" class="btn btn-primary submit hidden" type="button" onclick="$(\'#popup_background\').show();storeAlignment();$(\'#popup_background\').fadeOut();ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="SUBMIT" /> '; 
  text += '<input class="btn btn-primary submit" type="button" onclick="saveAlignment('+idx+')" value="EXPORT" /> ';
  text += '<input class="btn btn-primary submit" type="button" onclick="ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="CLOSE" /></div><br><br> ';
  text += '</div> ';

  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editmode').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  };

  $('#editlinks').draggable({handle:'.main_handle'}).resizable();
}

/* function creates and alignment of the current alignments */
function automaticAlignment() {
  /* simply align the stuff first */
  var alms = scalign(CFG['_current_seqs']);
  ALIGN.ALMS = alms;
  ALIGN.TAXA = CFG['_current_taxa'];
  ALIGN.refresh();
  $('#submit_alignment_button').removeClass('hidden');
  $('#automatic_alignment_button').addClass('hidden');
  $('#edit_alignment_button').addClass('hidden');
}

/* function creates an ALIGN object for editing alignments in text */
/* XXX go here for sorting the alignmetns when aligning the words */
function editAlignment() {
  ALIGN.ALMS = CFG['_current_alms'];
  ALIGN.TAXA = CFG['_current_taxa'];
  //->console.log('alms',ALIGN.ALMS);
  ALIGN.refresh();

  /* toggle visibility of submit button */
  $('#submit_alignment_button').removeClass('hidden');
  $('#automatic_alignment_button').addClass('hidden');
  $('#edit_alignment_button').addClass('hidden');
}

/* function writes alignments that have been carried out to the wordlist object */
function storeAlignment() {
  //ALIGN.refresh();
  ALIGN.export_alignments();
  /* check for index of alignments in data */
  if (CFG['_alignments'] != -1) {
    var this_idx = CFG['_alignments']; 
  }
  /* if alignemtns are not present, we have a problem, and we need to add them as a column */
  else {
    /* get index of tokens */
    var tidx = CFG['_segments']; 

    WLS.header.push('ALIGNMENT');
    WLS.columns['ALIGNMENT'] = WLS.header.indexOf('ALIGNMENT');
    WLS.column_names['ALIGNMENT'] = 'ALIGNMENT';
    for (k in WLS) {
      if (!isNaN(k)) {
        WLS[k].push(''); /* start with empty string, easier for manual editing */
      }
    }
    var this_idx = WLS.header.indexOf('ALIGNMENT');
    CFG['_alignments'] = this_idx;
  }

  var blobtxt = '';
  
  /* XXX we now try to update them all at once, in order to save time TODO */
  /* in order to make sure that we can submit everything at once, we collect
   * all info in three arrays, ids,cols, vals */
  var ids = [];
  var cols = [];
  var vals = [];

  var i, idx, alm;
  var j, segment;
  var tokens;

  for (i = 0; idx = CFG['_current_idx'][i]; i += 1) {
    alm = ALIGN.ALMS[i].join(' ');
    WLS[idx][this_idx] = alm;
    
    /* add the values to the three arrays */
    ids.push(idx);
    cols.push(this_idx);
    vals.push(alm);

    /* check for tokens */
    tokens = [];
    for (j = 0; segment = ALIGN.ALMS[i][j]; j += 1) {
      if (segment != "-" && segment != "(" && segment != ")") {
        tokens.push(segment);
      }
    }
    tokens = tokens.join(" ");
    if (tokens != WLS[idx][CFG._segments]) {
      ids.push(idx);
      cols.push(CFG._segments);
      vals.push(tokens);
      WLS[idx][CFG._segments] = tokens;
    }

    blobtxt += idx+'\t'+ALIGN.TAXA[i]+'\t'+ALIGN.ALMS[i].join('\t')+'\n';
  }

  storeModification(ids, cols, vals, false);
  if (CFG._patterns != -1 && CFG._morphology_mode == "full") {
    PATS.recheck([WLS[ids[0]][CFG._cognates]]);
  }

  CFG['_alignment'] = blobtxt;

  resetFormat(CFG['formatter']);
  //createSelectors(); TODO: refine this by checking the bug!
  applyFilter();
}

function toggleClasses(classes,from,to) {
  for (var i=0,idf;idf=classes[i];i++) {
    $('#'+idf).removeClass(from);
    $('#'+idf).addClass(to);
  }
}

/* display a tiny little message that the data was saved */
function dataSavedMessage(what, howmuch) {
  if (typeof howmuch == 'undefined') {
    howmuch = 0;
  }

  /* remove previously issued messages */
  $('#data_saved').remove();

  var mydate = new Date();
  var mydatestring = mydate.toLocaleDateString() + ' ' + mydate.toLocaleTimeString();

  /* add new message */
  var msg = document.createElement('div');
  msg.id = 'data_saved';
  if (what == 'update') {
    msg.innerHTML = "Data has been last updated on " + mydatestring +'.';
  }
  else if (what == 'insertion') {
    msg.innerHTML = "New entry has been inserted on " + mydatestring+'.';
  }
  else if (what == 'deletion') {
    msg.innerHTML = "Deleted row " + howmuch + " from the database on " + mydatestring+'.';
  }
  else if (what == 'post') {
    msg.innerHTML = "Posted "+howmuch+" new entries to the database on " + mydatestring+'.';
  }
  else if (what == 'finished') {
    msg.innerHTML = "Finished the upload of data on " + mydatestring + '.';
  }
  document.body.appendChild(msg);
}


/* function redefines the filters for phonological data */
function filterOccurrences(doculect, occurrences) {

  /* if doculect is set to false, we leave the doculects in our filter
   * untouched, if doculect contains a comma, we break it and display all doculects passed in the
   * split */
  if (doculect && doculect.indexOf(',') != -1) {
    var doculects = doculect.split(',');
    $('#select_doculects').multiselect('deselectAll', false);
    for (var i=0,d; d=doculects[i]; i++) {
      $('#select_doculects').multiselect('select', d);
    }
  }
  else if (doculect) {
    $('#select_doculects').multiselect('deselectAll',false); //'deselect', Object.keys(WLS.taxa));
    $('#select_doculects').multiselect('select',doculect);
  }
  
  var concepts = [];
  occurrences = occurrences.split(',');
  for(var i=0,occ; occ=occurrences[i]; i++) {
    concepts.push(WLS.c2i[parseInt(occ)]);
  }
  
  $('#select_concepts').multiselect('deselectAll', false); 
  $('#select_concepts').multiselect('select',concepts);

  applyFilter();
  showWLS(1);
}


/* window onload functions */
window.onload = function() {
    undoManager = new UndoManager();
};



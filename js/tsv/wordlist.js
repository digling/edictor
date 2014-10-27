/* Wordlist main library
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-06-28 09:48
 * modified : 2014-10-27 15:49
 *
 */

/* define alias system for frequently occurring terms */
ALIAS = {
  'doculect': ['TAXON', 'LANGUAGE', 'DOCULECT', 'DOCULECTS', 'TAXA', 'LANGUAGES'],
  'concept': ['CONCEPT', 'GLOSS']
}

function reset() {
  WLS = {};
  CFG = {
    'basics' : ['DOCULECT', 'GLOSS', 'CONCEPT', 'IPA', 'TOKENS', 'COGID', 'TAXON', 'TAXA', 'PROTO', 'PROTO_TOKENS', 'ALIGNMENT', 'ETYMONID', 'CHINESE'],
    'preview': 10,
    'noid': false, 
    'sorting': false, 
    'formatter': false, 
    '_alignment':false,
    'highlight': ['TOKENS','ALIGNMENT'],
    'sampa' : ['IPA','TOKENS'],
    'pinyin' : ['CHINESE'],
    'css': ["menu:show","textfields:hide","database:hide"],
    'status' : {},
    'server_side_files' : [],
    'server_side_bases' : [],
    'storable' : false,
    'last_time' : false, 
    'parsed' : false
  };
  
  STORE = '';
  var BL = ['file'];
  
  for (var param in PARAMS) {
    var value = PARAMS[param];

    if (BL.indexOf(param) == -1) {
     if (!isNaN(parseInt(value))) {
       CFG[param] = parseInt(value);
     }
     else if (value.indexOf(',') != -1) {
       CFG[param] = [];
       var values = value.split(',');
       for (var i=0,val;val=values[i];i++) {
         if (val != '') {
          CFG[param].push(val);
         }
       }
     }
     else {
       CFG[param] = PARAMS[param];
     }
    }
  }
  
  $('#filedisplay').css('display','none');
}

/* the wordlist object */
var WLS = {};

/* the basic configuration */
var CFG = {
  'basics'            : [
    'DOCULECT', 'GLOSS', 'CONCEPT', 'IPA', 'TOKENS', 'COGID', 'TAXON', 'TAXA', 'PROTO', 
    'PROTO_TOKENS', 'ALIGNMENT', 'ETYMONID', 'CHINESE'],
  'preview'           : 10,
  'noid'              : false,
  'sorting'           : false,
  'formatter'         : false,
  '_alignment'        : false,
  'highlight'         : ['TOKENS','ALIGNMENT'],
  'sampa'             : ['IPA','TOKENS'],
  'pinyin'            : ['CHINESE'],
  'css'               : ["menu:show","textfields:hide","database:hide"],
  'status'            : {},
  'server_side_files' : [],
  'server_side_bases' : [],
  'storable' : false,
  'last_time' : false,
  'parsed' : false
};
var STORE = ''; // global variable to store the text data in raw format
var PARAMS = {};

/* function for resetting the formatter */
function resetFormat(value) {

  if (!value) {
    CFG['formatter'] = false;
    WLS['etyma'] = [];
  }
  else {
    var size = 0;
    CFG['formatter'] = value;
    var format_selection = {};
    var format_idx = WLS.header.indexOf(value);
    for (key in WLS) {
      if (!isNaN(key)) {
        var tmp = WLS[key][format_idx];
        if (tmp in format_selection) {
          format_selection[tmp].push(key);
        }
        else if (tmp != 0) {
          format_selection[tmp] = [key];
        }
        size++;
      }
    }
    WLS['etyma'] = format_selection;
    console.log("Etyma:",WLS['etyma'])
  }
  //showWLS(getCurrent());
}

/* load qlc-file */
function csvToArrays(allText, separator, comment, keyval) {
  var allTextLines = allText.split(/\r\n|\n/);

  var qlc = {};
  var taxa = {};
  var concepts = {};
  var tIdx = -1;
  var cIdx = -1;
  var cogid = -1;
  var selection = [];
  var columns = {};
  var count = 1;
  var uneditables = [];
  var column_names = {};

  var firstLineFound = false;
  var noid = false;
  for (var i = 0; i < allTextLines.length; i++) {
    var data = allTextLines[i].split(separator);
    if (data[0].charAt(0) == comment || data[0].replace(/\s*/g,'') == '' || data[0].charAt(0) == keyval){}
    else if (data[0] == 'ID') {
      firstLineFound = true;

      /* get the header */
      var header = [];
      for (j = 1; j < data.length; j++) {
        var datum = data[j].toUpperCase();
        
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
        if (ALIAS['doculect'].indexOf(datum) != -1) {
          tIdx = j;
        }
        if (ALIAS['concept'].indexOf(datum) != -1) {
          cIdx = j;
        }
        if (CFG['basics'].indexOf(datum) != -1) {
          columns[datum] = j;
        }
        else {
          columns[datum] = -j;
        }
      }
      /* apply check for tidx and cidx */
      if (tIdx == -1 && cIdx == -1) {tIdx = 1;cIdx = 2;}
      else if (cIdx == -1 && tIdx > 1) {cIdx = 1; }
      else if (cIdx == -1 && tIdx <= 1) {cIdx = 2; }
      else if (tIdx == -1 && cIdx > 1) {tIdx = 1; }
      else if (tIdx == -1 && cIdx <= 1) {tIdx = 2; }

      /* append to basics */
      columns[data[tIdx].toUpperCase()] = Math.abs(columns[data[tIdx].toUpperCase()]);
      columns[data[cIdx].toUpperCase()] = Math.abs(columns[data[cIdx].toUpperCase()]);
      CFG['basics'].push(data[tIdx].toUpperCase());
      CFG['basics'].push(data[cIdx].toUpperCase());

    }
    /* handle cases where no ID has been submitted */
    else if (firstLineFound == false) {
      firstLineFound = true;
      noid = true;
      CFG['noid'] = true;

      /* get the header */
      var header = [];
      for (j = 0; j < data.length; j++) {
        var datum = data[j].toUpperCase();
        header.push(datum);
        if (ALIAS['doculect'].indexOf(datum) != -1) {
          tIdx = j;
        }
        if (datum == 'GLOSS' || datum == 'CONCEPT') {
          cIdx = j;
        }
        columns[datum] = j+1;
      }
      /* apply check for tidx and cidx */
      if (tIdx == -1 && cIdx == -1) {tIdx = 0;cIdx = 1;}
      else if (cIdx == -1 && tIdx > 1) {cIdx = 0; }
      else if (cIdx == -1 && tIdx <= 1) {cIdx = 1; }
      else if (tIdx == -1 && cIdx > 1) {tIdx = 2; }
      else if (tIdx == -1 && cIdx <= 1) {tIdx = 1; }

      /* append to basics */
      columns[data[tIdx].toUpperCase()] = Math.abs(columns[data[tIdx].toUpperCase()]);
      columns[data[cIdx].toUpperCase()] = Math.abs(columns[data[cIdx].toUpperCase()]);
      CFG['basics'].push(data[tIdx].toUpperCase());
      CFG['basics'].push(data[cIdx].toUpperCase());

    }
    //else if (data[0].charAt(0) == comment || data[0] == '') {}
    else if (firstLineFound) {
      if (!noid) {
        var idx = parseInt(data[0]);
        qlc[idx] = data.slice(1, data.length);
      }
      else {
        var idx = count;
        count += 1;
        qlc[idx] = data.slice(0,data.length);
      }

      /* check for header */
      var taxon = data[tIdx];
      var concept = data[cIdx];
      if (taxon in taxa) {
        taxa[taxon].push(idx);
      }
      else {
        taxa[taxon] = [idx];
      }
      if (concept in concepts) {
        concepts[concept].push(idx);
      }
      else {
        concepts[concept] = [idx];
      }
      selection.push(idx);
    }
  }
  // check whether or not we need this sorting mode, maybe we can as well get rid of it
  
  /* create a concept - id converter and vice versa for various purposes */
  var c2i = {};
  var count = 1;
  for(c in concepts) {
    c2i[count] = c;
    c2i[c] = count;
    count += 1;
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
  
  /* ! attention here, this may change if no ids are submitted! */
  CFG['_tidx'] = tIdx-1;
  CFG['_cidx'] = cIdx-1;
  CFG['parsed'] = true;

  /* add formatting options for all "ID" headers to the data */
  var formatter = document.getElementById('formatter');
  var tmp_text = '<th>Formatter</th><td>';
  var tmp_count = 0;
  var this_key = false;
  for (var key in WLS['columns']) {
    if (key.indexOf('ID') - key.length == -2 && tmp_count == 0 && key != CFG['formatter']) {
      tmp_text += '<input onchange="resetFormat(this.value)" type="radio" checked name="formatter" value="'+key+'">'+key+' ';
      this_key = key;
      tmp_count += 1;
    }
    else if (key.indexOf('ID') - key.length == -2 && CFG['formatter'] != key) {
      tmp_text += '<input onchange="resetFormat(this.value)" type="radio" name="formatter" value="'+key+'">'+key+' ';
      tmp_count += 1;
    }
    else if (key == CFG['formatter']) {
      tmp_text += '<input onchange="resetFormat(this.value)" type="radio" checked name="formatter" value="'+key+'">'+key+' ';
      tmp_count += 1;
      this_key = CFG['formatter'];
    }
  }
  tmp_text += '<input onchange="resetFormat(false)" type="radio" name="formatter" value="">FALSE ';
  if (tmp_count > 0) {
    resetFormat(this_key);
    formatter.innerHTML = tmp_text + '</td>';
    formatter.style.display = "table-row";
  }
  else {
    formatter.style.display = "none";
  }

  /* create selectors */
  createSelectors();
}

/* create selectors for languages, concepts, and columns */
function createSelectors() {
  
  console.log('creating columns');
  var did = document.getElementById('select_doculects');
  var doculects = Object.keys(WLS.taxa);
  doculects.sort();
  var txt = '';
  for (var i=0,doculect; doculect=doculects[i]; i++) {
    txt += '<option value="'+doculect+'" selected>'+doculect+'</option>';
  }
  did.innerHTML = txt;

  var cid = document.getElementById('select_concepts');
  var concepts = Object.keys(WLS.concepts);
  concepts.sort();
  txt = ''

  for (var i=0,concept; concept=concepts[i]; i++) {
    txt += '<option value="'+concept+'" selected>'+concept+'</option>';
  }
  cid.innerHTML = txt;

  var eid = document.getElementById('select_columns');
  var columns = Object.keys(WLS.columns);
  columns.sort();
  txt = '';
  console.log(columns);

  for (var i=0,column; column=columns[i]; i++) {
    if (WLS.columns[column] > 0) {
      txt += '<option value="'+column+'" selected>'+WLS.column_names[column]+'</option>';
    }
    else {
      txt += '<option value="'+column+'">'+WLS.column_names[column]+'</option>';
    }
  }
  eid.innerHTML = txt;
  
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
  
  $('#textfields').toggle();

}

function showWLS(start)
{ 

  if (!CFG['parsed']) {
    if (CFG['storable']) {
      CFG['last_time'] = new Date();
      console.log(CFG.last_time);
    }
    csvToArrays(STORE, '\t', '#', '@');
  }
  else {
    /* if we are dealing with a storable session, we now call ajax to tell us
     * which files have most recently (within a ten minutes time frame) been updated
     * we compare these with our own data and replace all cases where our own data 
     * differs */
    if (CFG['storable']) {
      var now = new Date();
      var passed_time = (now - CFG['last_time']) / 60000;
      
      if (passed_time >= 1000) { /* reset TIME to other minutes later */

        /* create the url */
        var url = 'triples/triples.php?file=' + CFG['filename'] + 
          '&date=' + CFG['last_time'].getTime();

        var txt = '';

        /* make the ajax call */ 
        $.ajax({
          async: true,
          type: "GET",
          contentType: "application/text; charset=utf-8",
          url: url,
          dataType: "text",
          success: function(data) {
            txt = data;
          },
          error: function() {
            CFG['storable'] = false;
            fakeAlert("Could not retrieve data from the database.");
          }    
        });

        /* iterate over all lines and check for updates */
        var lines = txt.split('\n');
        for (var i=0,line; line=lines[i]; i++)
        {
          var cells = line.split('\t');
          var idx = parseInt(cells[0]);
          var col = cells[1].replace(/_/g,'');
          var col_idx = WLS.header.indexOf(col);
          /* check if column actually exists (it may just have been created
           * and will thus not appear in the current application, which is 
           * also not needed for now */
          if (col_idx != -1) {
            var val = cells[2];
            if (WLS[idx][col_idx] != val) {
              WLS[idx][col_idx] = val;
            }
          }
        }
        console.log("ShowWls, check updates:",txt);
        /* set up new time frame */
        CFG['passed_time'] = now;
      }
    }
  }

  var text = '<table id="qlc_table">';
  
  /* we create the header of the table first */
  // add col-tags to the dable
  text += '<col id="ID" />';
  var thtext = ''; // ff vs. chrome problem
  for (i in WLS['header']) {
    var head = WLS['header'][i];
    if (WLS['columns'][head] > 0) {
      text += '<col id="' + head + '" />';
      thtext += '<th class="titled" title="Double-click for sorting along this column." id="HEAD_'+head+'" ondblclick="sortTable(event,'+"'"+head+"'"+')">' + WLS.column_names[head] + '</th>';
    }
    else {
      text += '<col id="' + head + '" style="visibility:hidden;" />';
      thtext += '<th style="display:none">' + WLS.column_names[head] + '</th>';
    }
  }

  text += '<tr>';
  text += '<th>ID</th>';
  text += thtext;
  text += '</tr>';

  var count = 1;
  if (CFG['formatter']) {
    var previous_format = '';
    var tmp_class = 'd0';
    console.log(WLS['rows']);
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
        text += '<td class="ID" title="LINE ' + rowidx + '">' + idx + '</td>';
        for (j in WLS[idx]) {
          var jdx = parseInt(j) + 1;

          var head = WLS['header'][j];
          if (WLS['columns'][head] > 0) {
            var cell_display = '';
          }
          else {
            var cell_display = ' style="display:none"'; // ff vs. chrome problem
          }
          
          if (WLS.header[j] != CFG['formatter'] && WLS.uneditables.indexOf(WLS.header[j]) == -1) {
            text += '<td class="' + WLS['header'][j] + '" title="MODIFY ENTRY ' + idx + '/' + jdx + '" onclick="editEntry(' + idx + ',' + jdx + ',0,0)" data-value="' + WLS[idx][j] + '"' + cell_display + '>';
            text += WLS[idx][j];
            text += '</td>';
          }
          else if (WLS.uneditables.indexOf(WLS.header[j]) != -1) {
            text += '<td class="uneditable '+WLS['header'][j]+'" title="ENTRY '+idx+'/'+jdx+'">';
            text += WLS[idx][j];
            text += '</td>';
          }
          else {
            text += '<td ondblclick="editGroup(event,'+"'"+WLS[idx][j]+"'"+')" oncontextmenu="editGroup(event,'+"'"+WLS[idx][j]+"')"+'" class="' + WLS['header'][j] + '" title="MODIFY ENTRY ' + idx + '/' + jdx + '" onclick="editEntry(' + idx + ',' + jdx + ',0,0)" data-value="' + WLS[idx][j] + '"' + cell_display + '>';
            text += WLS[idx][j];
            text += '</td>';
          }

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
        text += '<tr id="L_' + idx + '">';
        text += '<td class="ID" title="LINE ' + rowidx + '">' + idx + '</td>';
        for (j in WLS[idx]) {
          var jdx = parseInt(j) + 1;

          var head = WLS['header'][j];
          if (WLS['columns'][head] > 0) {
            var cell_display = '';
          }
          else {
            var cell_display = ' style="display:none"'; // ff vs. chrome problem
          }
          text += '<td class="' + WLS['header'][j] + '" title="MODIFY ENTRY ' + idx + '/' + jdx + '" onclick="editEntry(' + idx + ',' + jdx + ',0,0)" data-value="' + WLS[idx][j] + '"' + cell_display + '>';
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
  if (WLS['rows'].length > start + CFG['preview']) {
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
  if (following >= WLS['rows'].length - 1) {
    following = WLS['rows'].length;
  }
  current.innerHTML = 'Showing ' + start + ' - ' + following + ' of ' + parseInt(WLS['rows'].length) + ' entries';

  toggleClasses(['first','filename','current'],'hidden','unhidden');
  
  document.getElementById('view').style.display = 'none';
  document.getElementById('mainsettings').style.display = 'inline';
  document.getElementById('filedisplay').style.display = 'block';
  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;' + CFG['filename'] + '&gt;';
  highLight();
  
  if (CFG['sorted']) {
    console.log(CFG['sorted']);
    var tmp = CFG['sorted'].split('_');
    document.getElementById('HEAD_'+tmp.slice(1,tmp.length-1).join('_')).style.backgroundColor = 'Crimson';
    //document.getElementById('HEAD_'+CFG['sorted'].split('_').[1]).style.backgroundColor = 'Crimson';
  }
  
  //document.location.hash = 'qlc';
  return 1;
}

/* specific customized functions for adding a column to the wordlist */
function addColumn(event)
{
  var col = document.getElementById('add_column');

  if (event.keyCode != 13) {
    return;
  }

  var name = col.value.trim();
  if (name == '') {
    col.value = '';
    return;
  }
  var base = function(i) {return '?'};

  if (name.indexOf('>>') != -1) {
    var basename = name.split('>>');
    var basex = basename[0];
    var bases = basex.split(/\+/);
    var base = function(i) {
      var new_entry = '';
      for (k in bases) {
        var tmp = bases[k];
        /* if $ipa>>tokens is given, for example, this code produces a new column
         * called "tokens" in which all entries consist of former $ipa */
        if (tmp.charAt(0) == '$') {
          var j = WLS['header'].indexOf(tmp.slice(1, tmp.length).toUpperCase());
          if (j != -1) {
            new_entry += WLS[i][j];
          }
          else {
            new_entry += tmp;
          }
        }
        else if (tmp.charAt(0) == '!') {
          try
          {
            var str = 'var x = ' + tmp.slice(1, tmp.length) + '(' + '"' + new_entry + '"); return x;';
            var F = new Function(str);
            new_entry = F();
          }
          catch (err)
          {
            db = document.getElementById('db');
            db.innerHTML = err;
            db.style.color = 'red';
          }
        }
        else if (tmp.indexOf('(') != -1 && tmp.indexOf(')') != -1) {
            var str = 'var x = "' + new_entry + '".' + tmp + '; return x;';
            var F = new Function(str);
            new_entry = F();
        }
        else {
          new_entry += tmp;
        }
      }
      return new_entry;
    };
    var name = basename[1].toUpperCase();
  }

  if (name in WLS['columns']) {
    col.value = '';
    return;
  }

  var mods = {};

  /* modify entries in wordlist */
  for (idx in WLS) {
    if (!isNaN(idx)) {
      var new_val = base(idx);
      WLS[idx].push(new_val);
      mods[idx] = new_val;
    }
  }
  
  /* get everything together for a big post request */
  if (CFG['storable']) {
    
    // check out how posts have to be made 
    var keys = Object.keys(mods);
    
    var count = 0;
    var nmods = {};
    nmods['column'] = name;
    nmods['file'] = CFG['filename'];
    for (var i=0,key; key=keys[i]; i++) {
      count += 1;
      if (mods[key] != '?' && mods[key] != '' && mods[key] != '-') {
        nmods[key] = mods[key];
      }
      if (count >= 800 || i >= keys.length-1) {

        var key_count = Object.keys(nmods).length - 2;
        console.log(key_count);

        $.ajax({
          async: true,
          data: nmods,
          type: "POST",
          url: 'triples/update.php',
          success: function(data) {
            console.log('submitted the data');
            if (data.indexOf('COLUMN') != -1) {
              dataSavedMessage('post', key_count) ;
            }
            else {
              console.log(data);
            }
          },
          error: function() {
            fakeAlert('data could not be stored');
          }
        });
        count = 0;
        nmods = {'column':name,'file':CFG['filename']};
      }
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


  col.value = '';
  createSelectors();
  showWLS(1);
}

function editEntry(idx, jdx, from_idx, from_jdx)
{
  var line = document.getElementById('L_' + idx);

  /* if line is undefined, check for next view */
  if (line == null || typeof line == 'undefined') {
    var ridx = WLS['rows'].indexOf(idx);
    var fidx = WLS['rows'].indexOf(from_idx);
    //fakeAlert(fidx+' '+ridx);
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
      from_jdx = 2;
      editEntry(idx, jdx, from_idx, from_jdx);
      return;
    }
  }

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

  entry.onclick = '';
  var value = entry.dataset.value;
  var size = value.length + 5;
  var text = '<input class="cellinput" type="text" size="' + size + '" id="modify_' + idx + '_' + jdx + '" value="' + value + '" />';

  var ipt = document.createElement('input');
  ipt.setAttribute('class', 'cellinput');
  ipt.setAttribute('type', 'text');
  ipt.setAttribute('id', 'modify_' + idx + '_' + jdx);
  ipt.setAttribute('value', value);
  ipt.setAttribute('data-value', value);
  ipt.setAttribute('onkeyup', 'modifyEntry(event,' + idx + ',' + jdx + ',this.value)');
  ipt.setAttribute('onblur', 'unmodifyEntry(' + idx + ',' + jdx + ',"' + value + '")');


  ipt.size = size;
  entry.innerHTML = '';
  entry.appendChild(ipt);
  ipt.focus();

}

function autoModifyEntry(idx, jdx, value, current) {

  var tcurrent = parseInt(getCurrent());
  current = parseInt(current);

  if (tcurrent != current) {
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
  storeModification(idx,j,value);
  
  highLight();
}

/* function modifies a given entry */
function modifyEntry(event, idx, jdx, xvalue) {

  var process = false;

  /* get current index in the current view */
  var cdx = WLS['rows'].indexOf(idx);
  var bdx = WLS['rows'][cdx - 1];
  var ndx = WLS['rows'][cdx + 1];
  var j = parseInt(jdx) - 1;

  var entry = document.getElementById('L_' + idx).cells[jdx];

  if (CFG['pinyin'].indexOf(WLS['header'][(jdx-1)]) != -1) {
    var closed = false;
    $('.cellinput').autocomplete({
        source: function (request, response){
        var responses = [];
        for (var i=0,v;v=pinyin[xvalue][i];i++) {
          responses.push(v);
        }
        response(responses);
        },
      close: function(){closed=true;}
    });

    if ((event.keyCode == 38 || event.keyCode == 40) && xvalue != entry.dataset.value) {
      return;
    }
  }

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
    unmodifyEntry(idx, jdx, entry.dataset.value);
    return;
  }
  /* modify on enter */
  else if (event.keyCode != 13) {
    
    return;
  }

  /* change sampa to ipa if entries are ipa or tokens */
  if (CFG['sampa'].indexOf(entry.className) != -1) {
    xvalue = sampa2ipa(xvalue); 
  }

  /* modify cogid to get unique id if no integer is chosen */
  var reset_format = false;
  if (CFG['formatter'] == entry.className) {
    var nxvalue = cognateIdentifier(xvalue);
    reset_format = true;
    if (nxvalue != xvalue) {
      xvalue = nxvalue;
    }
    resetFormat(CFG['formatter']);
  }

  var prevalue = entry.dataset.value;
  entry.dataset.value = xvalue;

  entry.onclick = function() {editEntry(idx, jdx, 0, 0)};
  entry.innerHTML = xvalue; 
  
  /* check whether the value has been modified, if so, change the underlying
   * entry in the big WLS Object */
  if (prevalue != xvalue) {
    undoManager.add({
      undo: function() {autoModifyEntry(idx, jdx, prevalue, current);},
      redo: function() {autoModifyEntry(idx, jdx, xvalue, current);}  
    });
    WLS[idx][(jdx - 1)] = xvalue;
    
    /* trigger store modification in case this is possible for the current session */
    storeModification(idx,(jdx-1),xvalue);
  }
  
  if (process == true) {
    editEntry(ni, nj, idx, jdx);
  }
  highLight();
  
  if (reset_format) {
    var start = '';
    var cclass = 'd1';
    var cogids = document.getElementsByClassName('COGID');
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
  }

  if (undoManager.hasUndo() == true) {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }
}

/* function stores (if possible) a given modification in the project's triple store */
function storeModification(idx, jdx, value, async) {
  if (typeof async == 'undefined') {
    async = true;
  }
  
  /* if storable is set to "true" and wer are working with a remote server, 
   * make the modifying ajax-call to ensure that the data has been edited 
   * and stored */
  if (CFG['storable']) {
    console.log('encountered storable stuff');

    /* create url first */
    var new_url = 'triples/update.php?' + 
      'file='+CFG['filename'] +
      '&update' + 
      '&ID='+idx +
      '&COL='+ WLS.column_names[WLS.header[jdx]].replace(/ /g,'_') +
      '&VAL='+value;

    $.ajax({
      async: async,
      type: "GET",
      contentType: "application/text; charset=utf-8",
      url: new_url,
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
  else {
    console.log('storable failed somehow %o',CFG['storable']);
  }
}

/* revert a given entry to its original value */
function unmodifyEntry(idx, jdx, xvalue)
{
  var entry = document.getElementById('L_' + idx).cells[jdx];
  var value = xvalue; //entry.innerText;
  entry.onclick = function() {editEntry(idx, jdx, 0, 0)};
  var j = parseInt(jdx) - 1;
  WLS[idx][j] = value;
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

function applyFilter()
{
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
    tlist = Object.keys(WLS['taxa']);
    $('#select_doculects').multiselect('select',tlist);
  }
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
    clist = Object.keys(WLS.concepts);
    $('#select_concepts').multiselect('select',clist);
  }

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
  else {
    arows = WLS._trows.slice();
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
  crows.sort(function(x, y) {return x - y});
  arows.sort(function(x, y) {return x - y});

  /* function taken from http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript */
  function intersection_destructive(a, b)
  {
    var result = new Array();
    while (a.length > 0 && b.length > 0)
    {
       if (a[0] < b[0]) { a.shift(); }
       else if (a[0] > b[0]) { b.shift(); }
       else /* they're equal */
       {
         result.push(a.shift());
         b.shift();
       }
    }

    return result;
  }

  var rows = intersection_destructive(trows, crows);
  rows = intersection_destructive(rows, arows);

  console.log('applyFilter6:',rows);

  if (rows.length < 1) {
    fakeAlert("No entries matching your filter criteria could be found. All filters will be reset.");
    custom.value = '';
    applyFilter();
  }
  else {
    WLS['rows'] = rows.sort(function(x, y) {return x - y;});
  }
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
  if (previous == null) {
    current_index = 1;
  }
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
  
  //var store = document.getElementById('store');
  CFG['filename'] = file.name;
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
}

/* this function actually writes the whole wordlist to file, so it does 
 * not refresh it but rather prepares it for writing...*/
function refreshFile()
{
  //var store = document.getElementById('store');
  var text = '# EDICTOR\n';
  text += '@modified: ' + getDate() + '\n#\n';
  text += 'ID';
  for (var i=0,head;head=WLS['header'][i];i++) {
    if (WLS['columns'][head] > 0) {
      if (WLS['uneditables'].indexOf(head) != -1) {
        text += '\t_'+WLS.column_names[head].replace(/ /g,'_');
      }
      else {
        text += '\t'+WLS.column_names[head].replace(/ /g,'_');
      }
    }
  }
  text += '\n';
  for (concept in WLS['concepts']) {
    if (CFG['noid'] == false) {
      text += '#\n';
    }
    for (i in WLS['concepts'][concept]) {
      var idx = WLS['concepts'][concept][i];

      if (!isNaN(idx)) {
        //text += idx + '\t' + WLS[idx].join('\t') + '\n';
	text += idx;
	for (var j=0,head;head=WLS['header'][j];j++) {
	  if (WLS['columns'][head] > 0) {
	    text += '\t'+WLS[idx][j];
	  }
	}
	text += '\n';
      }
    }
  }
  //store.innerText = text;
  STORE = text;
  WLS['edited'] = true;
  localStorage.text = text;
  localStorage.filename = CFG['filename'];
  
  toggleClasses(['undo','redo'],'unhidden','hidden');
  
  undoManager.clear();
  
  showWLS(getCurrent());
  
  /* change disk symbol */
  $('#refresh > span').removeClass('glyphicon-floppy-disk').addClass('glyphicon-floppy-saved');

  fakeAlert("Document was saved in local storage and can now be exported. Note that only those columns which are currently displayed will be written to file. If You want to select different columns for export, check out the current settings of column display by pressing F2, alter them accordingly, and SAVE the document again."); 
}

function fakeAlert(text)
{
  var falert = document.createElement('div');
  falert.id = 'fake';
  var text = '<div class="message"><p>' + text + '</p>';
  text += '<div class="btn btn-primary okbutton" onclick="' + "$('#fake').remove(); document.onkeydown = function(event){basickeydown(event)};" + '")> OK </div></div>';
  falert.className = 'fake_alert';

  document.body.appendChild(falert);
  falert.innerHTML = text;
  document.onkeydown = function(event){$('#fake').remove(); document.onkeydown = function(event){basickeydown(event);};};

}

/* save file */
function saveFile()
{
  /* disallow saving when document was not edited */
  if (!WLS['edited']) {
    fakeAlert('You need to SAVE (press button or CTRL+S) the document before you can EXPORT it.');
    return;
  }

  //var store = document.getElementById('store');
  var blob = new Blob([STORE], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, CFG['filename']);
}

/* save file */
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

/* function inserts unique ids for unassigned cognate sets */
function cognateIdentifier(cogid) {
  if (isNaN(parseInt(cogid))) {
    var etym_len = Object.keys(WLS.etyma).length;
    for (var i=1; i < etym_len+1; i++) {
      if (!(i in WLS.etyma)) {
        return i;
      }
    }
  }
  return cogid;
}

/* highlight all IPA entries which are specified as such */
function highLight()
{
  for (var i=0,head;head=WLS.header[i];i++) {
    if (CFG['highlight'].indexOf(head) != -1 ) {
      var tokens = document.getElementsByClassName(head);
      for (var j = 0; j < tokens.length; j++) {
        if (tokens[j].innerHTML == tokens[j].dataset.value) {
          var word = plotWord(tokens[j].dataset.value);
          tokens[j].innerHTML = '<div class="lock_alignment">'+word+"</div>";
        }
      }
    }
    else {
    }
  }
}

/* sort the table according to specific criteria */
function sortTable(event,head)
{
  if (CFG['sorted'] == 'th_'+head+'_0') {
    WLS['rows'].sort(function(x,y){return x-y});
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

function editGroup(event,idx) {
  /* functin handles the display of alignments */

  event.preventDefault();
  
  /* check for various data, consider using switch statement here */
  if (idx == 0) {
    fakeAlert("This entry cannot be edited, since it is not related to any other entry.");
    return;
  }


  /* check for proper values to be displayed for alignment analysis */
  var rows = WLS['etyma'][idx];

  /* check for proper alignments first */
  if (WLS.header.indexOf('ALIGNMENT') != -1 && WLS[rows[0]][WLS.header.indexOf('ALIGNMENT')]) {
    var this_idx = WLS.header.indexOf('ALIGNMENT');
    var fall_back = WLS.header.indexOf('TOKENS');
  }
  else if (WLS.header.indexOf('TOKENS') != -1 && WLS[rows[0]][WLS.header.indexOf('TOKENS')]) {
    var this_idx = WLS.header.indexOf('TOKENS');
    var fall_back = WLS.header.indexOf('IPA');
  }
  else if (WLS.header.indexOf('IPA') != -1) {
    var this_idx = WLS.header.indexOf('IPA');
  }
  else if (WLS.header.indexOf('WORD') != -1) {
    var this_idx = WLS.header.indexOf('WORD');
  }
  else {
    fakeAlert('No phonetic entries were specified in the data.');
    return;
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

  /* now create an alignment object */
  for (var i=0,r;r=rows[i];i++) {
    
    var current_line = WLS[r][this_idx];
    if(!current_line) {
      current_line = WLS[r][fall_back];
    }
    /* add stuff to temporary container for quick alignment access */
    CFG['_current_alms'].push(current_line.split(' '));
    CFG['_current_taxa'].push(WLS[r][CFG['_tidx']]);

    var alm = plotWord(current_line);
    var lang = WLS[r][CFG['_tidx']];
    alms.push('<td class="alm_taxon">'+lang+'</td>'+alm.replace(new RegExp('span','gi'),'td'));
    blobtxt += r+'\t'+lang+'\t'+WLS[r][this_idx].replace(new RegExp(' ','gi'),'\t')+'\n';
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
  text += '<div class="alignments" id="alignments"><table>';
  for (var i=0,alm;alm=alms[i];i++) {
    text += '<tr>'+alm+'</tr>';
  }
  text += '</table></div>';
  text += '<div class="submitline">';
  text += '<input class="btn btn-primary submit" type="button" onclick="editAlignment()" value="EDIT" /> ';
  text += '<input id="submit_alignment" class="btn btn-primary submit hidden" type="button" onclick="storeAlignment()" value="SUBMIT" /> '; 
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

/* function creates and ALIGN object for editing alignments in text */
function editAlignment() {
  ALIGN.ALMS = CFG['_current_alms'];
  ALIGN.TAXA = CFG['_current_taxa'];
  console.log('alms',ALIGN.ALMS);
  ALIGN.refresh();

  /* toggle visibility of submit button */
  $('#submit_alignment').removeClass('hidden');
}

/* function writes alignments that have been carried out to the wordlist object */
function storeAlignment() {
  //ALIGN.refresh();
  ALIGN.export_alignments();
  /* check for index of alignments in data */
  if (WLS.header.indexOf('ALIGNMENT') != -1) {
    var this_idx = WLS.header.indexOf('ALIGNMENT');
  }
  /* if alignemtns are not present, we have a problem, and we need to add them as a column */
  else {
    /* get index of tokens */
    var tidx = WLS.header.indexOf('TOKENS');

    WLS.header.push('ALIGNMENT');
    WLS.columns['ALIGNMENT'] = WLS.header.indexOf('ALIGNMENT');
    WLS.column_names['ALIGNMENT'] = 'ALIGNMENT';
    for (k in WLS) {
      if (!isNaN(k)) {
        WLS[k].push(''); /* start with empty string, easier for manual editing */
      }
    }
    var this_idx = WLS.header.indexOf('ALIGNMENT');
  }

  var blobtxt = '';

  for (var i=0,idx; idx=CFG['_current_idx'][i]; i++) {
    var alm = ALIGN.ALMS[i].join(' ');
    WLS[idx][this_idx] = alm;
    storeModification(idx, this_idx, alm, false);

    blobtxt += idx+'\t'+ALIGN.TAXA[i]+'\t'+ALIGN.ALMS[i].join('\t')+'\n';
  }

  CFG['_alignment'] = blobtxt;

  resetFormat(CFG['formatter']);
  createSelectors();
  applyFilter();
  showWLS(getCurrent());
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

  $('#select_doculects').multiselect('deselectAll',false); //'deselect', Object.keys(WLS.taxa));
  $('#select_doculects').multiselect('select',doculect);
  
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

  document.getElementById('phonemes').style.maxHeight =  cheight +'px';

  if (typeof sort == 'undefined') {
    sort = 'alphabetic';
    direction = 1;
  }
  else if (typeof direction == 'undefined') {
    direction = 1;
  }
  
  console.log(doculect);

  /* create an object in which the data will be stored */
  var occs = {};
  var phonemes = [];

  /* get all indices of the taxa */
  var idxs = WLS['taxa'][doculect];

  /* get index of tokens and concepts*/
  var t = WLS.header.indexOf('TOKENS');
  var c = CFG['_cidx'];
  
  /* iterate over the data */
  for (var i=0,idx; idx = idxs[i]; i++) {
    var tokens = WLS[idx][t].split(' ');
    for (var j=0,token; token=tokens[j]; j++) {
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
          return a - b;  
      };
    }
    else if (sort == 'occurrences') {
      var sorter = function (x,y) { 
        return occs[x].length - occs[y].length; 
      };
    }

    if (direction == 1) {
      return function (x,y) { return sorter(x,y) };
    }
    else {
      return function (x,y) { return sorter(y,x) };
    }
  }

  /* change selection for the current sorting scheme */
  if (sort == 'phoneme') {
    var p_dir = (direction == 1) ? 0 : 1;
    var o_dir = 1;
    var pclass = 'sorted';
    var oclass = 'unsorted';
  }
  else if (sort == 'occurrences') {
    var p_dir = 1;
    var o_dir = (direction == 1) ? 0 : 1;
    var pclass = 'unsorted';
    var oclass = 'sorted';
  }
  else {
    var p_dir = 1;
    var o_dir = 1;
    var pclass = 'unsorted';
    var oclass = 'unsorted';
  }

  /* create the text, first not really sorted */
  phonemes.sort(get_sorter(sort, direction));
  var text = '<table class="data_table"><tr>' + 
    '<th title="double click to sort" ondblclick="showPhonology(false,\''+doculect+'\')">No.</th>' +
    '<th title="double click to sort" class="'+ pclass + '" ' + 
    'ondblclick="showPhonology(false,\''+doculect+'\',\'phoneme\',\''+p_dir+'\')">Phoneme</th>' + 
    '<th title="double click to sort" class="'+ oclass + '" ' + 
    'ondblclick="showPhonology(false,\''+doculect+'\',\'occurrences\',\''+o_dir+'\')">Occurrences</th>' + 
    '<th>Concepts</th>' + 
    '</tr>';
  for (var i=0,phoneme; phoneme=phonemes[i]; i++) {
    var noc = occs[phoneme].length;
    var keys = occs[phoneme];
    
    /* create concepts */
    var concepts = [];
    var cids = [];
    console.log('c2i',WLS.c2i);
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
    text += '<td class="pointed" title="click to filter the occurrences of this phoneme" ' +
      'onclick="filterOccurrences(\''+doculect+'\',\''+cids.join(',')+'\')">' + 
      plotWord(phoneme, 'span', 'pointed') + '</td>';
    text += '<td>' + noc + '</td>';
    text += '<td class="concepts" title="'+concepts.join(', ')+'">' + concepts.join(', ') + '</td>';
    text += '</tr>';
  }
  text += '</table>';

  document.getElementById('phonemes').innerHTML = text;
}

/* window onload functions */
window.onload = function() {
    undoManager = new UndoManager();
};



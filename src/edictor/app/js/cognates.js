/* Cognate selection panel of the edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-12-18 14:11
 * modified : 2024-06-09 07:01
 *
 */

/* basic handler class that initiates the multiselect and other functionalities
 * which are later needed for the cognate set panel */
function handle_cognate_selection() {

  /* check whether formatter is true or not */
  if (!CFG['formatter']) {
    fakeAlert("Your data does not contain cognate sets!");
    return;
  }
  
  /* get selector */
  var slc = document.getElementById('cognates_select_concepts');
  
  /* retrieve concepts and add them to selection */
  var txt = '';
  if (typeof CFG._current_concept == 'undefined') {
    CFG._current_concept = CFG.sorted_concepts[0];
  }
  for (var i=0, concept; concept = CFG.sorted_concepts[i]; i++) {
    var option = '';
    if (CFG._current_concept == concept) {
      option = ' selected=selected ';
    }
    txt += '<option id="concept_'+WLS.c2i[concept]+'" value="'+concept+'"'+option+'>'+concept+'</option>';
  }
  slc.innerHTML = txt;

  $('#cognates_select_concepts').multiselect({
        disableIfEmtpy: true,
        includeSelectAllOption : true,
        enableFiltering: true,
        maxHeight: window.innerHeight-100,
        buttonClass : 'btn btn-primary mright submit pull-left',
        enableCaseInsensitiveFiltering: true,
        buttonContainer: '<div id="cognates_select_concepts_button" class="select_button" />',
        buttonText: function (options, select) {
          return 'Select Concepts <b class="caret"></b>';
        }
      });

  display_cognates(CFG['_current_concept']);
  document.getElementById('cognates_current_concept').innerHTML = CFG['_current_concept'] + 
    ' ('+WLS['c2i'][CFG['_current_concept']]+'/'+WLS.height+')';
}

/* function displays all cognates in a table and makes them ready for editing */
function display_cognates(concept, sortby) {

  /* check for emtpy sortby */
  if (typeof sortby == 'undefined') {
    sortby = 2;
  }
  
  /* if concept is not passed, check for selection */
  if (typeof concept == 'undefined' || !concept) {

    /* set up variable for integer ids of concepts to get them passed to the function that
     * handles the restricted file display of the wordlist */
    var selected_concepts = [];
    
    /* get the word ids for the selected concepts */
    var idxs = [];
    var slc = document.getElementById('cognates_select_concepts');
    if (typeof slc == 'undefined' || slc === null) {return;}
    var all_concepts = [];
  
    /* set up restriction to maximally five concepts per slot */
    var restriction = 1
    for (var i=0,option; option=slc.options[i]; i++) {
      if (option.selected && restriction <= 5) {
        for (var j=0,idx; idx=WLS['concepts'][option.value][j]; j++) {
          idxs.push(idx);
        }
        all_concepts.push(option.value);
        selected_concepts.push(WLS.c2i[option.value]);
        restriction += 1;
      }
    }
    if (all_concepts.length > 0) {
      if (all_concepts.length > 1) {
	      document.getElementById('cognates_current_concept').innerHTML = all_concepts[0]+', ...';
      }
      else {
	      document.getElementById('cognates_current_concept').innerHTML = all_concepts[0] + 
	        ' ('+WLS['c2i'][all_concepts[0]]+'/'+WLS.height+')';
      }
      /* mark the current concept */
      CFG['_current_concept'] = all_concepts[0];
      CFG['_concept_multiselect'] = true;

      /* make string from selected concepts */
      selected_concepts = selected_concepts.join(',');
    }
    else {
      display_cognates(CFG['_current_concept']);
      return;
    }
  }
  /* if the concept is not undefined, we have to change the multiselect options to display what
   * we really want to see */
  else {
    var idxs = WLS.concepts[concept];
    
    var selected_concepts = ''+WLS.c2i[concept];

    $('#cognates_select_concepts').multiselect('deselectAll',false);
    $('#cognates_select_concepts').multiselect('select',concept);

    /* don't forget to also change the internal options which are not displayed here */
    var slcs = document.getElementById('cognates_select_concepts');
    for (var k=0,option; option=slcs.options[k]; k++) {
      if (option.selected && option.value != concept) {
        option.selected = false;
      }
      else if (option.value == concept) {
        option.selected = true;
      }
    }
    /* store that there is no multiselect option chosen here */
    CFG['_concept_multiselect'] = false;
  }

  /* get the selected concep
  /* add first concept */
  var tab = document.getElementById('cognates_table');
  var txt = '<table id="cognates_alignments" class="alignments">';
  var maxlen = 4;
  
  /* store in data array first */
  var data = [];
  var aidx = CFG['_alignments'];
  var tidx = CFG['_segments'];
  var cidx = CFG['_fidx'];
  
  for (var i=0,idx; idx = idxs[i]; i++) {
    var cid = WLS[idx][cidx];
    
    var tks = WLS[idx][aidx];
    if (!tks) {
      var tks = WLS[idx][tidx];
    }
    var doc = WLS[idx][CFG['_tidx']];
    var con = WLS[idx][CFG['_cidx']];
    
    if (CFG['_selected_doculects'].indexOf(doc) != -1) {
      /* retrieve length of tokens, current solution is not very economic,
       * but it seems to suffice here for the time being */
      var tkl = tks.split(' ');

      /* check for empty tokens */
      //if (tkl != 0) {
      var brackets = 0;
      for (var j=0;j<tkl.length; j++) {
        if (tkl[j] == '(' || tkl[j] == ')'){
          brackets += 1;
        }
      }
      tkl = tkl.length - brackets;
      if (tkl > maxlen) {
        maxlen = tkl;
      }
      data.push([idx,doc,con,cid,tks]);
    }
    
  }

  /* set up a concept string or nothing in case concept is undefined */
  if (typeof concept == 'undefined') {
    var cstring = '';
  }
  else {
    var cstring = concept;
  }

  txt += '<tr>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',1)" class="pointed alm_head alm_bdl">DOCULECT</th>';
  txt += '<th style="width: 5px"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',2)" class="pointed alm_head alm_bdl">CONCEPT</th>';
  txt += '<th style="width:5px" class="alm_bdr"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',4)" class="pointed alm_head" colspan="'+maxlen+'">ALIGNMENTS</th>';
  txt += '<th style="width:5px"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',3)" class="pointed alm_head alm_bdl" colspan="3">EDIT</th></tr>';

  /* sort data according to concept and cognate id and taxon */
  if (sortby == 1) {
    data.sort(
        function(x, y) {
	  if (x[3] == y[3]) {
	    return CFG.sorted_taxa.indexOf(x[1]) - CFG.sorted_taxa.indexOf(y[1]);
	  }
	  else if(x[3] > y[3]) {
	    return 1;
	  }
	  else {
	    return -1;
	  }
        });
  }
  else {
    data.sort(
        function(x,y) {
          var _x = [x[3], x[sortby], CFG.sorted_taxa.indexOf(x[2]), x[1]].join(' ');
          var _y = [y[3], y[sortby], CFG.sorted_taxa.indexOf(y[2]), y[1]].join(' ');
          return _x.localeCompare(_y);
        });
  }

  /* determine length of cognate sets */
  var csets = {};
  for (var i=0,row; row=data[i]; i++) {
    if (row[3] in csets){csets[row[3]] += 1;}
    else {csets[row[3]] = 1;}
  }
  
   
  /* retrieve alignments */
  var alms = [];
  var current = 0;
  var color = 'lightgray';
  for (var i=0,row; row=data[i]; i++) {
    if (current != row[3]) {
      txt += '<tr class="d0">';
      txt += '<td colspan="'+(maxlen + 8)+'" style="height:5px;"></td></tr>';
      if (color == 'white') {
	color = '#e0e6f8';
      }
      else {
	color = 'white';
      }
    }
    
    if (row[4] == '-' || row[4] == '') {
      txt += '<tr style="background-color:'+color+';display:none;">';
    }
    else {
    txt += '<tr style="background-color:'+color+'">';
    }
    txt += '<td class="alm_line alm_bdl">'+row[1]+'</td>';
    txt += '<td></td>';
    txt += '<td class="alm_line alm_bdl">'+row[2]+'</td>';
    txt += '<td class="alm_bdr"></td>';
        txt += plotWord(row[4], 'td');   

    alms.push(row[4].split(' '));

    /* add missing tds for the rest of the table */
    var clen = maxlen - row[4].split(' ').length + row[4].replace(/[^\(\)]/g, '').length;
    for (var j=0; j < clen; j++) {
      txt += '<td></td>';
    }
    txt += '<td></td>';
    txt += '<td class="alm_bdl alm_line">'+row[3]+'</td>';
    txt += '<td class="alm_line"><input type="checkbox" id="cognates_idx_'+row[0]+'" value="'+row[0]+'"></input></td>';
   
    if (current != row[3]) {
      txt += '<td class="alm_line" style="width:15px;color:'+color+';background-color:'+color+'" rowspan="'+csets[row[3]]+'">';
      txt += '<button title="align the words" onclick="editGroup(event,\''+row[3]+'\')" class="btn-primary btn mleft submit3">';
      txt += '<span class="icon-bar"></span>';
      txt += '<span class="icon-bar"></span>';
      txt += '</button>';
      txt += '</td>';
      current = row[3];
    }
    else {
      current = row[3];  
    }

    txt += '</tr>';
  }
  txt += '</table>';
  tab.innerHTML = txt;
  
  /* reset wordlist selection to the range of selected concepts */
  if (data.length != 0) {
    filterOccurrences(false, selected_concepts);
  }
}

function display_previous_cognate() {
  
  var ccon = CFG['_current_concept'];
  var acon = Object.keys(WLS.concepts);
  var pcon = acon[(acon.indexOf(ccon)-1)];
  display_cognates(pcon);
  document.getElementById('cognates_current_concept').innerHTML = pcon + ' (' +
      WLS['c2i'][pcon]+'/'+WLS.height+')';
  CFG['_current_concept'] = pcon;
}

function display_next_cognate() {

  var ccon = CFG['_current_concept'];
  var ncon = CFG.sorted_concepts[(CFG.sorted_concepts.indexOf(ccon)+1)];
  display_cognates(ncon);

  document.getElementById('cognates_current_concept').innerHTML = ncon + ' (' +
      WLS['c2i'][ncon]+'/'+WLS.height+')';

  CFG['_current_concept'] = ncon;
}

function display_current_cognate() {
  if (!CFG['_concept_multiselect']) {
    var ccon = CFG['_current_concept'];
    display_cognates(ccon);
  }
  else {
    display_cognates();
  }
}

/* get the word indices for all currently selected concepts */
function get_selected_indices() {
  /* get the word ids for the selected concepts */
  var idxs = [];
  var slc = document.getElementById('cognates_select_concepts');

  for (var i=0,option; option=slc.options[i]; i++) {
    if (option.selected) {
      for (var j=0,idx; idx=WLS['concepts'][option.value][j]; j++) {
	idxs.push(idx);
      }
    }
  }
  
  
  var checked = [];
  for (var i=0,idx; idx=idxs[i]; i++) {
    if (document.getElementById('cognates_idx_'+idx).checked) {
      checked.push(idx);
    }
  }

  //-> console.log('checked',checked);

  return checked;
}

/* create a new cognate id for all selected words */
function assign_new_cogid() {
  
  var checked = get_selected_indices();

  /* calculate new cogid */
  var new_cogid = get_new_cogid();
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  /* we submit all at once now to make it faster */
  var ids = [];
  var cols = [];
  var vals = [];

  for (var i=0,chk; chk=checked[i]; i++) {
    WLS[chk][cidx] = new_cogid;
    
    /* add to remote store arrays */
    ids.push(chk);
    cols.push(cidx);
    vals.push(new_cogid);

  }
  
  /* go for remote store */
  storeModification(ids, cols, vals, false);
  
  /* XXX consider not resetting format here ? XXX */
  resetFormat(CFG['formatter']);
  
  display_cognates();
}

/* create a new combined cognate id for all cognate sets whose
 * representatative words are selected */
function combine_cogids() {

  var checked = get_selected_indices();
  
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  /* just get the first of all cogids */
  cogid = false;
  for (var i=0;i<checked.length; i++) {
    var tmp_cogid = WLS[checked[i]][cidx];
    if ((!cogid || 0 < tmp_cogid < cogid || cogid == 0) && tmp_cogid && tmp_cogid != 0) {
	cogid = tmp_cogid;
    }
  }
  
  if (!cogid) {
    cogid = get_new_cogid();
  }

  var ids = [];
  var cols = [];
  var vals = [];
  
  var visited = [];
  for (var i=0,chk; chk=checked[i]; i++) {
    // -> console.log(chk, cidx, WLS[chk]);
    var tmp_cogid = parseInt(WLS[chk][cidx]);
    if (visited.indexOf(tmp_cogid) == -1) {
      if (tmp_cogid && tmp_cogid != 0 && typeof tmp_cogid == 'number') {
	for (var j=0,idx; idx=WLS.etyma[tmp_cogid][j]; j++) {
      	  WLS[idx][cidx] = cogid;
      	  
      	  /* store remote if possible */
      	  ids.push(idx);
	  cols.push(cidx);
	  vals.push(cogid);
	  //storeModification(idx, cidx, cogid, false);
      	}
      }
      else {
	WLS[chk][cidx] = cogid;
	ids.push(chk);
	cols.push(cidx);
	vals.push(cogid);
	//storeModification(chk, cidx, cogid, false);
      }
      visited.push(tmp_cogid);
    }
  }

  /* store modification */
  storeModification(ids, cols, vals, false);

  /* XXX consider not resetting the formatter? */
  resetFormat(CFG['formatter']);
  display_cognates();
}

/* get cognate identifier */
function get_new_cogid() {
  if (!CFG['storable']) {
    var etym_len = Object.keys(WLS.etyma).length;
    for (var i=1; i < etym_len+1; i++) {
      if (!(i in WLS.etyma)) {
        return i;
      }
    }
    return etym_len+1;
  }
  else {
    var cogid = false;
    var url = 'triples/triples.py';
    var postdata = {
      'remote_dbase': CFG['remote_dbase'],
      'file': CFG['filename'],
      'new_id': CFG['formatter']
    };
    $.ajax({
      async: false,
      type: "POST",
      data: postdata,
      contentType: "application/text; charset=utf-8",
      url: url,
      dataType: "text",
      success: function(data) {
	cogid=parseInt(data);
      },
      error: function(){
	fakeAlert("problem retrieving a new cognate ID fromt he dbase");
      }
    });
    return cogid;
  }
}
/* function inserts unique ids for unassigned cognate sets */
function cognateIdentifier(cogid) {
  if ((isNaN(cogid) || isNaN(parseInt(cogid))) || !cogid) {
    var i;
    var etym_len = Object.keys(WLS.etyma).length;
    for (i = 1; i < etym_len + 2; i += 1) {
      if (!(i in WLS.etyma)) {
        return i;
      }
    }
  }
  return cogid;
}
function partialCognateIdentifier(cogids) {
  var tmp = String(cogids).split(/\s+/);
  var start = 1;
  var out = [];
  var etym_len = Object.keys(WLS.roots).length + tmp.length + 1;
  var i, j;
  for (i = 0; i < tmp.length; i += 1) {
    if (isNaN(tmp[i] || isNaN(parseInt(tmp[i])))) {
      for (j = start; j < etym_len; j += 1) {
	      if (!(j in WLS.roots)) {
	        out.push(j);
	        start = j+1;
	        break;
	      }
      }
    }
    else {
      out.push(tmp[i])
    }
  }
  return out.join(' ');
}


var COGNACY = {};

COGNACY.lingpy_cognates = function() {
  console.log('lingpy cognates');
  var date = new Date().toString();
  var feedback = document.getElementById("icognates_table");
  var cognates = (CFG._morphology_mode == "partial") ? CFG._roots : CFG._cognates;
  if (cognates == -1) {
    fakeAlert("You must specify a column to store the cognate judgments in the SETTINGS menu.");
    return;
  }

  var idx;
  var wordlist = "";

  for (idx in WLS) {
    if (!isNaN(idx)) {
      wordlist += idx + "\t" + 
        WLS[idx][CFG._taxa] + "\t" +
        WLS[idx][CFG._concepts] + "\t" +
        WLS[idx][CFG._segments] + "\n";
    }
  }
  var idxs = [];
  var jdxs = [];
  var vals = [];
  $.ajax({
    async: false,
    type: "POST",
    url: 'cognates.py',
    contentType: 'application/text; charset=utf-8',
    data: {
      "wordlist": wordlist,
      "mode": CFG._morphology_mode,
      "ref": WLS.header[cognates]
    },
    dataType: "text",
    success: function(data) {
      showSpinner(function(){
        var lines = data.split("\n");
        var i, line;
        for (i = 0; i < (lines.length - 1); i += 1) {
          line = lines[i].split("\t");
          WLS[line[0]][cognates] = line[1];
          idxs.push(line[0]);
          jdxs.push(cognates);
          vals.push(line[1]);
        }
        storeModification(idxs, jdxs, vals, CFG["async"]);
        if (CFG._morphology_mode == "partial") {
          resetRootFormat(CFG.root_formatter);
        }
        else {
          resetFormat(CFG.formatter);
        }
        showWLS(getCurrent());
        var cogs = (CFG._morphology_mode == "partial") ? Object.keys(WLS.roots).length : Object.keys(WLS.etyma).length;
        feedback.innerHTML = '<table class="data_table2">' +
          "<tr><th>Parameter</th><th>Setting</th></tr>" +
          "<tr><td>Run</td><td>" + date + "</td></tr>" +
          "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
          "<tr><td>Cognate Column</td><td>" + WLS.header[cognates] + "</td></tr>" +
          "<tr><td>Cognate Sets</td><td>" + cogs + "</td></tr>" +
          "<tr><td>Algorithm</td><td>LexStat (LingPy)</td></tr>" +
          "</table>";
      }, 1);
    },
    error: function() {
      fakeAlert("Did not manage to compute cognates.");
    }
  });
  showWLS(getCurrent());
};

COGNACY.compute_cognates = function() {
  var all_cogids = {};
  var i, idx, concept, cogid, cogids, classes, tokstring;
  var formatter = (CFG._morphology_mode == "partial") ? CFG._roots : CFG._cognates;
  if (formatter == -1) {
    fakeAlert("You must specify a column to store the cognate judgments in the SETTINGS menu.");
    return;
  }
  var new_cogid = 1;
  var idxs = [];
  var jdxs = [];
  var vals = [];
  for (idx in WLS) {
    if (!isNaN(idx)) {
      [concept, classes] = [
        WLS[idx][CFG._concepts],
        Array.from(WLS[idx][CFG._segments].split(" "), getSoundClass).join("").replace(/V/g, "")
      ];
      if (CFG._morphology_mode == "partial") {
        console.log(classes);
        classes = classes.split("+");
        cogids = [];
        for (i = 0; i < classes.length; i += 1) {
          tokstring = classes[i] + "HH";
          tokstring = tokstring.slice(0, 2) + " // " + concept;
          if (tokstring in all_cogids) {
            cogid = all_cogids[tokstring];
          }
          else {
            cogid = new_cogid;
            all_cogids[tokstring] = new_cogid;
            new_cogid += 1;
          }
          cogids.push(cogid);
        }
        cogid = cogids.join(" ");
        console.log(cogids);
      }
      else {
        classes += "HH";
        classes.slice(0, 2);
        tokstring = classes + " // " + concept;
        if (tokstring in all_cogids) {
          cogid = all_cogids[tokstring];
        }
        else {
          cogid = new_cogid;
          all_cogids[tokstring] = cogid;
          new_cogid += 1;
        }
      }
      WLS[idx][formatter] = String(cogid);
      idxs.push(idx);
      jdxs.push(formatter);
      vals.push(cogid);
    }
  }
  if (CFG._morphology_mode == "partial") {
    resetRootFormat(CFG.root_formatter);
  }
  else {
    resetFormat(CFG.formatter);
  }
  showWLS(getCurrent());
  var date = new Date().toString();
  var feedback = document.getElementById("icognates_table");
  var mode = (CFG._morphology_mode == "partial") ? CFG.root_formatter : CFG.formatter;
  showSpinner(
    function() {
      storeModification(idxs, jdxs, vals, CFG["async"]);
      var cogs = (CFG._morphology_mode == "partial") ? Object.keys(WLS.roots).length : Object.keys(WLS.etyma).length;
      feedback.innerHTML = '<table class="data_table2">' +
        "<tr><th>Parameter</th><th>Setting</th></tr>" +
        "<tr><td>Run</td><td>" + date + "</td></tr>" +
        "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
        "<tr><td>Cognate Column</td><td>" + mode + "</td></tr>" +
        "<tr><td>Cognate Sets</td><td>" + cogs + "</td></tr>" +
        "<tr><td>Algorithm</td><td>Consonant Classes (EDICTOR)</td></tr>" +
        "</table>";

    }, 
    1
  );
};

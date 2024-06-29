/* Statistic visualization for cognate sets.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-09-29 15:29
 * modified : 2017-10-25 17:27
 *
 */

var SETS = {};
SETS.etd = {};
SETS.current = 0;
SETS.preview = 20;
SETS.matrix = [];
SETS.concepts = {};

/* retrieve concepts to annotate for missing data */
SETS.get_concepts = function(idx, language){
  var concept = WLS[idx][CFG._cidx];
  if (language in SETS.concepts){
    if (concept in SETS.concepts[language]){
      SETS.concepts[language][concept] += 1;
    }
    else {
      SETS.concepts[language][concept] = 1;
    }
  }
  else {
    SETS.concepts[language] = {};
    SETS.concepts[language][concept] = 1;
  }
};

/* function calculates cognates similar to etd in lingpy */
SETS.get_partial_etymdict = function() {
  SETS.etd = {};
  SETS.concepts = {};
  for (var i=0,idx; idx=WLS.rows[i]; i++) {
    var language = WLS[idx][CFG._tidx];
    if (CFG._selected_doculects.indexOf(language) != -1) {
      var cogids = WLS[idx][CFG._roots].split(' ');
      for (var j=0; j<cogids.length; j++) {
        var cogid = cogids[j];
        if (cogid in SETS.etd && cogid != 0) {
          if (language in SETS.etd[cogid]) {
            SETS.etd[cogid][language].push(idx);
          }
          else {
            SETS.etd[cogid][language] = [idx];
          }
        }
        else if (cogid != 0) {
          SETS.etd[cogid] = {};
          SETS.etd[cogid][language] = [idx];
        }
      }
    }
    this.get_concepts(idx, language);
  }
};

SETS.get_etymdict = function(){
  if (CFG._morphology_mode == 'partial') {
    SETS.get_partial_etymdict();
  }
  else {
    SETS.get_normal_etymdict();
  }
}
/* load a normal etymological dictionary (similar to lingpy data-structure) */
SETS.get_normal_etymdict = function() {
  SETS.etd = {};
  SETS.concepts = {};
  for (var i=0,idx; idx=WLS.rows[i]; i++) {
    var language = WLS[idx][CFG._tidx];
    if (CFG._selected_doculects.indexOf(language) != -1) {
      var cogid = WLS[idx][CFG._cognates];
      if (cogid in SETS.etd && cogid != 0) {
        if (language in SETS.etd[cogid]) {
          SETS.etd[cogid][language].push(idx);
        }
        else {
          SETS.etd[cogid][language] = [idx];
        }
      }
      else if (cogid != 0) {
        SETS.etd[cogid] = {};
        SETS.etd[cogid][language] = [idx];
      }
    }
    this.get_concepts(idx, language);
  }
};

SETS.get_matrix = function(lengths) {
  SETS.matrix = [];
  if (typeof lengths == 'undefined') {
    lengths = [];
    for (var i=0; i<CFG._selected_doculects.length; i++) {
      lengths.push(i+1);
    }
  }
  count = 0;
  for (cogid in SETS.etd) {
    if (lengths.indexOf(Object.keys(SETS.etd[cogid]).length) != -1) {
      SETS.matrix.push([cogid]);
      var concepts = [];
      for (var i=0; i<CFG._selected_doculects.length; i++) {
        if (CFG._selected_doculects[i] in SETS.etd[cogid]) {
          SETS.matrix[count].push([SETS.etd[cogid][CFG._selected_doculects[i]], cogid]);
	  for (var j=0, idx; idx=SETS.etd[cogid][CFG._selected_doculects[i]][j]; j++){
	    var concept = WLS.c2i[WLS[idx][CFG._cidx]];
	    if (concepts.indexOf(concept) == -1) {
	      concepts.push(concept);
	    }
	  }
        }
        else {
          SETS.matrix[count].push([]);
        }
      }
      SETS.matrix[count].push(concepts);
      count += 1;
    }
  }
  for (var i=0; i<SETS.matrix.length; i++) {
    for (var j=1; j<CFG._selected_doculects.length+1; j++) {
      var noconcept = true;
      var language = CFG._selected_doculects[(j-1)];
      for (var c=0; c<SETS.matrix[i][CFG._selected_doculects.length+1].length; c++) {
        if (WLS.c2i[SETS.matrix[i][CFG._selected_doculects.length+1][c]] in SETS.concepts[language]){
          noconcept = false;
          break;
        }
      }
      if (noconcept) {
        SETS.matrix[i][j] = [-1];
      }
    }
  }
  SETS.matrix.sort(function (x, y){
    var lastidx = SETS.matrix[0].length-1;
    var pattX = x.slice(1, x.length).map(function (cell){if (cell.length == 0){return 0} else if (cell[0] == -1){return 0} return 1;});
    var pattY = y.slice(1, y.length).map(function (cell){if (cell.length == 0){return 0} else if (cell[0] == -1){return 0} return 1;});
    var conceptA = WLS.c2i[x[lastidx][0]];
    var conceptB = WLS.c2i[y[lastidx][0]];
    if (conceptA == conceptB) {
      return LIST.sum(pattY) - LIST.sum(pattX);
    }
    return conceptA.localeCompare(conceptB);
  });
};

SETS.show_words = function(elm, cell, cogid){

  var idx = cell[0];
  if (CFG._morphology_mode == 'partial') {
    var pidx = WLS[idx][CFG._roots].split(' ').indexOf(cogid);
    var segs = MORPH.get_morphemes(WLS[idx][CFG._segments].split(' '))[pidx].join(' ');
  }
  else {
    var segs = WLS[idx][CFG._segments];
  }
    
  if (elm.innerHTML != ''+idx) {
    elm.innerHTML = idx;
  }
  else {
    elm.innerHTML = plotWord(segs, 'span');
  }
};

SETS.next_preview = function(){
  SETS.current = SETS.current + SETS.preview;
  if (SETS.current >= SETS.matrix.length) {
    SETS.current = 0;
  }
  SETS.simple_refresh();
};

SETS.previous_preview = function(){
  if (SETS.current <= 0) {
    SETS.current = SETS.matrix.length-SETS.preview;
  }
  else {
    SETS.current = SETS.current - SETS.preview;
    if (SETS.current < 0) {
      SETS.current = 0;
    }
  }
  SETS.simple_refresh();
};

SETS.make_nexus = function(){
  if (typeof SETS.matrix == 'undefined' || SETS.matrix.length == 0){
    fakeAlert("Nothing to export!");
    return;
  }
  var nexus = '#NEXUS\n\n';
  nexus += "BEGIN CHARACTERS;\n";
  var previous = 0;
  var last_index = 0;
  for (var i=0; i<SETS.matrix.length; i++) {
    if (SETS.matrix[i][SETS.matrix[i].length-1][0] != previous) {
      if (previous){
	nexus += '    concept_'
	  + previous
	  + '='
	  + (last_index)
	  + '-'
	  + (i)
	  + '; ['+WLS.c2i[previous]+']\n';
      }
      last_index = i+1;
      previous = SETS.matrix[i][SETS.matrix[i].length-1][0];
    }
  }
  nexus += '    concept_'+previous+'='+(last_index)+'-'+(i)+'; ['+WLS.c2i[previous]+']\n';
  nexus += "\nEND; [CHARACTERS]\n"
    + "BEGIN DATA;\n"
    + "DIMENSIONS NTAX="+CFG._selected_doculects.length
    + " NCHAR="+SETS.matrix.length
    + ";\nFORMAT DATATYPE=STANDARD SYMBOLS=\"10\" GAP=- MISSING=? INTERLEAVE=yes;\n"
    + "MATRIX\n"
    ;
  for (var i=0, language; language=CFG._selected_doculects[i]; i++) {
    var this_row = language + "                 ";
    this_row = this_row.slice(0, 19)+" ";
    for (var j=0; j<SETS.matrix.length; j++) {
      var cell = SETS.matrix[j][i+1];
      if (!cell.join('')) {
	this_row += "0";
      }
      else if (cell[0] == -1){
	this_row += "?";
      }
      else {
	this_row += "1";
      }
    }
    nexus += this_row + "\n";
  }
  nexus += ";\nEND;";
  var blob = new Blob([nexus], {type: 'text/plain;charset=utf-8'});
  saveAs(blob, CFG.filename+'.nex');
  return nexus;
};


SETS.simple_refresh = function(){
  document.getElementById('sets_table').innerHTML = SETS.DTAB.render(SETS.current, SETS.matrix[0].length-1, function(x){return x.join(',');});
  document.getElementById('SETS_current').innerHTML = (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets';
  SETS.getSorters();

};

SETS.refresh = function() {
  SETS.current = 0;
  var cid = document.getElementById('sets_select_cognates');
  var clist = [];
  for (var i=0,option; option=cid.options[i]; i++) {
    if (option.selected) {
      clist.push(parseInt(option.value));
    }
  }
  SETS.preview=parseInt(document.getElementById('SETS_preview').value);
  document.getElementById('sets_table').innerHTML = SETS.render_matrix(clist).render(SETS.current, SETS.matrix[0].length-1, function(x){return x.join(',')});
  document.getElementById('SETS_current').innerHTML = (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets';
  SETS.getSorters();
};


SETS.render_matrix = function(lengths) {
  SETS.get_matrix(lengths);
  /* get settings depending on morphology mode */
  if (CFG._morphology_mode == 'partial') {
    var egroup = 'PART.editGroup(event, ';
  }
  else {
    var egroup = 'editGroup(event, ';
  }
  var _columns = function(cell, idx, head) {
    if (cell.length > 0) {
      if (cell[0] == -1){
        return '<td id="SETS_'+head+'_'+idx+'" title="missing data' + 
          '" style="background-color:lightgray;text-align:center;border-radius:50px;padding:0px;margin:0px;border:1px solid black;">Ø</td>';
      }
      return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show segments" onclick="SETS.show_words(this, ['+cell[0].join(',')+'],\''+cell[1]+'\');" ' + 
        'style="text-align:center;border-radius:10px;background-color:lightyellow;color:DarkGreen;">'+cell[0][0]+'</td>';
    }
    else {
      return '<td id="SETS_'+head+'_'+idx+'" title="no cognate' + 
        '" style="padding:0px;margin:0px;border:none;"></td>';
    }
  };
  var _proto_columns = function(cell, idx, head){
    if (cell.length > 0) {
      if (cell[0] == -1){
        return '<td id="SETS_'+head+'_'+idx+'" title="missing data' + 
          '" style="background-color:lightgray;text-align:center;border-radius:50px;padding:0px;margin:0px;border:1px solid black;" onclick="insertProto(this)">Ø</td>';
      }
      return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show segments" onclick="SETS.show_words(this, ['+cell.map(function(x){return x[0]}).join(',')+'],\''+cell[0][1]+'\');" ' + 
        'style="text-align:center;border-radius:10px;background-color:lightyellow;color:DarkGreen;">'+cell[0][0]+'</td>';
    }
    else {
      return '<td id="SETS_'+head+'_'+idx+'" title="no cognate' + 
        '" style="padding:0px;margin:0px;border:none;" onclick="fakeAlert(\'insert new word here\');"></td>';
    }
  };

  var columns = [function(cell, idx, head){
    return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show alignment" onclick="'+egroup+cell+');" ' + 
      'style="text-align:center;border-radius:10px;background-color:salmon;">'+cell+'</td>';
  }];
  for (var i=0; i<CFG._selected_doculects.length; i++) {
    columns.push(_columns);
  }
  columns.push(function(cell, idx, head){
    var concepts = [];
    for (var i=0, cidx; cidx=cell[i]; i++) {
      concepts.push(WLS.c2i[cidx]);
    }
    return '<td class="concepts pointed" id="SETS_'+head+'_'+idx+'" title="click to filter"' + 
      ' onclick="filterOccurrences(\''+CFG._selected_doculects.join(',')+'\',\''+cell.join(',')+'\');">'+concepts.join(',')+'</td>';
  });
  if (CFG._morphology_mode == 'partial') {
    SETS.header = [WLS.header[CFG._roots]];
  }
  else {
    SETS.header = [WLS.header[CFG._cognates]];
  }
  for (var i=0,doculect; doculect=CFG._selected_doculects[i]; i++) {
    SETS.header.push(doculect.slice(0,3));
  }
  SETS.header.push('CONCEPTS');
  var titles = ['cognate sets'].concat(CFG._selected_doculects);
  titles.push('concepts');
  SETS.DTAB = getDTAB('SETS', SETS.header, SETS.matrix, columns, titles, SETS.preview);
  return SETS.DTAB;
};
/* render data in table */
SETS.render_cognates = function() {
  SETS.current = 0;
  SETS.get_etymdict();
  var dtab = SETS.render_matrix();
  var menu =  '<select id="sets_select_cognates" multiple="multiple" class="multiselect" title="Select cognate sets">';
  for (var i=1; i<=CFG._selected_doculects.length; i++) {
    menu += '<option id="sets_'+i+'" value="'+i+'" selected>'+i+' reflexes</option>';
  }
  menu += '</select>';
  menu += '<input id="SETS_preview" title="select preview" style="width:80px;padding:4px;" class="btn btn-primary mright" value="'+SETS.preview+'" type="number"/>';
  menu += '<button class="btn btn-primary mright submit3" onclick="SETS.refresh()" title="update selection">OK</button>';
  menu += '<button class="btn btn-primary mright submit3" onclick="SETS.previous_preview();" title="go to previous items">←</button>';
  menu += '<button id="SETS_current" class="btn btn-primary mright submit3">';
  menu += (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets</button>';
  menu += '<button class="btn btn-primary mright submit3" onclick="SETS.next_preview();" title="go to next items">→</button>';

  menu += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="SETS.make_nexus()"><span class="glyphicon glyphicon-download" title="download nexus"></span></button>';
  menu += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="SETS.render_cognates()"><span class="glyphicon glyphicon-refresh" title="refresh cognates"></span></button>';
  document.getElementById('SETS_menu').innerHTML = menu;

  document.getElementById('sets_table').innerHTML = dtab.render(0, SETS.matrix[0].length-1, function(x){return x.join(',');});
  $('#sets_select_cognates').multiselect({
    disableIfEmtpy: true,
    includeSelectAllOption : true,
    enableFiltering: true,
    maxHeight: window.innerHeight-100,
    buttonClass : 'btn btn-primary mright submit pull-left',
    enableCaseInsensitiveFiltering: true,
    buttonContainer: '<div id="select_sets_button" class="select_button" />',
    buttonText: function (options, select) {
      return 'Select Sets <b class="caret"></b>';
    }
  });
  SETS.getSorters();
};

SETS.getSorters = function(){
  if (CFG._morphology_mode == 'partial') {
    cogidx = CFG._roots;
  }
  else {
    cogidx = CFG._cognates;
  }
  /* construct sorters */
  for (var k=0,head; head=CFG._selected_doculects[k]; k++) {
    var header = document.getElementById('SETS_'+head);
    header.dataset.value = k;
    header.ondblclick=function(){
      var idx = parseInt(this.dataset.value)+1;
      SETS.DTAB.table.sort(function (x, y){
        var idxA = (x[idx].length > 1) ? x[idx][0].join('') : '-1';
        var idxB = (y[idx].length > 1) ? y[idx][0].join('') : '-1';
        var widx = (x[idx].length > 1) ? x[idx][1] : '0';
        var widy = (x[idx].length > 1) ? y[idx][1] : '0';
        if (idxA[0] == '-' && idxB[0] == '-'){
          return 0;
        }
        else if (idxA[0] == '-'){
          return 1;
        }
        else if (idxB[0] == '-'){
          return -1;
        }
        else if (x[idx].length != 0 && y[idx].length != 0) {
          var keysA = Object.keys(SETS.etd[widx]);
          var keysB = Object.keys(SETS.etd[widy]);
          if (keysA.length < keysB.length){return 1;}
          else if (keysA.length > keysB.length){return -1;}
          return keysA.join('').localeCompare(keysB.join(''));
        }
        else if (x[idx].length == 0 && y[idx].length == 0){return 0;}
        else if (x[idx].length == 0){return 1;}
        else if (y[idx].length == 0){return -1;}
        return y[idx].join('').localeCompare(x[idx].join(''));
      });
      SETS.current = 0;
      SETS.simple_refresh();
    };
  }
};



/* Statistic visualization for cognate sets.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-09-29 15:29
 * modified : 2017-09-29 15:29
 *
 */

var SETS = {};
SETS.etd = {};
SETS.current = 0;
SETS.preview = 20;
SETS.matrix = [];
SETS.concepts = {};

/* function calculates cognates similar to etd in lingpy */
SETS.get_etymdict = function() {
  SETS.etd = {};
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
          SETS.matrix[count].push(SETS.etd[cogid][CFG._selected_doculects[i]]);
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
  for (var i=1; i<SETS.matrix.length-1; i++) {
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
};

SETS.show_words = function(elm, cell){
  var idx = cell[0];
  if (elm.innerHTML != ''+idx) {
    elm.innerHTML = idx;
  }
  else {
    elm.innerHTML = plotWord(WLS[idx][CFG._segments], 'span');
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
  var _columns = function(cell, idx, head) {
    if (cell.length > 0) {
      if (cell[0] == -1){
      return '<td id="SETS_'+head+'_'+idx+'" title="missing data' + 
	'" style="background-color:lightgray;text-align:center;border-radius:50px;padding:0px;margin:0px;border:1px solid black;">Ø</td>';
      }
      return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show segments" onclick="SETS.show_words(this, ['+cell.join(',')+']);" ' + 
	'style="text-align:center;border-radius:10px;background-color:lightyellow;color:DarkGreen;">'+cell[0]+'</td>';
    }
    else {
      return '<td id="SETS_'+head+'_'+idx+'" title="no cognate' + 
	'" style="padding:0px;margin:0px;border:none;"></td>';
    }
  };
  var columns = [function(cell, idx, head){
    return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show alignment" onclick="editGroup(event, '+cell+');" ' + 
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
  SETS.header = [WLS.header[CFG._cognates]]
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
  menu += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="SETS.render_cognates()"><span class="glyphicon glyphicon-refresh" title="refresh cognates"></span></button>';
  document.getElementById('SETS_menu').innerHTML = menu;

  document.getElementById('sets_table').innerHTML = dtab.render(0, SETS.matrix[0].length-1, function(x){x.join(',');});
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
  /* construct sorters */
  for (var k=0,head; head=CFG._selected_doculects[k]; k++) {
    var header = document.getElementById('SETS_'+head);
    header.dataset.value = k;
    header.ondblclick=function(){
      var idx = parseInt(this.dataset.value)+1;
      SETS.DTAB.table.sort(function (x, y){
	var idxA = x[idx].join('');
	var idxB = y[idx].join('');
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
	  var keysA = Object.keys(SETS.etd[WLS[x[idx][0]][CFG._cognates]]);
	  var keysB = Object.keys(SETS.etd[WLS[y[idx][0]][CFG._cognates]]);
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



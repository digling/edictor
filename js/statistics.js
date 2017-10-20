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
	    console.log(idx, WLS[idx][CFG._cidx], 'concept, wls');
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
  if (SETS.current > SETS.matrix.length) {
    SETS.current = 0;
  }

  SETS.simple_refresh();
};

SETS.simple_refresh = function(){
  document.getElementById('SETS_DIV').innerHTML = SETS.DTAB.render(SETS.current);
  document.getElementById('SETS_current').innerHTML = (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets';

};

SETS.refresh = function() {
  var cid = document.getElementById('sets_select_cognates');
  var clist = [];
  for (var i=0,option; option=cid.options[i]; i++) {
    if (option.selected) {
      clist.push(parseInt(option.value));
    }
  }
  SETS.preview=parseInt(document.getElementById('SETS_preview').value);
  document.getElementById('SETS_DIV').innerHTML = SETS.render_matrix(clist).render(SETS.current);
  document.getElementById('SETS_current').innerHTML = (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets';
};


SETS.render_matrix = function(lengths) {
  SETS.get_matrix(lengths);
  var _columns = function(cell, idx, head) {
    if (cell.length > 0) {
      return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="click to show segments" onclick="SETS.show_words(this, ['+cell.join(',')+']);" ' + 
	'style="text-align:center;border-radius:10px;background-color:lightyellow;color:DarkGreen;">'+cell[0]+'</td>';
    }
    else {
      return '<td id="SETS_'+head+'_'+idx+'" title="no cognate' + 
	'" style="background-color:white;border:1px solid white;"></td>';
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
  var header = [WLS.header[CFG._cognates]]
  for (var i=0,doculect; doculect=CFG._selected_doculects[i]; i++) {
    header.push(doculect.slice(0,3));
  }
  header.push('CONCEPTS');
  SETS.DTAB = getDTAB('SETS', header, SETS.matrix, columns, CFG._selected_doculects, SETS.preview);
  return SETS.DTAB;
};
/* render data in table */
SETS.render_cognates = function() {
  SETS.current = 0;
  SETS.get_etymdict();
  var text = '<div style="display:block;"><div class="btn-group" style="margin-bottom:10px;margin-right:10px;">' + 
    '<select id="sets_select_cognates" multiple="multiple" class="multiselect" title="Select cognate sets">';
  for (var i=1; i<=CFG._selected_doculects.length; i++) {
    text += '<option id="sets_'+i+'" value="'+i+'" selected>'+i+' reflexes</option>';
  }
  text += '</select>';
  text += '<input id="SETS_preview" title="select preview" style="width:80px;padding:4px;" class="btn btn-primary mright" value="'+SETS.preview+'" type="number"/>';
  text += '<button class="btn btn-primary mright submit3" onclick="SETS.refresh()">OK</button>';
  text += '<button id="SETS_current" class="btn btn-primary mright submit3">';
  text += (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets</button>';
  text += '<button class="btn btn-primary mright submit3" onclick="SETS.next_preview();">→</button>';
  text += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="SETS.render_cognates()"><span class="glyphicon glyphicon-refresh"></span></button>';
  text += '</div>'+
    '<div class="btn-group">'+
    '<button type="button" class="btn-primary titled btn submit3 pull-right" title="show help" onclick="UTIL.show_help(\'sets\', \'SETS_table\', \'SETS\');" style="margin-left:5px;"><span class="glyphicon glyphicon-question-sign"></span></button>'+
    '</div>' +
    '</div>';
  dtab = SETS.render_matrix();

  document.getElementById('SETS').innerHTML = text + '<div id="SETS_DIV" class="pull-left" style="display:block">'+dtab.render(0)+'</div>';
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
};



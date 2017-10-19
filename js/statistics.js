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
      if (cogid in SETS.etd) {
        if (language in SETS.etd[cogid]) {
          SETS.etd[cogid][language].push(idx);
        }
        else {
          SETS.etd[cogid][language] = [idx];
        }
      }
      else {
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
      for (var i=0; i<CFG._selected_doculects.length; i++) {
        if (CFG._selected_doculects[i] in SETS.etd[cogid]) {
          SETS.matrix[count].push(SETS.etd[cogid][CFG._selected_doculects[i]]);
        }
        else {
          SETS.matrix[count].push([]);
        }
      }
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

  SETS.refresh();
};

SETS.refresh = function() {
  var cid = document.getElementById('sets_select_cognates');
  var clist = [];
  for (var i=0,option; option=cid.options[i]; i++) {
    if (option.selected) {
      clist.push(parseInt(option.value));
    }
  }

  document.getElementById('SETS_DIV').innerHTML = SETS.render_matrix(clist).render(SETS.current);
  document.getElementById('SETS_current').innerHTML = (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets';

};


SETS.render_matrix = function(lengths) {
  SETS.get_matrix(lengths);
  console.log(SETS.matrix.length);
  var _columns = function(cell, idx, head) {
    if (cell.length > 0) {
      return '<td class="pointed" id="SETS_'+head+'_'+idx+'" title="'+WLS[cell[0]][CFG._segments]+' '+WLS[cell[0]][CFG._cidx] + 
	'" onclick="SETS.show_words(this, ['+cell.join(',')+']);" ' + 
	'style="background-color:lightyellow;color:DarkGreen;">'+cell[0]+'</td>';
    }
    else {
      return '<td id="SETS_'+head+'_'+idx+'" title="no cognate' + 
	'" style="background-color:black;color:black;"></td>';
    }
  };
  var columns = [''];
  for (var i=0; i<CFG._selected_doculects.length; i++) {
    columns.push(_columns);
  }
  var header = [WLS.header[CFG._cognates]].concat(CFG._selected_doculects);
  var dtab = getDTAB('SETS', header, SETS.matrix, columns, SETS.preview);
  return dtab;
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
  text += '<button class="btn btn-primary mright submit3" onclick="SETS.refresh()">OK</button>';
  text += '<button id="SETS_current" class="btn btn-primary mright submit3">';
  text += (SETS.current+1) + '-'+(SETS.current+SETS.preview)+' of '+Object.keys(SETS.matrix).length+' Sets</button>';
  text += '<button class="btn btn-primary mright submit3" onclick="SETS.next_preview();">→</button>';
  text += '<button class="btn btn-primary mright submit3 pull-right;" style="padding:8px;" onclick="SETS.render_cognates()"><span class="glyphicon glyphicon-refresh"></span></button>';
  text += '</div></div>';
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



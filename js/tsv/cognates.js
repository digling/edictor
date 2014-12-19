/* Cognate selection panel of the edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-12-18 14:11
 * modified : 2014-12-18 14:11
 *
 */

function handle_cognate_selection() {
  
  /* get selector */
  var slc = document.getElementById('cognates_select_concepts');
  
  /* retrieve concepts and add them to selection */
  var txt = '';
  for (concept in WLS['concepts']) {
    txt += '<option value="'+concept+'">'+concept+'</option>';
  }
  slc.innerHTML = txt;
  slc.options[0].selected = true;

  $('#cognates_select_concepts').multiselect({
        disableIfEmtpy: true,
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

  display_cognates();
}

/* function displays all cognates in a table and makes them ready for editing */
function display_cognates() {
  
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

  /* get the selected concep
  /* add first concept */
  var tab = document.getElementById('cognates_table');
  var txt = '<table id="cognates_alignments" class="alignments">';
  var maxlen = 0;
  
  /* store in data array first */
  var data = [];
  var aidx = WLS.header.indexOf('ALIGNMENT');
  var tidx = WLS.header.indexOf('TOKENS');
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  for (var i=0,idx; idx = idxs[i]; i++) {
    var cid = WLS[idx][WLS.header.indexOf('COGID')];
    
    var tks = WLS[idx][aidx];
    if (!tks) {
      var tks = WLS[idx][tidx];
    }
    var doc = WLS[idx][CFG['_tidx']];
    var con = WLS[idx][CFG['_cidx']];
    
    var tkl = tks.replace(/\s*\(\s|\s\)\s*/,'').split(' ').length;
    if (tkl > maxlen) {maxlen = tkl}
    
    data.push([idx,doc,con,cid,tks]);
  }

  txt += '<tr><th class="alm_head alm_bdl">DOCULECT</th>';
  txt += '<th style="width: 5px"></th>';
  txt += '<th class="alm_head alm_bdl">CONCEPT</th>';
  txt += '<th style="width:5px" class="alm_bdr"></th>';
  txt += '<th class="alm_head" colspan="'+maxlen+'">ALIGNMENTS</th>';
  txt += '<th style="width:5px"></th>';
  txt += '<th class="alm_head alm_bdl" colspan="3">EDIT</th></tr>';

  /* sort data according to concept and cognate id and taxon */
  data.sort(
      function(x,y) {
	var _x = [x[2],x[3],x[1]].join(' ');
	var _y = [y[2],y[3],y[1]].join(' ');
	return _x.localeCompare(_y);
      });

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
    txt += '<tr style="background-color:'+color+'">';
    txt += '<td class="alm_line alm_bdl">'+row[1]+'</td>';
    txt += '<td></td>';
    txt += '<td class="alm_line alm_bdl">'+row[2]+'</td>';
    txt += '<td class="alm_bdr"></td>';
        txt += plotWord(row[4], 'td');   

    alms.push(row[4].split(' '));

    /* add missing tds for the rest of the table */
    var clen = maxlen - row[4].split(' ').length;
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
  
  var des = document.getElementById('cognates_description');
  des.innerHTML = 'Showing '+alms.length +' words.';

}

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

  return checked;
}

function assign_new_cogid() {
  
  var checked = get_selected_indices();

  /* calculate new cogid */
  var new_cogid = get_new_cogid();
  var cidx = WLS.header.indexOf(CFG['formatter']);

  for (var i=0,chk; chk=checked[i]; i++) {
    WLS[chk][cidx] = new_cogid;
  }

  resetFormat(CFG['formatter']);
  display_cognates();
}

function combine_cogids() {

  var checked = get_selected_indices();
  
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  /* just get the first of all cogids */
  cogid = false;
  for (var i=0;i<checked.length; i++) {
    var tmp_cogid = WLS[checked[i]][cidx];
    if (!cogid || tmp_cogid < cogid) {
      cogid = tmp_cogid;
    }
  }
  
  var visited = [];
  for (var i=0,chk; chk=checked[i]; i++) {
    var tmp_cogid = parseInt(WLS[chk][cidx]);
    if (visited.indexOf(tmp_cogid) == -1) {
      console.log(WLS.etyma[tmp_cogid]);
      for (var j=0,idx; idx=WLS.etyma[tmp_cogid][j]; j++) {
	WLS[idx][cidx] = cogid;
      }
      visited.push(tmp_cogid);
    }
  }
  resetFormat(CFG['formatter']);
  display_cognates();
}

/* get cognate identifier */
function get_new_cogid() {
  var etym_len = Object.keys(WLS.etyma).length;
  for (var i=1; i < etym_len+1; i++) {
    if (!(i in WLS.etyma)) {
      return i;
    }
  }
  return etym_len+1;
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

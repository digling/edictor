/* simple data table constructor for EDICTOR
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2017-10-19 04:02
 * modified : 2017-10-19 07:13
 *
 */

/* create a datatable */
function getDTAB(name, header, table, columns, titles, preview){
  var DTAB = new Object();
  DTAB.name = name;
  DTAB.table = table;
  DTAB.header = header;
  DTAB.titles = titles;
  DTAB.columns = {};
  for (var i=0; i<columns.length; i++) {
    col = columns[i];
    head = header[i];
    var content = function(cell, idx, head){return '<td id="'+DTAB.name+'_'+head+'_'+idx+'">'+cell+'</td>';};
    if (col != '') {
      content = col;
    }
    DTAB.columns[head] = content;
  }

  DTAB.preview = preview;
  DTAB.idxs = [];
  for (var i=0,col; col=table[i]; i++) {
    DTAB.idxs.push(i);
  }
  DTAB.select = function(from) {
    this.selected = [];
    var preview = from + this.preview;
    if (preview >= DTAB.table.length-1) {
      preview = this.table.length-1;
    }
    for (var i=from; i < preview; i++) {
      this.selected.push(i);
    }
  };
  DTAB.render = function(from, alternate, alternate_function) {
    if (typeof alternate == 'undefined') {
      alternate = this.table[0].length-1;
    }
    if (typeof alternate_function == 'undefined') {
      alternate_function = function (x) { return x;};
    }
    DTAB.select(from);
    text = '';
    text += '<table class="data_table2" id="'+this.name+'_table">';
    text += '<tr id="'+this.name+'_header">';
    for (var i=0,head; head=header[i]; i++) {
      text += '<th title="'+DTAB.titles[i]+'" id="'+this.name+'_'+DTAB.titles[i]+'">'+head+'</th>';
    }
    text += '</tr>';
    var current_item = '???';
    var current_class = 'd0';
    for (var i=0; i < this.selected.length; i++) {
      idx = this.selected[i];
      if (current_item != alternate_function(this.table[idx][alternate])){
	if (current_class == 'd0') {
	  current_class = 'd1';
	}
	else if (current_class == 'd1') {
	  current_class = 'd0';
	}
	current_item = alternate_function(this.table[idx][alternate]);
	text += '<tr style=""><td style="margin:0px;padding:5px;background-color:white;border:0px solid white;" colspan="'+DTAB.table[0].length+'"><hr style="color:black;height:5px;padding:0px;margin:0px;"></td></tr>';
      }
      text += '<tr id="'+this.name+'_row_'+idx+'" class="'+current_class+'">';
      if (typeof this.table[idx] == 'undefined') {
	DTAB.current = 0;
      }
      else {
	for (var j=0, cell; cell=this.table[idx][j]; j++) {
	  text += this.columns[header[j]](cell, idx, header[j]);
	}
      }
      text += '</tr>';
    }
    text += '</table>';
    return text;
  };
  return DTAB;
};



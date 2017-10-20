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
    console.log('DTABxxx', preview, this.preview, from, this.table.length);
    if (this.preview > DTAB.table.length) {
      preview = this.table.length;
    }
    for (var i=from; i < preview; i++) {
      this.selected.push(i);
    }
  };
  DTAB.render = function(from) {
    DTAB.select(from);
    text = '';
    text += '<table class="data_table2" id="'+this.name+'_table">';
    text += '<tr id="'+this.name+'_header">';
    for (var i=0,head; head=header[i]; i++) {
      text += '<th title="'+DTAB.titles[i]+'">'+head+'</th>';
    }
    text += '</tr>';
    for (var i=0; i < this.selected.length; i++) {
      idx = this.selected[i];
      text += '<tr id="'+this.name+'_row_'+idx+'">';
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
    console.log(DTAB.preview, from, DTAB.selected, 'DTAB');
    return text;
  };
  return DTAB;
};



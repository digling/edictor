/* Alignment Editor in a very simplified version for the EDICTOR
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-10-21 12:58
 * modified : 2014-10-21 15:39
 *
 */


var ALIGN = {};
ALIGN.ALMS = [];
ALIGN.TAXA = [];
ALIGN.UDX = [];

ALIGN.normalize = function(alms) {
  /* function normalizes an alignment by adding gaps so that all strings
   * are of equal length */

  /* determine longest string */
  var longest_sequence = 0;
  for (var i=0,alm; alm=alms[i]; i++) {
    if (alm.length > longest_sequence) {
      longest_sequence = alm.length;
    }
  }

  /* add gaps for missing longest seqs */
  for (var i=0,alm; alm=alms[i]; i++) {
    while (alm.length != longest_sequence) {
      alm.push('-');
    }
    alms[i] = alm;
  }

  /* search for completely gapped sites and mark them for deletion */
  var empty_columns = [];
  for (var i=0; i < alms[0].length; i++) {
    var allgap = true;
    for (var j=0; j < alms.length; j++) {
      if (alms[j][i] != '-') {
        allgap = false;
      }
    }
    if (allgap) {
      empty_columns.push(i);
    }
  }

  /* check for unalignable parts */
  if (ALIGN.UDX.length == 0) {
    var unalignable = false;
    var udx = [];
    var minus = 0;
    for (var i=0; i < alms[0].length; i++) {
      if (alms[0][i] == '(') {
        unalignable = true;
        empty_columns.push(i);
        minus += 1;
      }
      else if (unalignable && alms[0][i] != ')') {
        udx.push(i-minus);
      }
      else if (unalignable && alms[0][i] == ')') {
        empty_columns.push(i);
        unalignable = false;
        minus += 1;
      }
    }
    ALIGN.UDX = udx;
  }

  empty_columns.sort();
  console.log('ec',empty_columns);
  console.log('up',udx);

  /* delete allgap columns */
  for (var i=0,row; row=alms[i]; i++) {
    var alm = [];
    for (var j=0,cell; cell=alms[i][j]; j++) {
      if (empty_columns.indexOf(j) == -1) {
        alm.push(cell);
      }
    }
    alms[i] = alm;
  }

  return alms
}

ALIGN.style = function (idx,alm) {
  /* function styles an alignment for easy output */

  /* create identifier */
  txt = '';
  for (var i=0, seg; seg=alm[i]; i++) {
    var idf = 'alm_'+idx+'_'+i;
    var sound_class = getSoundClass(seg);
    
    if (ALIGN.UDX.indexOf(i) != -1) {
      if (sound_class != '-') {
        txt += '<td class="residue dolgo_IGNORE dolgo_'+sound_class+'" id="'+idf+'">'+seg+'</td>';
      }
      else {
        txt += '<td class="residue dolgo_IGNORE dolgo_GAP" id="'+idf+'">'+seg+'</td>';
      }
    }
    else {
      if (sound_class != '-') {
        txt += '<td class="residue pointed dolgo_'+sound_class+'" id="'+idf+
          '" onclick="ALIGN.addGap('+idx+','+i+')">'+seg+'</td>';
      }
      else {
        txt += '<td class="residue dolgo_GAP pointed" id="'+idf+'" '+
          'onclick="ALIGN.delGap('+idx+','+i+')">'+seg+'</td>';
      }
    }
  }
  return txt;
}

ALIGN.make_table = function (taxa, alms) {
  /* function creates a full-fledged alignment table */
  
  var txt = '<table id="alignment_table">';
  for (var i=0,taxon; taxon=taxa[i]; i++) {
    txt += '<tr>';
    txt += '<th class="alm_taxon">'+taxon+'</th>';
    txt += this.style(i+1,alms[i]);
    txt += '</tr>';
  }
  txt += '<tr class="up_fill"><td></td></tr>';
  txt += '<tr id="unalignable"><th>IGNORE</th>';
  for (var i=0; i< alms[0].length; i++) {
    if (ALIGN.UDX.indexOf(i) != -1) {
      txt += '<td class="up_check"><input onchange="ALIGN.reset_UP('+i+')" type="checkbox" name="alignment" value="'+i+'" checked /></td>';
    }
    else {
      txt += '<td class="up_check"><input onchange="ALIGN.reset_UP('+i+')" type="checkbox" name="alignment" value="'+i+'" /></td>';
    }
  }
  txt += '</tr>';
  txt += '</table>';

  return txt;
}

ALIGN.reset_UP = function(idx) {
  if (ALIGN.UDX.indexOf(idx) == -1) {
    ALIGN.UDX.push(idx);
  }
  else {
    delete ALIGN.UDX[ALIGN.UDX.indexOf(idx)];
  }
  ALIGN.refresh();
  //console.log(ALIGN.UDX);
}

ALIGN.export_alignments = function() {
  var alms = [];
  var unalignable = false;
  for (var i=0,alm; alm=ALIGN.ALMS[i]; i++) {
    var out = [];
    for (var j=0,val; val=alm[j]; j++) {
      if (ALIGN.UDX.indexOf(j) != -1) {
        /* just started a new unalignable */
        if (!unalignable) {
          unalignable = true;
          out.push('(');
          out.push(val);
        }
        else if (unalignable) {
          out.push(val);
        }
      }
      else {
        /* if we are still in unalignable mode, we add the bracket */
        if (unalignable) {
          out.push(')');
          out.push(val);
          unalignable = false;
        }
        else {
          out.push(val);
        }
      }
    }
    if (unalignable) {
      out.push(')');
      unalignable = false;
    }
    alms.push(out);
  }
  ALIGN.ALMS = alms;
  ALIGN.UDX = [];
}

ALIGN.destroy_alignment = function()
{
  ALIGN.ALMS = [];
  ALIGN.UDX = [];
  ALIGN.TAXA = [];
}

ALIGN.addGap = function (i,j) {
  /* introduce a gap to the left of an aligned sequence */

  /* determine index of alignment and rebuild the whole stuff with one more gap */
  var alm = ALIGN.ALMS[i-1];
  alm.splice(j,0,"-");
  ALIGN.ALMS[i-1] = alm;
  ALIGN.refresh();

  /* note that this method is really, really simple, but it basically works for 
   * smaller alignments.
   * it may, however, show some performance deficits for larger alignments...
   */
}

ALIGN.delGap = function (i,j) {
  /* delete a gap from an aligned sequence */

  var tmp_alm = ALIGN.ALMS[i-1];
  var new_alm = [];
  for (var k=0,segment; segment=tmp_alm[k]; k++) {
    if (k != j) {
      new_alm.push(segment);
    }
  }
  ALIGN.ALMS[i-1] = new_alm;
  ALIGN.refresh();
}

ALIGN.refresh = function(idx) {

  if (typeof idx == 'undefined') {
    idx = 'alignments';
  }
  
  ALIGN.normalize(ALIGN.ALMS);
  
  txt = ALIGN.make_table(ALIGN.TAXA, ALIGN.ALMS);

  document.getElementById(idx).innerHTML = txt;
}

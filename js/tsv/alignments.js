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

    if (sound_class != '-') {
      txt += '<td class="residue pointed dolgo_'+sound_class+'" id="'+idf+
        '" onclick="ALIGN.addGap('+idx+','+i+')">'+seg+'</td>';
    }
    else {
      txt += '<td class="residue gap pointed" id="'+idf+'" '+
        'onclick="ALIGN.delGap('+idx+','+i+')">'+seg+'</td>';
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
  txt += '</table>';

  return txt;
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

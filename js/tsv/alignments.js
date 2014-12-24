/* Alignment Editor in a very simplified version for the EDICTOR
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-10-21 12:58
 * modified : 2014-12-23 18:55
 *
 */

var ALIGN = {};
ALIGN.ALMS = [];
ALIGN.TAXA = [];
ALIGN.UDX = [];
ALIGN.SEQS = [];
ALIGN.LOCKS = [];

ALIGN.initialize = function(seqs) {
  for (var i=0; i<seqs.length; i++) {
    ALIGN.SEQS.push(seqs[i]);
  }
}
ALIGN.normalize = function(alms) {
  /* function normalizes an alignment by adding gaps so that all strings
   * are of equal length */

  /* check for unalignable parts */
  var brackets = [];
  if (ALIGN.UDX.length == 0) {
    var unalignable = false;
    var udx = [];
    var minus = 0;
    for (var i=0; i < alms[0].length; i++) {
      if (alms[0][i] == '(') {
        unalignable = true;
        brackets.push(i);
        minus += 1;
      }
      else if (unalignable && alms[0][i] != ')') {
        udx.push(i-minus);
      }
      else if (unalignable && alms[0][i] == ')') {
        brackets.push(i);
        unalignable = false;
        minus += 1;
      }
    }
    ALIGN.UDX = udx;
  }

  /* check whether brackets interfere with empty columns, this means
   * that if a full-gap column is followed by a UP column, the index needs
   * to be lowered. In order to guarantee this, we first delete bracket columns,
   * and raise indices if needed, we then delete the rest of the columns */
  
  /* first deal with brackets */
  var udx_error = false;
  for (var i=0; row=alms[i]; i++) {
    var alm = [];
    for (var j=0,cell; cell=alms[i][j]; j++) {
      if (brackets.indexOf(j) == -1 && cell != '(' && cell != ')') {
        alm.push(cell);
      }
      else {
        if (cell != ')' && cell != '(') {
          alm.push(cell);
          udx_error = true;
        }
      }
    }
    alms[i] = alm;
  }

  if (udx_error) {
    ALIGN.UDX = [];
  }

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

  /* now deal with empty columns */
  for (var i=0,row; row=alms[i]; i++) {
    var alm = [];
    for (var j=0,cell; cell=alms[i][j]; j++) {
      if (empty_columns.indexOf(j) == -1) {
        alm.push(cell);
      }
    }
    alms[i] = alm;
  }

  /* lower UDX for everythign higher than empty cols */
  for (var i=0; i< empty_columns.length; i++) {
    var idx = empty_columns[i];
    
    /* check for higher values in UDX than idx */
    var raise_val = false;
    for (var j=0; j < ALIGN.UDX.length; j++) {
      var jdx = ALIGN.UDX[j];
      if (jdx > idx) {
        ALIGN.UDX[j] -=1;
      }
    }
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
    if (ALIGN.LOCKS.indexOf(i) != -1) {
      col = 'lightgray';
    }
    else {
      col = 'white';
    }
    txt += '<th style="background-color:'+col+';" id="alm_'+i+'" onclick="ALIGN.lock_sequence('+i+')" class="pointed alm_taxon">'+taxon+'</th>';
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
    ALIGN.UDX.sort();
  }
  else {
    var alm_len = ALIGN.ALMS[0].length;
    ALIGN.UDX.sort();
    var delidx = ALIGN.UDX.indexOf(idx);
    var new_udx = [];
    var in_udx = [];
    for (var i=0; i<ALIGN.UDX.length; i++) {
      if (i != delidx && in_udx.indexOf(ALIGN.UDX[i]) == -1 && ALIGN.UDX[i] < alm_len) {
	new_udx.push(ALIGN.UDX[i]);
	in_udx.push(ALIGN.UDX[i]);
      }
    }
    ALIGN.UDX = new_udx;
  }
  //->console.log('udx',ALIGN.UDX);
  ALIGN.refresh();
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
  ALIGN.SEQS = [];
  ALIGN.LOCKS = [];
}

/* funciton introduces a gap on the left of a segment in an alignment */
ALIGN.addGap = function (idx,jdx) {

  /* check whether idx is in locks */
  var check = ALIGN.LOCKS.indexOf(idx-1);
  
  /* we now iterate over all items in locks and give them the 
   * same treatment as we already settled for the other items 
   * before. */
  if (check != -1) {
    var idxs = ALIGN.LOCKS;
    //->//->console.log(ALIGN.LOCKS);
  }
  else {
    var idxs = [idx-1];
  }

  /* determine index of alignment and rebuild the whole stuff with one more gap */
  /* if no unalignable parts are used, this is simple to do */
  if (ALIGN.UDX.length == 0) {

    for (var i=0; i<idxs.length; i++) {
      var tdx = idxs[i];
      var alm = ALIGN.ALMS[tdx];
      alm.splice(jdx,0,"-");
      ALIGN.ALMS[tdx] = alm;
      //->//->console.log(tdx,alm);
    }

    ALIGN.refresh();

    /* note that this method is really, really simple, but it basically works for 
    * smaller alignments.
    * it may, however, show some performance deficits for larger alignments...
    */
  }

  /* if we have unalignable parts, we need to keep track of them and insert
   * the gap before the next part starts */
  else {
    /* first get the current index and determine, whether it is followed by an 
     * unalignable part */
    var first_idx = false;
    var nidx = false;
    for (var i=0; i < ALIGN.UDX.length; i++) {
      var udx = ALIGN.UDX[i];
      if (udx > jdx && !first_idx) {
        first_idx = true;
        nidx = udx;
      }
    }
    //->//->console.log('ndx',nidx,jdx,ALIGN.UDX, first_idx)
    /* XXX doesn't work here with the code XXX */
    if (nidx) {
      //->console.log('addgap,after',ALIGN.UDX,jdx);
      /* insert gap before the segment */
      for (var j=0; j < idxs.length; j++) {
	var tdx = idxs[j];
	var alm = ALIGN.ALMS[tdx];
	alm.splice(jdx,0,'-');
      }

      /* insert gap after all other segments */
      for (var j=0; j < ALIGN.ALMS.length; j++) {
	if (idxs.indexOf(j) == -1) {
	  ALIGN.ALMS[j].splice(nidx,0,'-');
	}
      }
      //for (var i=0,alm; alm=ALIGN.ALMS[i]; i++) {
      //  if (ALIGN.LOCKS.indexOf(i) != -1) {
      //    alm.splice(nidx,0,'-');
      //  }
      //}
      for (var i=0; i<ALIGN.UDX.length; i++) {
        var udx = ALIGN.UDX[i];
        if (udx >= nidx) {
          ALIGN.UDX[i] += 1;
        }
      }
      //->console.log(ALIGN.UDX);
      ALIGN.refresh();
    }
    else {

      for (var i=0; i<idxs.length; i++) {
        var tdx = idxs[i];
        var alm = ALIGN.ALMS[tdx];
        alm.splice(jdx,0,"-");
        ALIGN.ALMS[tdx] = alm;
        //->//->console.log(tdx,alm);
      }

      ALIGN.refresh();
    }
  }
}

ALIGN.delGap = function (idx,jdx) {
  /* delete a gap from an aligned sequence */
  var check = ALIGN.LOCKS.indexOf(idx-1);
  if (check != -1) {
    var idxs = ALIGN.LOCKS;
  }
  else {
    var idxs = [idx-1];
  } 
  
  if (ALIGN.UDX.length == 0) {

    /* now we iterate for all items in idxs */
    for (var j=0; j<idxs.length; j++) {
      var tdx = idxs[j];
      var tmp_alm = ALIGN.ALMS[tdx];
      var new_alm = [];
      for (var k=0,segment; segment=tmp_alm[k]; k++) {
	if (k != jdx) {
	  new_alm.push(segment);
	}
      }
      ALIGN.ALMS[tdx] = new_alm;
    }
    ALIGN.refresh();
  }
  else {
    /* determine which strings are involved */
    var first_idx = false;
    var nidx = false;
    for (var i=0;i < ALIGN.UDX.length;i++) {
      var udx = ALIGN.UDX[i];
      if (udx > jdx && !first_idx) {
        first_idx = true;
        nidx = udx;
      }
    }
    /* XXX doesn't work here with the code XXX */
    if (nidx) {
      //->console.log('delgap,gap-after',ALIGN.UDX,idxs,jdx)
      
      /* check for bad delete position right before the element 
       * beware that we do not allow to delete an element just
       * before the end of an alignment, make also sure to append
       * a new element to fill the shift right before the 
       * index of the uneditable column */
      if (nidx - jdx != 1) {
	for (var j=0;j<idxs.length;j++) {
	var tdx = idxs[j];
	var tmp_alm = ALIGN.ALMS[tdx];
	var new_alm = [];
	for (var i=0,segment; segment=tmp_alm[i]; i++) {
	  //->console.log(segment,i,idx,jdx,nidx);
	  if (i == jdx-1) {
	    new_alm.push(segment);
	  }
	  else if (i == nidx-1) {
	    new_alm.push(segment);
	    new_alm.push('-');
	  }
	  else if (i != jdx) {
	    new_alm.push(segment);
	  }
	}
	ALIGN.ALMS[tdx] = new_alm;
	}
	ALIGN.refresh();
      }
    }
    else {
      //->console.log('delgap,gap-before',ALIGN.UDX,idxs,jdx)
      for (var j=0; j<idxs.length; j++) {
        var tdx = idxs[j];
        var tmp_alm = ALIGN.ALMS[tdx];
        var new_alm = [];
        for (var k=0,segment; segment=tmp_alm[k]; k++) {
          if (k != jdx) {
            new_alm.push(segment);
          }
        }
        ALIGN.ALMS[tdx] = new_alm;
      }
      ALIGN.refresh();
    }
  }
}

ALIGN.refresh = function(idx) {

  if (typeof idx == 'undefined') {
    idx = 'alignments';
  }
  
  ALIGN.normalize(ALIGN.ALMS);
  
  txt = ALIGN.make_table(ALIGN.TAXA, ALIGN.ALMS);

  document.getElementById(idx).innerHTML = txt;
}

/* function locks an alignment and treats all locked sequences as the
 * same when using the alignment operations */
ALIGN.lock_sequence = function(i) {
  var idx = ALIGN.LOCKS.indexOf(i);
  
  if (idx == -1) {
    ALIGN.LOCKS.push(i);
  }
  else {
    var new_lock = [];
    for (var j=0;j<ALIGN.LOCKS.length; j++) {
      if (ALIGN.LOCKS[j] != i) {
	new_lock.push(ALIGN.LOCKS[j]);
      }
    }
    ALIGN.LOCKS = new_lock;
  }
  ALIGN.refresh();
}


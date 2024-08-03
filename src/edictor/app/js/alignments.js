/* Alignment Editor in a very simplified version for the EDICTOR
 */

/* jshint esversion: 6 */


const ALIGN = {};
ALIGN.ALMS = [];
ALIGN.TAXA = [];
ALIGN.UDX = [];
ALIGN.SEQS = [];
ALIGN.LOCKS = [];

ALIGN.alignable_parts = function (seq) {
  "use strict";
  let open = false;
  const out = [];
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === '(') {
      open = true;
    } else if (seq[i] === ')') {
      open = false;
    } else {
      if (!open) {
        out.push(seq[i]);
      }
    }
  }
  return out;
};


ALIGN.initialize = function (seqs) {
  "use strict";
  let i;
  for (i = 0; i < seqs.length; i += 1) {
    ALIGN.SEQS.push(seqs[i]);
  }
};


ALIGN.normalize = function (alms) {

  /* now deal with empty columns */
  let alm;
  "use strict";
  /* function normalizes an alignment by adding gaps so that all strings
   * are of equal length */

  /* check for unalignable parts */
  const brackets = [];
  let udx_error = false;
  let i, j, unalignable, udx, minus, cell, row;

  if (this.UDX.length === 0) {
    unalignable = false;
    udx = [];
    minus = 0;
    for (i = 0; i < alms[0].length; i++) {
      if (alms[0][i] === '(') {
        unalignable = true;
        brackets.push(i);
        minus += 1;
      } else if (unalignable && alms[0][i] !== ')') {
        udx.push(i - minus);
      } else if (unalignable && alms[0][i] === ')') {
        brackets.push(i);
        unalignable = false;
        minus += 1;
      }
    }
    this.UDX = udx;
  }

  /* check whether brackets interfere with empty columns, this means
   * that if a full-gap column is followed by a UP column, the index needs
   * to be lowered. In order to guarantee this, we first delete bracket columns,
   * and raise indices if needed, we then delete the rest of the columns */

  /* first deal with brackets */
  for (i = 0; i < alms.length; i += 1) {
    row = alms[i];
    alm = [];
    for (j = 0; j < alms[i].length; j += 1) {
      cell = alms[i][j];
      if (brackets.indexOf(j) === -1 && cell !== '(' && cell !== ')') {
        alm.push(cell);
      } else {
        if (cell !== ')' && cell !== '(') {
          alm.push(cell);
          udx_error = true;
        }
      }
    }
    alms[i] = alm;
  }

  if (udx_error) {
    this.UDX = [];
  }

  /* determine longest string */
  let longest_sequence = 0;
  for (i = 0; i < alms.length; i++) {
    alm = alms[i];
    if (alm.length > longest_sequence) {
      longest_sequence = alm.length;
    }
  }

  /* add gaps for missing longest seqs */
  for (i = 0; i < alms.length; i += 1) {
    alm = alms[i];
    while (alm.length !== longest_sequence) {
      alm.push('-');
    }
    alms[i] = alm;
  }

  /* search for completely gapped sites and mark them for deletion */
  const empty_columns = [];
  for (i = 0; i < alms[0].length; i++) {
    let allgap = true;
    for (j = 0; j < alms.length; j++) {
      if (alms[j][i] !== '-') {
        allgap = false;
      }
    }
    if (allgap) {
      empty_columns.push(i);
    }
  }
  for (i = 0; i < alms.length; i += 1) {
    row = alms[i];
    alm = [];
    for (j = 0; j < alms[i].length; j += 1) {
      cell = alms[i][j];
      if (empty_columns.indexOf(j) === -1) {
        alm.push(cell);
      }
    }
    alms[i] = alm;
  }

  /* lower UDX for everythign higher than empty cols */
  for (i = 0; i < empty_columns.length; i++) {
    const idx = empty_columns[i];

    /* check for higher values in UDX than idx */
    for (j = 0; j < this.UDX.length; j++) {
      const jdx = this.UDX[j];
      if (jdx > idx) {
        this.UDX[j] -= 1;
      }
    }
  }

  return alms;
};


ALIGN.irregular = function(idx, jdx, event) {
  "use strict";
  event.preventDefault();
  let segment = this.ALMS[idx - 1][jdx];
  if (segment[0] === "!" && segment.indexOf("/") !== -1) {
    segment = segment.slice(1, segment.length).split("/")[0];
  }
  else {
    segment = "!" + segment + "/" + CFG.missing_marker;
  }
  this.ALMS[idx - 1][jdx] = segment;
  this.refresh();
};

ALIGN.style = function (idx, alm) {
  "use strict";
  /* function styles an alignment for easy output */
  let i, seg, idf, sound_class, phon, dolgo;

  /* create identifier */
  let txt = '';
  txt += '<td class="pre-align residue pointed" title="drag sequence to the left" onclick="ALIGN.dragToLeft(' + idx + ');">←</td>';
  for (i = 0; i < alm.length; i += 1) {
    seg = alm[i];
    idf = 'alm_' + idx + '_' + i;
    sound_class = getSoundClass(seg);
    /* check for sounds annotated to be bad */
    //if ((seg[0] == '!' || seg[0] == '?') && seg.length > 1) {seg = seg.slice(1, seg.length)}

    if (this.UDX.indexOf(i) !== -1) {
      [phon, dolgo] = plotPhon(seg);

      if (seg !== CFG.gap_marker) {
        txt += '<td class="residue dolgo_IGNORE ' + dolgo + '" id="' + idf + '">' + phon + '</td>';
      } else {
        txt += '<td class="residue dolgo_IGNORE dolgo_GAP" id="' + idf + '">' + seg + '</td>';
      }
    } else {
      [phon, dolgo] = plotPhonGeneric(seg);
      if (seg !== CFG.gap_marker) {
        txt += '<td class="residue pointed ' + dolgo + '" id="' + idf +
            '" onclick="ALIGN.addGap(' + idx + ',' + i + ')" ' +
            'oncontextmenu="ALIGN.irregular(' + idx + ',' + i + ',event)"' +
            '>' + phon + '</td>';
      } else {
        txt += '<td class="residue dolgo_GAP pointed" id="' + idf + '" ' +
            'onclick="ALIGN.delGap(' + idx + ',' + i + ')" ' +
            'oncontextmenu="ALIGN.irregular(' + idx + ',' + i + ',event)"' +
            '>' + seg + '</td>';
      }
    }
  }
  return txt;
};

ALIGN.make_table = function (taxa, alms) {
  "use strict";
  /* function creates a full-fledged alignment table */

  let txt = '<table id="alignment_table">';
  let i, col, taxon;
  for (i = 0; i < taxa.length; i++) {
    taxon = taxa[i];
    txt += '<tr>';
    if (this.LOCKS.indexOf(i) !== -1) {
      col = 'lightgray';
    } else {
      col = 'white';
    }
    txt += '<th style="background-color:' + col + ';" id="alm_' + i + '" oncontextmenu="this.lock_sequences(' + i + ',event)" onclick="ALIGN.lock_sequence(' + i + ')" class="pointed alm_taxon">' + taxon + '</th>';
    txt += this.style(i + 1, alms[i]);
    txt += '</tr>';
  }
  txt += '<tr class="up_fill"><td></td></tr>';
  txt += '<tr id="unalignable"><th>IGNORE</th><td></td>';
  for (i = 0; i < alms[0].length; i += 1) {
    if (this.UDX.indexOf(i) !== -1) {
      txt += '<td class="up_check"><input onchange="ALIGN.reset_UP(' + i + ')" type="checkbox" name="alignment" value="' + i + '" checked /></td>';
    } else {
      txt += '<td class="up_check"><input onchange="ALIGN.reset_UP(' + i + ')" type="checkbox" name="alignment" value="' + i + '" /></td>';
    }
  }
  txt += '</tr>';
  txt += '</table>';

  return txt;
};

ALIGN.reset_UP = function(idx) {
  "use strict";
  if (this.UDX.indexOf(idx) === -1) {
    this.UDX.push(idx);
    this.UDX.sort();
  }
  else {
    const alm_len = this.ALMS[0].length;
    this.UDX.sort();
    const delidx = this.UDX.indexOf(idx);
    const new_udx = [];
    const in_udx = [];
    for (let i=0; i<this.UDX.length; i++) {
      if (i !== delidx && in_udx.indexOf(this.UDX[i]) === -1 && this.UDX[i] < alm_len) {
	new_udx.push(this.UDX[i]);
	in_udx.push(this.UDX[i]);
      }
    }
    this.UDX = new_udx;
  }
  //->console.log('udx',this.UDX);
  this.refresh();
};

/* make alignments ready to be written to text, especially with their unalignable parts */
ALIGN.export_alignments = function () {
  "use strict";
  const alms = [];
  let unalignable = false;
  let i, alm, j, val;
  for (i = 0; i < this.ALMS.length; i += 1) {
    alm = this.ALMS[i];
    const out = [];
    for (j = 0; j < alm.length; j += 1) {
      val = alm[j];
      if (this.UDX.indexOf(j) !== -1) {
        /* just started a new unalignable */
        if (!unalignable) {
          unalignable = true;
          out.push('(');
          out.push(val);
        } else if (unalignable) {
          out.push(val);
        }
      } else {
        /* if we are still in unalignable mode, we add the bracket */
        if (unalignable) {
          out.push(')');
          out.push(val);
          unalignable = false;
        } else {
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
  this.ALMS = alms;
  this.UDX = [];
};


ALIGN.destroy_alignment = function()
{
  "use strict";
  this.ALMS = [];
  this.UDX = [];
  this.TAXA = [];
  this.SEQS = [];
  this.LOCKS = [];
};


/* function drags one sequence to the left in the beginning of an alignment.
 * this is convenient to correct one sequence that should be pulled to the left, and faster than
 * pushing all other sequences to the right */
ALIGN.dragToLeft = function (idx) {
  "use strict";
  /* check whether idx is in locks */
  const check = this.LOCKS.indexOf(idx - 1);
  /* we now iterate over all items in locks and give them the 
   * same treatment as we already settled for the other items 
   * before. */
  let idxs, i, j, alm, tdx, nidx, fidx;
  if (check !== -1) {
    idxs = this.LOCKS;
  } else {
    idxs = [idx - 1];
  }
  /* determine index of alignment and rebuild the whole stuff with one more gap */
  /* if no unalignable parts are used, this is simple to do */
  if (this.UDX.length === 0) {
    for (i = 0; i < this.ALMS.length; i += 1) {
      if (idxs.indexOf(i) === -1) {
        alm = this.ALMS[i];
        alm.splice(0, 0, "-");
        this.ALMS[idx] = alm;
      }
    }
    this.refresh();
    /* note that this method is really, really simple, but it basically works for 
    * smaller alignments.
    * it may, however, show some performance deficits for larger alignments...
    */
  }
  /* if we have unalignable parts, we need to keep track of them and insert
   * the gap before the next part starts */
  else {
    /* first get the first alignable part */
    nidx = false;
    fidx = -1;
    for (i = 0; i < this.ALMS[0].length; i++) {
      if (this.UDX.indexOf(i) === -1 && fidx === -1) {
        fidx = i;
      }
      if (this.UDX.indexOf(i) === -1 && fidx !== -1) {
        nidx = i;
      }
      if (this.UDX.indexOf(i) !== -1 && fidx !== -1 && nidx !== -1) {
        break;
      }
    }
    /* insert gap before all other segments */
    for (j = 0; j < this.ALMS.length; j++) {
      if (idxs.indexOf(j) === -1) {
        alm = this.ALMS[j];
        alm.splice(fidx, 0, '-');
      }
    }
    /* insert gap after the segment */
    for (j = 0; j < idxs.length; j++) {
      tdx = idxs[j];
      this.ALMS[tdx].splice(nidx + 1, 0, '-');
    }
    for (i = 0; i < this.UDX.length; i++) {
      const udx = this.UDX[i];
      if (udx > nidx) {
        this.UDX[i] += 1;
      }
    }
    this.refresh();
  }
};

/* funciton introduces a gap on the left of a segment in an alignment */
ALIGN.addGap = function (idx, jdx) {
  "use strict";
  /* check whether idx is in locks */
  const check = this.LOCKS.indexOf(idx - 1);

  /* we now iterate over all items in locks and give them the 
   * same treatment as we already settled for the other items 
   * before. */
  let idxs;
  if (check !== -1) {
    idxs = this.LOCKS;
  } else {
    idxs = [idx - 1];
  }

  /* determine index of alignment and rebuild the whole stuff with one more gap */
  /* if no unalignable parts are used, this is simple to do */
  let i, j, tdx, alm, udx;
  if (this.UDX.length === 0) {
    for (i = 0; i < idxs.length; i++) {
      tdx = idxs[i];
      alm = this.ALMS[tdx];
      alm.splice(jdx, 0, "-");
      this.ALMS[tdx] = alm;
    }

    this.refresh();

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
    let first_idx = false;
    let nidx = false;
    for (i = 0; i < this.UDX.length; i++) {
      udx = this.UDX[i];
      if (udx > jdx && !first_idx) {
        first_idx = true;
        nidx = udx;
      }
    }
    //->//->console.log('ndx',nidx,jdx,this.UDX, first_idx)
    /* XXX doesn't work here with the code XXX */
    if (nidx) {
      //->console.log('addgap,after',this.UDX,jdx);
      /* insert gap before the segment */
      for (j = 0; j < idxs.length; j++) {
        tdx = idxs[j];
        alm = this.ALMS[tdx];
        alm.splice(jdx, 0, '-');
      }

      /* insert gap after all other segments */
      for (j = 0; j < this.ALMS.length; j++) {
        if (idxs.indexOf(j) === -1) {
          this.ALMS[j].splice(nidx, 0, '-');
        }
      }
      for (i = 0; i < this.UDX.length; i++) {
        udx = this.UDX[i];
        if (udx >= nidx) {
          this.UDX[i] += 1;
        }
      }
      this.refresh();
    } 
    else {
      for (i = 0; i < idxs.length; i++) {
        tdx = idxs[i];
        alm = this.ALMS[tdx];
        alm.splice(jdx, 0, "-");
        this.ALMS[tdx] = alm;
      }
      this.refresh();
    }
  }
};


ALIGN.delGap = function (idx, jdx) {
  "use strict";
  /* delete a gap from an aligned sequence */
  const check = ALIGN.LOCKS.indexOf(idx - 1);
  let idxs, i, j, k, tdx, tmp_alm, new_alm, segment, first_idx, nidx, udx;
  if (check !== -1) {
    idxs = ALIGN.LOCKS;
  } else {
    idxs = [idx - 1];
  }

  if (ALIGN.UDX.length === 0) {

    /* now we iterate for all items in idxs */
    for (j = 0; j < idxs.length; j++) {
      tdx = idxs[j];
      tmp_alm = ALIGN.ALMS[tdx];
      new_alm = [];
      for (k = 0; k < tmp_alm.length; k += 1) {
        segment = tmp_alm[k];
        /* not that it is of great importance here to *check* before
         * not appending an element to the new sequence, since we do
         * never want to remove segments from an alignment but only
         * gaps when removing a gap, but if we lock sequences, we may
         * do that without actually indending it */
        if (k !== jdx || segment !== '-') {
          new_alm.push(segment);
        }
      }
      ALIGN.ALMS[tdx] = new_alm;
    }
    ALIGN.refresh();
  } else {
    /* determine which strings are involved */
    first_idx = false;
    nidx = false;
    for (i = 0; i < ALIGN.UDX.length; i++) {
      udx = ALIGN.UDX[i];
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
      if (nidx - jdx !== 1) {
        for (j = 0; j < idxs.length; j++) {
          tdx = idxs[j];
          tmp_alm = ALIGN.ALMS[tdx];
          new_alm = [];
          for (i = 0; i < tmp_alm.length; i += 1) {
            segment = tmp_alm[i];
            //->console.log(segment,i,idx,jdx,nidx);
            if (i === jdx - 1) {
              new_alm.push(segment);
            } else if (i === nidx - 1) {
              new_alm.push(segment);
              new_alm.push('-');
            } else if (i !== jdx || segment !== '-') {
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
      for (j = 0; j < idxs.length; j++) {
        tdx = idxs[j];
        tmp_alm = ALIGN.ALMS[tdx];
        new_alm = [];
        for (k = 0; k < tmp_alm.length; k++) {
          segment = tmp_alm[k];
          if (k !== jdx || segment !== '-') {
            new_alm.push(segment);
          }
        }
        ALIGN.ALMS[tdx] = new_alm;
      }
      ALIGN.refresh();
    }
  }
};



ALIGN.refresh = function(idx) {
  "use strict";

  if (typeof idx === 'undefined') {
    idx = 'alignments';
  }
  ALIGN.normalize(this.ALMS);
  document.getElementById(idx).innerHTML = ALIGN.make_table(this.TAXA, this.ALMS);
};

/* function locks an alignment and treats all locked sequences as the
 * same when using the alignment operations */
ALIGN.lock_sequence = function(i) {
  "use strict";
  const idx = ALIGN.LOCKS.indexOf(i);
  let j;
  if (idx === -1) {
    ALIGN.LOCKS.push(i);
  }
  else {
    const new_lock = [];
    for (j = 0; j < ALIGN.LOCKS.length; j += 1) {
      if (ALIGN.LOCKS[j] !== i) {
        new_lock.push(ALIGN.LOCKS[j]);
      }
    }
    ALIGN.LOCKS = new_lock;
  }
  ALIGN.refresh();
};

/* function locks an alignment and treats all locked sequences as the
 * same when using the alignment operations */
ALIGN.lock_sequences = function (i, event) {
  "use strict";
  event.preventDefault();

  let check = 0;
  let new_lock = [];
  let j;
  for (j = 0; j < ALIGN.ALMS.length; j++) {
    if (j !== i) {
      new_lock.push(j);
      if (ALIGN.LOCKS.indexOf(j) !== -1) {
        check += 1;
      }
    }
  }

  if (check === ALIGN.LOCKS.length && check !== 0) {
    new_lock = [];
  }
  //->console.log(check, new_lock, ALIGN.LOCKS);

  ALIGN.LOCKS = new_lock;
  ALIGN.refresh();
};

ALIGN.lingpy_alignments = function () {
  "use strict";
  const date = new Date().toString();
  const feedback = document.getElementById("ialms_table");
  const cognates = (CFG._morphology_mode === "partial") ? CFG._roots : CFG._cognates;
  let idx;
  let wordlist = "";

  for (idx in WLS) {
    if (WLS.hasOwnProperty(idx)) {
      if (!isNaN(idx)) {
        wordlist += idx + "\t" +
            WLS[idx][CFG._taxa] + "\t" +
            WLS[idx][CFG._concepts] + "\t" +
            WLS[idx][CFG._segments] + "\t" +
            WLS[idx][cognates] + "\n";
      }
    }
  }
  const idxs = [];
  const jdxs = [];
  const vals = [];
  $.ajax({
    async: false,
    type: "POST",
    url: 'alignments.py',
    contentType: 'application/text; charset=utf-8',
    data: {
      "wordlist": wordlist,
      "mode": CFG._morphology_mode,
      "ref": WLS.header[cognates]
    },
    dataType: "text",
    success: function (data) {
      showSpinner(function () {
        const lines = data.split("\n");
        let i, line;
        for (i = 0; i < (lines.length - 1); i += 1) {
          line = lines[i].split("\t");
          WLS[line[0]][CFG._alignments] = line[1];
          idxs.push(line[0]);
          jdxs.push(CFG._alignments);
          vals.push(line[1]);
        }
        storeModification(idxs, jdxs, vals, CFG.async);
        showWLS(getCurrent());
        feedback.innerHTML = '<table class="data_table2">' +
            "<tr><th>Parameter</th><th>Setting</th></tr>" +
            "<tr><td>Run</td><td>" + date + "</td></tr>" +
            "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
            "<tr><td>Alignment Column</td><td>" + CFG._almcol + "</td></tr>" +
            "<tr><td>Cognate Column</td><td>" + WLS.header[cognates] + "</td></tr>" +
            "<tr><td>Algorithm</td><td>SCA (LingPy)</td></tr>" +
            "</table>";
      }, 1);
    },
    error: function () {
      fakeAlert("Did not manage to compute alignments.");
    }
  });

};

ALIGN.automated_alignments = function () {
  "use strict";
  console.log("starting");
  const date = new Date().toString();
  const feedback = document.getElementById("ialms_table");
  const cognates = (CFG._morphology_mode === "partial") ? CFG._roots : CFG._cognates;
  const roots = (CFG._morphology_mode === "partial") ? WLS.roots : WLS.etyma;
  const mode = (CFG._morphology_mode === "partial") ? CFG.root_formatter : CFG.formatter;
  let key, idxs, idx, i, pos, tks, alms, segments;
  const aligned = {};
  for (key in roots) {
    if (roots.hasOwnProperty(key)) {
      segments = [];
      idxs = roots[key];
      for (i = 0; i < idxs.length; i += 1) {
        if (CFG._morphology_mode === "partial") {
          [idx, pos] = idxs[i];
          tks = WLS[idx][CFG._segments].split(" + ")[pos];
        } else {
          [idx, pos] = [idxs[i], 0];
          tks = WLS[idx][CFG._segments];
        }
        segments.push(tks.split(" "));
      }
      alms = scalign(segments);
      for (i = 0; i < idxs.length; i += 1) {
        if (CFG._morphology_mode === "partial") {
          idx = idxs[i][0];
        } else {
          idx = idxs[i];
        }
        if (idx in aligned) {
          aligned[idx][key] = alms[i];
        } else {
          aligned[idx] = {};
          aligned[idx][key] = alms[i];
        }
      }
    }
  }
  /* add data to alignments now */
  let cogids, alm;
  idxs = [];
  const jdxs = [];
  const vals = [];
  for (idx in WLS) {
    if (WLS.hasOwnProperty(idx)) {
      if (!isNaN(idx)) {
        cogids = String(WLS[idx][cognates]).split(" ");
        alm = [];
        for (i = 0; i < cogids.length; i += 1) {
          try {
            alm.push(aligned[idx][cogids[i]].join(" "));
          } catch (error) {
            if (CFG._morphology_mode === "partial") {
              alm.push(WLS[idx][CFG._segments].split(" + ")[i]);
            } else {
              alm.push(WLS[idx][CFG._segments]);
            }
          }
        }
        WLS[idx][CFG._alignments] = alm.join(" + ");
        idxs.push(idx);
        jdxs.push(CFG._alignments);
        vals.push(alm.join(" + "));
      }
    }
  }
  showWLS(getCurrent());
  showSpinner(
      function () {
        storeModification(idxs, jdxs, vals, CFG.async);
        feedback.innerHTML = '<table class="data_table2">' +
            "<tr><th>Parameter</th><th>Setting</th></tr>" +
            "<tr><td>Run</td><td>" + date + "</td></tr>" +
            "<tr><td>Cognate Mode</td><td>" + CFG._morphology_mode + "</td></tr>" +
            "<tr><td>Alignment Column</td><td>" + CFG._almcol + "</td></tr>" +
            "<tr><td>Cognate Column</td><td>" + mode + "</td></tr>" +
            "<tr><td>Algorithm</td><td>Longest Sequence (EDICTOR)</td></tr>" +
            "</table>";
      },
      1
  );


};

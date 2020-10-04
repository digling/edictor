/* Glosses JS in EDICTOR
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2020-10-01 10:29
 * modified : 2020-10-01 18:18
 *
 */


var GLOSSES = {};
GLOSSES.glosses = {};
GLOSSES.filter_gloss = '';
GLOSSES.sort_by = 'frequency';
GLOSSES.rows = {};

GLOSSES.check_morphemes = function(tokens, glosses, cogids) {
  var i;
  if (tokens.length == glosses.length == cogids.length) {
    return [tokens, glosses, cogids];
  }
  if (tokens.length > glosses.length){
    for (i=glosses.length; i<tokens.length; i++) {
      glosses.push('?');
    }
  }
  if (tokens.length > cogids.length) {
    for (i=cogids.length; i<tokens.length; i++) {
      cogids.push('0');
    }
  }
  if (tokens.lenght < glosses.length) {
    glosses = glosses.splice(0, tokens.length-1);
  }
  if (tokens.length < cogids.length) {
    cogids = cogids.splice(0, tokens.length-1);
  }
  return [tokens, glosses, cogids];
};


GLOSSES.assemble = function() {
  var idx, i, j, tokens, morphemes, cogids;
  GLOSSES.glosses = {};
  for (i=0; i<WLS.rows.length; i++) {
    idx = WLS.rows[i];
    [doculect, concept] = [
      WLS[idx][CFG._tidx],
      WLS[idx][CFG._cidx]
    ];
    [tokens, morphemes, cogids]  = this.check_morphemes(
      WLS[idx][CFG._segments].split(' + '),
      WLS[idx][CFG._morphemes].split(' '),
      WLS[idx][CFG._roots].split(' ')
    );
    if (!(doculect in GLOSSES.glosses)) {
      GLOSSES.glosses[doculect] = {};
    }
    for (j=0; j<tokens.length; j++) {
      if (tokens[j] in GLOSSES.glosses[doculect]) {
        GLOSSES.glosses[doculect][tokens[j]].push([morphemes[j], cogids[j], idx, j, concept, tokens, morphemes, cogids]);
      }
      else {
        GLOSSES.glosses[doculect][tokens[j]] = [[morphemes[j], cogids[j], idx, j, concept, tokens, morphemes, cogids]];
      }
    }

  }
};

GLOSSES.edit_entry = function(node, type, idx, jdx) {
  node.onclick = '';
  var ipt = document.createElement('input');
  ipt.setAttribute('class', 'cellinput');
  ipt.setAttribute('type', 'text');
  ipt.setAttribute('data-idx', idx);
  ipt.setAttribute('data-jdx', jdx);
  ipt.setAttribute('data-value', node.dataset['value']);
  ipt.setAttribute('onblur', 'GLOSSES.unmodify_entry(this,\''+type+'\')');
  ipt.setAttribute('onkeyup', 'GLOSSES.modify_entry(event,this,\''+type+'\','+idx+','+jdx+')');
  ipt.size = node.dataset['value'].length + 5;
  ipt.value = node.dataset['value'];
  node.innerHTML = '';
  node.appendChild(ipt);
  ipt.focus();
};

GLOSSES.unmodify_entry = function(node, type) {
  var entry, pnode;
  if (type == 'gloss') {
    entry = this.plotGloss(node.dataset['value']);
  }
  else if (type == 'cognate') {
    entry = node.dataset['value'];
  }
  pnode = document.getElementById('GLOSSES_'+type+'-'+node.dataset['idx']+'-'+node.dataset['jdx']);
  pnode.innerHTML = '';

  pnode.dataset.value = node.dataset['value'];
  pnode.onclick = '';
  pnode.onclick = function(){
    GLOSSES.edit_entry(pnode, type, pnode.dataset['idx'], pnode.dataset['jdx']);
  }
  pnode.innerHTML = entry;

};

GLOSSES.modify_entry = function(event, node, type, idx, jdx) {
  /* unmodify on escape */
  if (event.keyCode == 27) {
    this.unmodify_entry(node, type);
    return;
  }
  else if (event.keyCode != 13 && event != 'click' && [37, 38, 39, 40].indexOf(event.keyCode) == -1)  {
    return;
  }
  else if ((event.keyCode == 37 || event.keyCode == 39) && !(event.ctrlKey)){
    return;
  }

  /* retrieve the original value and the index */
  var new_value, entry, tokens, colidx, this_idx, next_idxs;
  tokens = WLS[idx][CFG._segments].split(' + ');
  if (type == 'gloss') {
    entry = WLS[idx][CFG._morphemes].split(' ');
    colidx = CFG._morphemes;
    new_value = node.value
  }
  else if (type == 'cognate') {
    entry = WLS[idx][CFG._roots].split(' ');
    colidx = CFG._roots;
    /* TODO adjust cognacy */
    new_value = node.value;
  }
  [tokens, entry, _dummy] = this.check_morphemes(tokens, entry, entry);

  /* modify the entry */
  entry[jdx] = new_value;
  entry = entry.join(' ');
  storeModification(idx, colidx, entry);
  WLS[idx][colidx] = entry;
  document.getElementById('GLOSSES_word-'+idx+'-'+jdx).innerHTML = ''+
    this.plotMorphemes(
      WLS[idx][CFG._segments].split(' + '),
      WLS[idx][CFG._morphemes].split(' '),
      WLS[idx][CFG._roots].split(' ')
    );

  /* keycode 38 = go up */
  if (event.keyCode == 38) {
    node.dataset['value'] = node.value;
    this.unmodify_entry(node, type);
    /* find next node */
    this_idx = this.rows[node.dataset['idx']+'-'+node.dataset['jdx']];
    if (this_idx == 0) {
      next_idxs = this.rows['r-'+(this.DTAB.table.length-1)];
    }
    else {
      next_idxs = this.rows['r-'+(this_idx-1)];
    }
    this.edit_entry(
      document.getElementById('GLOSSES_'+type+'-'+next_idxs[0]+'-'+next_idxs[1]),
      type,
      next_idxs[0],
      next_idxs[1]
    );
    return;
  }
  /* keycode 40 = go down */
  else if (event.keyCode == 40) {
    node.dataset['value'] = node.value;
    this.unmodify_entry(node, type);
    /* find next node */
    this_idx = this.rows[node.dataset['idx']+'-'+node.dataset['jdx']];
    if (this_idx == this.DTAB.table.length-1) {
      next_idxs = this.rows['r-0'];
    }
    else {
      next_idxs = this.rows['r-'+(this_idx+1)];
    }
    this.edit_entry(
      document.getElementById('GLOSSES_'+type+'-'+next_idxs[0]+'-'+next_idxs[1]),
      type,
      next_idxs[0],
      next_idxs[1]
    );
    return;
  }
  /* left */
  else if ((event.keyCode == 37 || event.keyCode == 39) && event.ctrlKey) {
    this_idx = this.rows[node.dataset['idx']+'-'+node.dataset['jdx']];
    node.dataset['value'] = node.value;
    /* bis hier */
    if (type == 'cognate') {
      this.unmodify_entry(node, type);
      this.edit_entry(
        document.getElementById('GLOSSES_'+'gloss-'+node.dataset['idx']+'-'+node.dataset['jdx']),
        'gloss',
        node.dataset['idx'],
        node.dataset['jdx']
      );
    }
    else if (type == 'gloss') {
      this.edit_entry(
        document.getElementById('GLOSSES_'+'cognate-'+node.dataset['idx']+'-'+node.dataset['jdx']),
        'cognate',
        node.dataset['idx'],
        node.dataset['jdx']
      );
    } 
  }
  node.dataset['value'] = node.value;
  /* retrieve tokens node */
  
  this.unmodify_entry(node, type);
  return;
};

GLOSSES.make_table = function() {
  var i, doculect, form;
  var add_it = true; 
  var table = [];
  for (doculect in this.glosses) {
    for (form in this.glosses[doculect]) {
      for (i=0; i<this.glosses[doculect][form].length; i++) {
        if (this.filter_gloss) {
          if (('^'+this.glosses[doculect][form][i][0]+'$').toLowerCase().indexOf(this.filter_gloss.toLowerCase()) == -1) {
            add_it = false;
          }
          else {
            add_it = true;
          }
        }
        if (add_it) {
          table.push([
            [
              form,
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3]
            ],
            [
              this.glosses[doculect][form][i][0],
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3]
            ],
            [
              this.glosses[doculect][form][i][1],
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3]
            ],
            doculect,
            this.glosses[doculect][form][i][4],
            [
              this.glosses[doculect][form][i][5],
              this.glosses[doculect][form][i][6],
              this.glosses[doculect][form][i][7],
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3]
            ],
            this.glosses[doculect][form].length
          ]);
        }
      }
    }
  }
  if (GLOSSES.sort_by) {
    if (GLOSSES.sort_by == 'frequency') {
      table.sort(
        function(x, y){
          if (x[6] < y[6]) {
            return 1;
          }
          else if (x[6] > y[6]) {
            return -1;
          }
          else {
            return x[0][0].localeCompare(y[0][0]);
          }
        }
      );
    }
  };

  /* iterate over table to set the index */
  this.rows = {};
  for (i=0; i<table.length; i++) {
    this.rows[table[i][0][1]+'-'+table[i][0][2]] = i;
    this.rows['r-'+i] = [table[i][0][1], table[i][0][2]];
  };

  if (table.length > 0) {
    this.DTAB = getDTAB(
      'GLOSSES',
      ['FORM', 'GLOSS', 'COGNATE', 'DOCULECT', 'CONCEPT', 'WORD', 'FREQUENCY'],
      table,
      [
        function(x, y, z){return '<td id="GLOSSES_form-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'">'+plotWord(x[0])+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_gloss-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'" data-value="'+x[0]+'" '+
            ' onclick="GLOSSES.edit_entry(this, \'gloss\','+x[1]+', '+x[2]+')" '+
            '>'+GLOSSES.plotGloss(x[0])+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_cognate-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'" data-value="'+x[0]+'" '+
            ' onclick="GLOSSES.edit_entry(this, \'cognate\','+x[1]+', '+x[2]+')" '+
            '>'+GLOSSES.plotCognate(x[0])+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_word-'+x[3]+'-'+x[4]+'">'+GLOSSES.plotMorphemes(x[0], x[1], x[2])+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
      ],
      ['form', 'gloss', 'cognate', 'doculect', 'concept', 'word', 'frequency'],
      table.length
    );
  }
};


GLOSSES.plotMorphemes = function(tokens, morphemes, cogids) {
  var i;
  var out = '';
  for (i=0; i<tokens.length; i++) {
    out += plotWord(tokens[i])+this.plotGloss(morphemes[i], true)+this.plotCognate(cogids[i], true);
  }
  return out;
};

GLOSSES.plotCognate = function(cognate, sup) {
  if (typeof sup == 'undefined') {
    return '<span class="cognate">'+cognate+'</span>';
  }
  else {
    return '<sup class="cognate">'+cognate+'</sup>';
  }
};

GLOSSES.plotGloss = function(gloss, sup) {
  var cls = 'gloss';
  if (gloss[0] == '_') {
    gloss = gloss.slice(1, gloss.length);
    cls = 'gloss-weak';
  }
  if (typeof sup == 'undefined') {
    sup = 'span';
  }
  else {
    sup = 'sup';
  }
  return '<'+sup+' class="'+cls+' pointed">'+gloss+'</'+sup+'>';
};


GLOSSES.toggleForm = function(node){
  if (node.dataset.now == 1) {
    node.innerHTML = plotWord(WLS[node.dataset.idx][CFG._segments])+'<span style="display:table-cell"><sup>'+node.dataset.length+'</sup></span>';
    node.dataset.now = 0;
  }
  else {
    node.innerHTML = plotWord(node.dataset.form)+'<span style="display:table-cell"><sup>'+node.dataset.length+'</sup></span>';
    node.dataset.now = 1;
  }
};

GLOSSES.alternate = function(x) {
  return x[0];
};

GLOSSES.present = function() {
  this.assemble();
  this.make_table();
  document.getElementById('glosses_table').innerHTML = '<br>'+this.DTAB.render(0, 0, GLOSSES.alternate);
  document.getElementById('glosses_table').style.display = 'table-cell';
  document.getElementById('GLOSSES_frequency').ondblclick = function(){fakeAlert('hello')};
}






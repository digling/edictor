/* Glosses JS in EDICTOR
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2020-10-01 10:29
 * modified : 2021-03-05 15:02
 *
 */


var GLOSSES = {};
GLOSSES.glosses = {};
GLOSSES.filter_gloss = '';
GLOSSES.filter_cognate = '';
GLOSSES.filter_form = '';
GLOSSES.sort_by = 'frequency';
GLOSSES.rows = {};
GLOSSES.joined = {};
GLOSSES.groupby = 'form';

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
  if (tokens.length < glosses.length) {
    glosses = glosses.splice(0, tokens.length-1);
  }
  if (tokens.length < cogids.length) {
    cogids = cogids.splice(0, tokens.length-1);
  }
  return [tokens, glosses, cogids];
};


/* glosses assemble needs to assemble glosses by their similarity of form, ignoring our slash construct*/
GLOSSES.assemble = function() {
  var idx, i, j, k, tokens, morphemes, cogids, current, cleaned;
  GLOSSES.glosses = {};
  for (i = 0; i < WLS.rows.length; i += 1) {
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
    for (j = 0; j < tokens.length; j += 1) {
      [current, cleaned]= [tokens[j].split(" "), clean_tokens(tokens[j].split(" "))];
      cleaned = cleaned.join(' ');
      if (cleaned in GLOSSES.glosses[doculect]) {
        GLOSSES.glosses[doculect][cleaned].push([morphemes[j], cogids[j], idx, j, concept, tokens, morphemes, cogids]);
      }
      else {
        GLOSSES.glosses[doculect][cleaned] = [[morphemes[j], cogids[j], idx, j, concept, tokens, morphemes, cogids]];
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
  if (type == 'gloss' || type == 'glossup') {
    entry = this.plotGloss(node.dataset['value']);
  }
  else if (type == 'cognate') {
    entry = this.plotCognate(node.dataset['value']);
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
  var new_value, entry, tokens, colidx, nodeidx, nidx, njdx, nnode, dummy;

  if (type == 'gloss' || type == 'glossup') {
    entry = WLS[idx][CFG._morphemes].split(' ');
    colidx = CFG._morphemes;
    new_value = node.value;
  }
  else if (type == 'cognate') {
    entry = WLS[idx][CFG._roots].split(' ');
    colidx = CFG._roots;
    /* TODO adjust cognacy */
    new_value = node.value;
  }
  
  tokens = WLS[idx][CFG._segments].split(' + ');
  [tokens, entry, _dummy] = this.check_morphemes(tokens, entry, entry);

  /* modify the entry */
  entry[jdx] = new_value;
  entry = entry.join(' ');
  if (type == 'cognate') {
    entry = partialCognateIdentifier(entry);
    new_value = entry.split(' ')[jdx];

  }
  WLS[idx][colidx] = entry;
  if (type == 'cognate' && new_value != node.value) {
    resetRootFormat(CFG.root_formatter);
  }
  try {
    document.getElementById('GLOSSES_word-'+idx+'-'+jdx).innerHTML = ''+
      this.plotMorphemes(
        WLS[idx][CFG._segments].split(' + '),
        WLS[idx][CFG._morphemes].split(' '),
        WLS[idx][CFG._roots].split(' ')
      );
  }
  catch (e) {}

  node.dataset['value'] = new_value;
  this.unmodify_entry(node, type);
  storeModification(idx, colidx, entry);
  
  /* TODO check this for general safety */
  if (this.joined[idx+'-'+jdx]) {
    for (nodeidx in this.joined) {
      if (this.joined[nodeidx] && nodeidx != idx+'-'+jdx){
        [nidx, njdx] = nodeidx.split('-');
        tokens = WLS[nidx][CFG._segments].split(' + ');
        entry = WLS[nidx][colidx].split(' ');
        [tokens, entry, dummy] = this.check_morphemes(tokens, entry, entry);
        entry[njdx] = new_value;
        entry = entry.join(' ');
        WLS[nidx][colidx] = entry;
        if (type == 'cognate'){
          nnode = document.getElementById('GLOSSES_'+type+'-'+nidx+'-'+njdx);
          nnode.innerHTML = this.plotCognate(new_value);
        }
        else if (type == 'gloss') {
          nnode = document.getElementById('GLOSSES_'+type+'-'+nidx+'-'+njdx);
          nnode.innerHTML = this.plotGloss(new_value);
        }
        nnode.dataset['value'] = new_value;
        document.getElementById('GLOSSES_word-'+nidx+'-'+njdx).innerHTML = ''+
          this.plotMorphemes(
              WLS[nidx][CFG._segments].split(' + '),
              WLS[nidx][CFG._morphemes].split(' '),
              WLS[nidx][CFG._roots].split(' ')
              );
        storeModification(parseInt(nidx), colidx, entry);
      }
    }
  }

  /* keycode 38 = go up */
  if (event.keyCode == 38 && type != 'glossup') {
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
  else if (event.keyCode == 40 && type != 'glossup') {
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
  else if ((event.keyCode == 37 || event.keyCode == 39) && event.ctrlKey && type != 'glossup') {
    this_idx = this.rows[node.dataset['idx']+'-'+node.dataset['jdx']];
    /* bis hier */
    if (type == 'cognate') {
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
  if (type == 'glossup') {
    try {
      nnode = document.getElementById('GLOSSES_gloss-'+node.dataset['idx']+'-'+node.dataset['jdx']);
      nnode.innerHTML = this.plotGloss(node.dataset['value']);
      nnode.dataset['value'] = node.dataset['value'];
    }
    catch (e) {}
  }
  return;
};

GLOSSES.make_table = function() {
  var i, doculect, form, cmp;
  var add_it; 
  var table = [];
  var counter = {};
  for (doculect in this.glosses) {
    for (form in this.glosses[doculect]) {
      for (i=0; i<this.glosses[doculect][form].length; i++) {
        add_it = true;
        if (this.filter_gloss) {
          if (('^'+this.glosses[doculect][form][i][0]+'$').toLowerCase().indexOf(this.filter_gloss.toLowerCase()) == -1) {
            add_it = false;
          }
        }
        if (this.filter_cognate) {
          if (this.glosses[doculect][form][i][1] != this.filter_cognate) {
            add_it = false;
          }
        }
        if (this.filter_form) {
          if (('^'+form+'$').indexOf(this.filter_form) == -1) {
            add_it = false;
          }
        }
        if (add_it) {
          if (!(form in counter)){
            counter[form] = 0;
          }
          counter[form] += 1;
          table.push([
            [
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3]
            ],
            [
              this.glosses[doculect][form][i][5][this.glosses[doculect][form][i][3]],
              this.glosses[doculect][form][i][2],
              this.glosses[doculect][form][i][3],
              form
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
            this.glosses[doculect][form].length,
          ]);
        }
      }
    }
  }
  if (GLOSSES.sort_by) {
    if (GLOSSES.sort_by == 'frequency') {
      table.sort(
        function(x, y){
          if (counter[x[1][3]] < counter[y[1][3]]) {
            return 1;
          }
          else if (counter[x[1][3]] > counter[y[1][3]]) {
            return -1;
          }
          else {
            return (x[1][3]+x[3][0]).localeCompare((y[1][3]+y[3][0]));
          }
        }
      );
    }
    else if (GLOSSES.sort_by == 'cognacy') {
      table.sort(
        function(x, y){
          if (WLS.roots[x[3][0]].length < WLS.roots[y[3][0]].length){
            return 1;
          }
          else if (WLS.roots[x[3][0]].length > WLS.roots[y[3][0]].length){
            return -1;
          }
          else {
            return (x[3][0]+x[1][3]+x[1][0]).localeCompare(y[3][0]+y[1][3]+y[1][0]);
          }
        }
      );
    }
    else if (GLOSSES.sort_by == "similarity"){
      table.sort(
        function(x, y){
          return (x[1][3]+x[1][0]+x[3][0]).localeCompare(y[1][3]+y[1][0]+y[3][0]);
        }
      );
    }
  };
  
  /* group the glosses */
  /* iterate over table to set the index */
  this.rows = {};
  for (i=0; i<table.length; i++) {
    this.rows[table[i][0][0]+'-'+table[i][0][1]] = i;
    this.rows['r-'+i] = [table[i][0][0], table[i][0][1]];
  };

  if (table.length > 0) {
    this.DTAB = getDTAB(
      'GLOSSES',
      ['ID', 'FORM', 'GLOSS', 'COG', 'DOCULECT', 'CONCEPT', 'WORD', 'FREQ'],
      table,
      [
        function(x, y, z){return '<td id="GLOSSES_idx-'+x[0]+'-'+x[1]+'"'+
            ' data-idx="'+x[0]+'-'+x[1]+'"'+
            ' oncontextmenu="GLOSSES.markIDs(event, this)"'+
            ' data-marked="0" class="pointed" onclick="GLOSSES.markID(this)" '+
            '>'+x[0]+'<sup>'+x[1]+'</sup></td>'},
        function(x, y, z){return '<td id="GLOSSES_form-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'">'+SEG.plotWord(x[0].split(" "), x[1], x[2], 'GLOSSES.refreshLine('+x[1]+','+x[2]+')')+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_gloss-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'" data-value="'+x[0]+'"'+
          ' oncontextmenu="GLOSSES.toggleGloss(event, this)"'+
          ' onclick="GLOSSES.edit_entry(this, \'gloss\','+x[1]+', '+x[2]+')" '+
          ' >'+GLOSSES.plotGloss(x[0])+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_cognate-'+x[1]+'-'+x[2]+'" data-idx="'+x[1]+'" data-jdx="'+x[2]+'" data-value="'+x[0]+'" '+
            ' oncontextmenu="GLOSSES.editGroup(event, this.dataset[\'value\']);"'+
            ' onclick="GLOSSES.edit_entry(this, \'cognate\','+x[1]+', '+x[2]+')" '+
            '>'+GLOSSES.plotCognate(x[0])+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
        function(x, y, z){return '<td id="GLOSSES_word-'+x[3]+'-'+x[4]+'">'+GLOSSES.plotMorphemes(x[0], x[1], x[2])+'</td>'},
        function(x, y, z){return '<td>'+x+'</td>'},
      ],
      ['idx', 'form', 'gloss', 'cognate', 'doculect', 'concept', 'word', 'frequency'],
      table.length
    );
  }
};


GLOSSES.refreshLine = function(idx, jdx){
  var node;
  node = document.getElementById('GLOSSES_form-'+idx+'-'+jdx);
  node.innerHTML = SEG.plotWord(
    WLS[idx][CFG._segments].split(' + ')[jdx].split(' '), 
    idx, jdx,
    'GLOSSES.refreshLine('+idx+','+jdx+')'
  );
};

GLOSSES.editGroup = function(event, cogid) {
  event.preventDefault();
  var i, idx, idxA, idxB, text, doculect, concept, gloss, form, jdx, cogids, node, table;
  table = [];
  for (i=0; i<WLS.roots[cogid].length; i++){
    [idx, jdx] = WLS.roots[cogid][i];
    doculect = WLS[idx][CFG._tidx];
    if (CFG._selected_doculects.indexOf(doculect) != -1) {
      table.push([
          idx,
          jdx,
          doculect,
          WLS[idx][CFG._cidx],
          WLS[idx][CFG._morphemes].split(' ')[jdx],
          WLS[idx][CFG._segments].split(' + ')[jdx], 
          ]);
    }
  }
  table.sort(function(x, y){
    idxA = CFG.sorted_taxa.indexOf(x[2]);
    idxB = CFG.sorted_taxa.indexOf(y[2]);
    if (idxA > idxB) {return 1}
    else if (idxB > idxA) {return -1}
    return 0;
  });
    
  text = '<p>';
  text += '<span class="main_handle pull-left" style="margin-left:-7px;margin-top:2px;" ></span>';
  text += '<b>Partial Cognates for '+cogid+'</b></p>';
  text += '<div class="submitline">';
  text += '<input class="btn btn-primary submit" type="button" onclick="$(\'#GLOSS-'+cogid+'\').remove();basickeydown(event);" value="CLOSE" /></div><br><br> ';
  text += '</div><br><br>';
  text += '<br><div class="alignments"><table>'

  for (i = 0; i < table.length; i += 1){
    text += '<tr>'+
      '<td class="gloss_cell">'+table[i][0]+'<sup>'+table[i][1]+'</sup></td>'+
      '<td class="gloss_cell alm_taxon">'+table[i][2]+'</td>'+
      '<td class="gloss_cell">'+table[i][3]+'</td>'+
      '<td data-idx="'+table[i][0]+'" data-jdx="'+table[i][1]+'" id="GLOSSES_glossup-'+table[i][0]+'-'+table[i][1]+'" data-value="'+table[i][4]+'" onclick="GLOSSES.edit_entry(this, \'glossup\','+table[i][0]+','+table[i][1]+')" class="gloss_cell">'+this.plotGloss(table[i][4])+'</td>'+
      '<td class="gloss_cell">'+plotWord(table[i][5], 'span')+'</td>'+
      '</tr>';
  }

  text += '</table></div>';

  node = document.createElement('div');
  node.id = 'GLOSS-'+cogid;
  node.className = 'edit_links';
  node.style.position = 'fixed';
  node.style.top = 100;
  node.style.bottom = 0;
  node.style.left = 0;
  node.style.right = 0;
  document.body.appendChild(node);
  node.innerHTML = text;
  $('#GLOSS-'+cogid).draggable({handle: '.main_handle'}).resizable();
  $('#GLOSS-'+cogid).css('z-index', 200);
};

GLOSSES.markID = function(node) {
  if (node.dataset['marked'] == "1"){
    node.dataset['marked'] = "0";
    node.style.backgroundColor = node.parentNode.style.backgroundColor;
    GLOSSES.joined[node.dataset['idx']] = false;
  }
  else {
    node.dataset['marked'] = "1";
    node.style.backgroundColor = "Salmon";
    GLOSSES.joined[node.dataset['idx']] = true;
  }
};

GLOSSES.markIDs = function(event, node) {
  event.preventDefault();
  if (node.dataset["idx"] in this.joined) {
    for (nodeidx in this.joined) {
      this.markID(document.getElementById('GLOSSES_idx-' + nodeidx));
    }
    this.joined = {};
    return;
  }
  var current_node = node.parentNode;
  this.joined = {};
  while (current_node.nextElementSibling.id != "") {
    current_node.childNodes[0].dataset["marked"] = "1"
    current_node.childNodes[0].style.backgroundColor = "LightBlue";
    GLOSSES.joined[current_node.childNodes[0].dataset["idx"]] = true;
    current_node = current_node.nextElementSibling;
  }
  current_node.childNodes[0].dataset["marked"] = "1"
  current_node.childNodes[0].style.backgroundColor = "LightBlue";
  GLOSSES.joined[current_node.childNodes[0].dataset["idx"]] = true;
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
  if (typeof gloss == "undefined") {
    gloss = "?";
  }
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

GLOSSES.refreshWords = function(idx, jdx) {
  document.getElementById('GLOSSES_word-'+idx+'-'+jdx).innerHTML = ''+
  this.plotMorphemes(
      WLS[idx][CFG._segments].split(' + '),
      WLS[idx][CFG._morphemes].split(' '),
      WLS[idx][CFG._roots].split(' ')
      );
};

GLOSSES.toggleGloss = function(event, node) {
  event.preventDefault();
  if (node.dataset['value'][0] == '_'){
    node.dataset['value'] = node.dataset['value'].slice(1, node.dataset['value'].length);
    node.innerHTML = this.plotGloss(node.dataset['value']);
  }
  else {
    node.dataset['value'] = '_' + node.dataset['value'];
    node.innerHTML = this.plotGloss(node.dataset['value']);
  }
  var entry = WLS[node.dataset['idx']][CFG._morphemes].split(' ');
  entry[node.dataset['jdx']] = node.dataset['value'];
  entry = entry.join(' ');
  WLS[node.dataset['idx']][CFG._morphemes] = entry;
  storeModification(parseInt(node.dataset['idx']), CFG._morphemes, entry);
  this.refreshWords(node.dataset['idx'], node.dataset['jdx']);
};

GLOSSES.alternate = function(x) {
  return x[3];
};

GLOSSES.present = function() {
  this.assemble();
  this.make_table();
  this.joined = {};
  document.getElementById('glosses_table').innerHTML = '<br>'+this.DTAB.render(0, 1, GLOSSES.alternate);
  document.getElementById('glosses_table').style.display = 'table-cell';
  document.getElementById('GLOSSES_frequency').ondblclick = function(){fakeAlert('hello')};
}






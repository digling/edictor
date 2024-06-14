/* Partial Cognate Sets 
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-21 14:14
 * modified : 2021-10-04 09:59
 *
 */

var PART = {};
PART.data = {};
PART.rootids = {};
PART.storage = [];

PART.partial_alignment = function(event, widx) {
  var i, j, idx, jdx, word, morphemes, this_morpheme, cogids, all_words;

  if (event) {event.preventDefault();}
  if (CFG['_segments'] == -1) {fakeAlert('No valid segmented transcriptions found in your data.');}
  
  var idx_string = WLS[widx][CFG['_roots']];
  var concept = WLS[widx][CFG['_concepts']];
  var doculect = WLS[widx][CFG['_taxa']];
  var idxs = idx_string.split(' ');
  var words = {};

  var text = '<div class="edit_links niceblue" id="partial-overview" data-value="'+widx+'">' + 
    '<span class="main_handle pull-left" style="margin-left:5px;margin-top:2px;" ></span>' +
    '<p>'+doculect+' «'+concept+'» ('+CFG['root_formatter']+': '+idxs+')'; 
  var cogids = [];
  var rows = [];
  for (i = 0; cogid = idxs[i]; i += 1) {
    if (typeof WLS.roots[cogid] != 'undefined' && cogid != '0' && cogid != 0){
      words[cogid] = {morphemes: [], indices: [], positions: [], taxa: []};
      rows = WLS.roots[cogid];
      rows.sort(function (x, y) {
        X = WLS[x[0]][CFG._tidx];
        Y = WLS[y[0]][CFG._tidx];
        if (CFG.sorted_taxa) {
          return CFG.sorted_taxa.indexOf(X) - CFG.sorted_taxa.indexOf(Y);
        }
        return (X < Y) ? -1 : (X < Y) ? 1 : 0;
      });
      for (j = 0; j < rows.length; j += 1) {
        [idx, jdx] = rows[j];
        word = (CFG['_alignments'] != -1 && WLS[idx][CFG['_alignments']] != '' && WLS[idx][CFG['_alignments']] != '?') 
                ? WLS[idx][CFG['_alignments']]
                : WLS[idx][CFG['_segments']]
                ;
        morphemes = MORPH.get_morphemes(word.split(' '));
        this_morpheme = morphemes[jdx];
        if (typeof this_morpheme != 'undefined') {
                words[cogid]['taxa'].push(WLS[idx][CFG['_taxa']]);
                words[cogid]['morphemes'].push(this_morpheme);
                words[cogid]['indices'].push(idx);
                words[cogid]['positions'].push(jdx);
        }
      }
      if (words[cogid]['taxa'].length != 0) {
        words[cogid]['alignment'] = $.extend(true, {}, ALIGN);
        words[cogid]['alignment']['ALMS'] = words[cogid]['morphemes'];
        words[cogid]['alignment']['TAXA'] = words[cogid]['taxa'];
        words[cogid]['alignment'].normalize(words[cogid]['alignment']['ALMS']);
        if (words[cogid]['taxa'].length > 1) {cogids.push(cogid);}
      }
    }
  }
  text += '<div class="alignments" id="alignments-overview">' + 
    '<table>' + 
    '<tr>'+'<th class="pchead">DOCULECTS</th><td style="width:3px"></td><th class="pchead">CONCEPTS</th><td style="width:3px"></td>';
  all_words = [];
  for (i = 0; i < cogids.length; i += 1) {
    cogid = cogids[i];
    if (words[cogid]['taxa'].length > 1){text += '<th oncontextmenu="PART.editGroup(event, '+cogid+')" class="pchead" colspan="'+words[cogid]['alignment']['ALMS'][0].length+'">ID: '+cogid+' <button onclick="PART.editGroup(event, '+cogid+')" class="btn-primary btn mleft pull-right submit3" title="align the words"><span class="icon-bar"></span><span class="icon-bar"></span></button></th>'; for (var j=0, tidx; tidx=words[cogid]['indices'][j]; j++) { if (all_words.indexOf(tidx) == -1) { all_words.push(tidx); }
      }
      if (i <cogids.length-1) {text += '<td style="width:3px"></td>';}
    }
  }
  text += '</tr>';
  for (var i=0; i<all_words.length; i++) {
    var taxon = WLS[all_words[i]][CFG['_taxa']];
    var this_idx = all_words[i];
    text += '<tr>' +
      '<td class="alm_taxon">' + taxon + '</td><td style="width:3px"></td>' +
      '<td class="alm_taxon">' + WLS[all_words[i]][CFG['_concepts']]+'</td><td style="width:3px"></td>';
    for (var j=0; j<cogids.length; j++) {
      var almidx = words[cogids[j]]['alignment']['TAXA'].indexOf(taxon);
      var almlen = words[cogids[j]]['alignment']['ALMS'][0].length;
      var test = words[cogids[j]]['indices'].indexOf(this_idx);
      if (test != -1) {
              text += plotWord(words[cogids[j]]['alignment']['ALMS'][test].join(' '), 'td');
              if (j != cogids.length-1){text += '<td></td>';}
      }
      else {
              for (var k=0;k<almlen;k++) {
                text += '<td class="missing">Ø</td>';
              }
              if (j != cogids.length-1) {text += '<td></td>';}
          }
        }
        text += '</tr>';
    }
    text += '</table></div>';
    text += '<div><input class="btn btn-primary submit" type="button" onclick="ALIGN.destroy_alignment();$(\'#editmode-overview\').remove();basickeydown(event);" value="CLOSE" /></div><br><br></div>';
    var editmode = document.createElement('div');
    editmode.id = 'editmode-overview';
    editmode.className = 'editmode';
    document.body.appendChild(editmode);
    editmode.innerHTML = text;
    document.onkeydown = function(event) {
      $('#editmode').remove(); 
      document.onkeydown = function(event) {
        basickeydown(event);
      };
    };
  $('#partial-overview').draggable({handle:'.main_handle'}).resizable();
};

/* basic handler class that initiates the multiselect and other functionalities
* which are later needed for the cognate set panel */
PART.handle_partial_selection = function () {

  /* check whether formatter is true or not */
  if (!CFG['root_formatter']) {
    fakeAlert("Your data does not contain a column which stores partial cognates.");
    return;
  }
  
  /* get selector */
  var slc = document.getElementById('partial_select_concepts');
  
  /* retrieve concepts and add them to selection */
  var txt = '';
  for (concept in WLS['concepts']) {
    txt += '<option id="concept_'+WLS.c2i[concept]+'" value="'+concept+'">'+concept+'</option>';
  }
  slc.innerHTML = txt;
  slc.options[0].selected = true;
  CFG['_current_partial'] = slc.options[0].value;

  $('#partial_select_concepts').multiselect({
        disableIfEmtpy: true,
        includeSelectAllOption : true,
        enableFiltering: true,
        maxHeight: window.innerHeight-100,
        buttonClass : 'btn btn-primary mright submit pull-left',
        enableCaseInsensitiveFiltering: true,
        buttonContainer: '<div id="partial_select_concepts_button" class="select_button" />',
        buttonText: function (options, select) {
          return 'Select Concepts <b class="caret"></b>';
        }
      });

  PART.display_partial(CFG['_current_partial']);
  document.getElementById('partial_current_concept').innerHTML = CFG['_current_partial'] + 
    ' ('+WLS['c2i'][CFG['_current_partial']]+'/'+WLS.height+')';
};

PART.display_partial = function (concept, sortby) {
  //-> console.log('sortby',sortby);
  sortby = (typeof sortby == 'undefined') ? 0 : sortby;
  
  /* if concept is not passed, check for selection */
  if (typeof concept == 'undefined' || ! concept) {

    /* set up variable for integer ids of concepts to get them passed to the function that
     * handles the restricted file display of the wordlist */
    var selected_concepts = [];
    
    /* get the word ids for the selected concepts */
    var indices = [];
    var slc = document.getElementById('partial_select_concepts');
    var all_concepts = [];
  
    /* set up restriction to maximally five concepts per slot */
    var restriction = 1
    for (var i=0,option; option=slc.options[i]; i++) {
      if (option.selected && restriction <= 5) {
        for (var j=0,idx; idx=WLS['concepts'][option.value][j]; j++) {
          indices.push(idx);
        }
        all_concepts.push(option.value);
        selected_concepts.push(WLS.c2i[option.value]);
        restriction += 1;
      }
    }
    if (all_concepts.length > 0) {
      if (all_concepts.length > 1) {
        document.getElementById('partial_current_concept').innerHTML = all_concepts[0]+', ...';
      }
      else {
        document.getElementById('partial_current_concept').innerHTML = all_concepts[0] +
          ' ('+WLS['c2i'][all_concepts[0]]+'/'+WLS.height+')';
      }
      /* mark the current concept */
      CFG['_current_partial'] = all_concepts[0];
      CFG['_partial_multiselect'] = true;

      /* make string from selected concepts */
      selected_concepts = selected_concepts.join(',');
    }
    else {
      PART.display_partial(CFG['_current_concept']);
      return;
    }
  }
  /* if the concept is not undefined, we have to change the multiselect options to display what
   * we really want to see */
  else {
    var indices = WLS.concepts[concept];
    var selected_concepts = ''+WLS.c2i[concept];
    $('#partial_select_concepts').multiselect('deselectAll',false);
    $('#partial_select_concepts').multiselect('select',concept);

    /* don't forget to also change the internal options which are not displayed here */
    var slcs = document.getElementById('partial_select_concepts');
    for (var k=0,option; option=slcs.options[k]; k++) {
      if (option.selected && option.value != concept) {
        option.selected = false;
      }
      else if (option.value == concept) {
        option.selected = true;
      }
    }
    /* store that there is no multiselect option chosen here */
    CFG['_partial_multiselect'] = false;
  }
  /* sort the indices */
  if (sortby != 0) {
    indices.sort(function(x, y) {
      var _x = WLS[x][CFG['_roots']];
      var _y = WLS[y][CFG['_roots']];
      var _xs = _x.split(' ');
      var _ys = _y.split(' ');
      var _xx = _xs.indexOf(sortby);
      var _yx = _ys.indexOf(sortby);
      if (_xx != -1 && _yx != -1) {
        if (_x > _y) { return 1;}
        if (_x < _y) { return -1;}
        return 0;
      }
      if (_xx != -1 && _yx == -1) {
        return -1;
      }
      return 1;
    });
  }

  /* retrieve all indices for the concept */
  var new_rootid = PART.get_new_cogid(); //partialCognateIdentifier('?');
  
  this.data = {};
  this.rootids = []; 
  var tbody = [];
  for (var i=0,idx; idx=indices[i]; i++) {
    var roots = WLS[idx][CFG['_roots']].split(/\s+/);
    var taxon = WLS[idx][CFG['_taxa']];
    var concept = WLS[idx][CFG['_concepts']];
    var _tmp = WLS[idx][CFG['_alignments']];
    var morphemes = (typeof _tmp != 'undefined' && _tmp && _tmp != '?')
      ? MORPH.get_morphemes(_tmp.split(' '))
      : MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(' '))
      ;
    var morpheme_strings = [];
    this.data[idx] = {};
    for (var j=0,morpheme; morpheme = morphemes[j]; j++) {
      var rootid = (typeof roots[j] != 'undefined' && roots[j] && !isNaN(parseInt(roots[j])))
        ? roots[j]
        : 0
        ;
      /* store root id for assembling current ids */
      if (rootid != 0 && this.rootids.indexOf(rootid) == -1) {
        this.rootids.push(rootid)
      };
      var tmp_color = (!rootid || rootid == 0) 
        ? 'Crimson'
        : 'Black'
        ; 
      var opacity = (!rootid || rootid==0)
        ? ''
        : 'opacity:0.75'
        ;
      this.data[idx][rootid] = [taxon, concept, morpheme, j];
      morpheme_strings.push('<span style="border: 2px solid white;display:table-cell;'+opacity+'" class="pointed" id="morph-'+idx+'-'+j+'" onclick="PART.storeEntry('+idx+','+j+');">'+plotWord(morpheme.join(' '), 'span', 'pointed') +
          '<sup class="cognate" style="color:'+tmp_color+'">'+rootid+'</sup></span>');
    }
    tbody.push('<tr>' + 
      '<td class="alm_taxon">'+taxon+'</td>' +
      '<td></td>' + 
      '<td>'+concept+'</td>' +
      '<td></td>' +
      '<td>'+morpheme_strings.join('')+'</td>');
  }
  this.rootids.push(new_rootid);
  var tbody_text = '';
  for (var i=0,idx; idx=indices[i]; i++) {
    tbody_text += tbody[i];
    for (var j=0,rootid; rootid=this.rootids[j]; j++) {
      tbody_text += (rootid in this.data[idx]) 
        ? '<td></td><td class="pointed" title="remove item from current cognate set" onclick="PART.remove_rootid('+idx+','+rootid+')" id="morpheme-'+idx+'-'+this.data[idx][3]+'">'+plotWord(this.data[idx][rootid][2].join(' '))+'</td>'
        : '<td></td><td></td>';
    }
    tbody_text += '</tr>';
  }

  var thead = '<table id="partial_alignments" class="alignments">' +
    '<tr>' +
    '<th class="pointed alm_bdl alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_taxa']]+'</th>' +
    '<th style="width:5px"></th>' +
    '<th class="pointed alm_bdr alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_concepts']]+'</th>' + 
    '<th style="width:5px"></th>' +
    '<th class="pointed alm_bdl alm_head" onclick="PART.display_partial(\''+concept+'\')">'+WLS['header'][CFG['_segments']]+'</th>' + 
      this.rootids.map(function (x) {
        return '<th style="width:5px"></th>' + 
                '<th oncontextmenu="event.preventDefault();PART.display_partial(\''+concept + '\',\''+x + 
          '\')" onclick="PART.modifyJudgment(' + 
          x + ')" class="pointed alm_bdr alm_head" title="click to add marked morphemes to this cognate set, right-click to sort along this column"><span style="border: 1px solid black; border-radius:5px; padding:2px; background-color:white; color: black;">' + 
          x + '</span> <button onclick="PART.editGroup(event, ' + x 
          + ')" class="btn-primary btn mleft pull-right submit3" title="align the words"><span class="icon-bar"></span><span class="icon-bar"></span></button></th>';
      }).join('') +
    '</tr>';
  

  var tab = document.getElementById('partial_table');
  tab.innerHTML = thead + tbody_text+'</table>';
  /* reset wordlist selection to the range of selected concepts */
  if (selected_concepts.length != 0) {
    filterOccurrences(false, selected_concepts);
  }
};

PART.modifyJudgment = function (rootid) {
  if (this.storage.length == 0) {return; };
  var mods = { idx : [], jdx : [], val : [] };
  for (var i=0,idf; idf=this.storage[i]; i++) {
    var idxjdx = idf.split('-').map(function (y) {return parseInt(y);});
    var idx = idxjdx[0];
    var jdx = idxjdx[1];
    /* get data for the current index */
    var taxon = WLS[idx][CFG['_taxa']];
    var concept = WLS[idx][CFG['_concepts']];
    var morphemes = MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(' '))[jdx];
    var rootids = WLS[idx][CFG['_roots']].split(' ').map(function (y) {return parseInt(y)});
    if (typeof morphemes[jdx] != 'undefined') {
      this.data[idx][rootid] = [taxon, concept, morphemes[jdx], jdx];
      rootids[jdx] = rootid;
      WLS[idx][CFG['_roots']] = rootids.join(' ');
      mods['idx'].push(idx);
      mods['jdx'].push(CFG['_roots']);
      mods['val'].push(WLS[idx][CFG['_roots']]);
    }
  }
  storeModification(mods['idx'], mods['jdx'], mods['val']);
  resetRootFormat(CFG['root_formatter']);
  if (CFG['_partial_multiselect']) {
    this.display_partial();
  }
  else {
    this.display_partial(CFG['_current_partial']);
  }
  this.storage = [];
};

PART.remove_rootid = function (idx, rootid) {
  var rootids = WLS[idx][CFG['_roots']].split(' ').map(function (x){return parseInt(x);});
  var ridx = rootids.indexOf(rootid);
  rootids[ridx] = 0;
  WLS[idx][CFG['_roots']] = rootids.join(' ');
  //-> console.log(rootids, ridx, rootid, WLS[idx][CFG['_roots']]);
  resetRootFormat(CFG['root_formatter']);
  if (CFG['_partial_multiselect']) {
    this.display_partial();
  }
  else {
    this.display_partial(CFG['_current_partial']);
  }
  this.storage = [];
};

PART.storeEntry = function(idx, j) {
  var idf = idx + '-' + j;
  if (PART.storage.indexOf(idf) == -1) {
    PART.storage.push(idf);
    //document.getElementById('morph-'+idf).style.border = "2px solid crimson";
    document.getElementById('morph-'+idf).style.backgroundColor = "crimson";
  }
  else {
    var new_storage = [];
    for (var i=0,part; part=PART.storage[i]; i++) {
      if (part != idf) {
        new_storage.push(part);
      }
    }
    PART.storage = new_storage;
    document.getElementById('morph-'+idf).style.backgroundColor="white"; //border = "2px solid white";
  }
};

PART.display_previous_partial = function() {
  
  var ccon = CFG['_current_partial'];
  var acon = Object.keys(WLS.concepts);
  var pcon = acon[(acon.indexOf(ccon)-1)];
  PART.display_partial(pcon);
  document.getElementById('partial_current_concept').innerHTML = pcon + 
    ' ('+WLS['c2i'][pcon]+'/'+WLS.height+')';

  CFG['_current_partial'] = pcon;
}; 

PART.display_next_partial = function() {

  var ccon = CFG['_current_partial'];
  var acon = Object.keys(WLS.concepts);
  var ncon = acon[(acon.indexOf(ccon)+1)];
  CFG._current_concept = ncon; // TODO: fix this for good
  PART.display_partial(ncon);

  document.getElementById('partial_current_concept').innerHTML = ncon + 
    ' ('+WLS['c2i'][ncon]+'/'+WLS.height+')';
  CFG['_current_partial'] = ncon;
};

PART.display_current_partial = function() {
  if (!CFG['_partial_multiselect']) {
    var ccon = CFG['_current_partial'];
    PART.display_partial(ccon);
  }
  else {
    PART.display_partial();
  }
};

/* function handles the display of alignments */
PART.editGroup = function (event, idx) {
  
  event.preventDefault();
  var i, r, current_line, current_entry, this_seq, alm, lang, this_idx, fall_back;
  
  /* check for various data, consider using switch statement here */
  if (idx == 0) {
    fakeAlert("This entry cannot be edited, since it is not related to any other entry.");
    return;
  }

  /* check for proper values to be displayed for alignment analysis */
  var rows = WLS['roots'][idx];
  /* sort the rows */
  rows.sort(function (x, y) {
    X = WLS[x[0]][CFG._tidx];
    Y = WLS[y[0]][CFG._tidx];
    if (CFG.sorted_taxa) {
      return CFG.sorted_taxa.indexOf(X) - CFG.sorted_taxa.indexOf(Y);
    }
    return (X < Y) ? -1 : (X < Y) ? 1 : 0;
  });

  /* check for proper alignments first */
  if (CFG['_alignments'] != -1) { 
    this_idx = CFG['_alignments']; 
    fall_back = CFG['_segments']; 
  }
  else if (CFG['_segments'] != -1) { 
    this_idx  = CFG['_segments']; 
    fall_back = CFG['_transcriptions']; 
  }
  else if (CFG['_transcriptions'] != -1) {
    this_idx = CFG['_transcriptions'];
  }
  else { fakeAlert('No phonetic entries were specified in the data.'); return; }

  /* check for sequence index */
  if (CFG['_segments'] != -1) {
    seq_idx = CFG['_segments']; 
  }
  else if (CFG['_transcriptions'] != -1) {
    seq_idx = CFG['_transcriptions']; 
  }

  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';

  var alms = [];
  var langs = [];
  CFG['_current_alms'] = [];
  CFG['_current_taxa'] = [];
  CFG['_current_idx'] = rows.map(function(x) {return x[0];});
  CFG['_current_seqs'] = [];
  CFG['_current_jdx'] = rows.map(function(x) {return x[1];});

  /* now create an alignment object */
  for (i = 0; r = rows[i]; i += 1) {
    ri = r[0];
    rj = r[1];
    current_line = WLS[ri][this_idx];
    if(!current_line || current_line == '?') {
      current_line = WLS[ri][fall_back];
    }
    /* get the current tokens */
    current_entry = MORPH.get_morphemes(current_line.split(' '))[rj];
    /* add stuff to temporary container for quick alignment access */
    CFG['_current_alms'].push(current_entry);
    CFG['_current_taxa'].push(WLS[ri][CFG['_taxa']]);

    /* add sequence data to allow for automatic alignment */
    this_seq = MORPH.get_morphemes(WLS[ri][seq_idx].split(' '))[rj];
    if (!this_seq) {
      this_seq = current_entry; 
    }
    CFG['_current_seqs'].push(this_seq);

    alm = plotWord(current_entry.join(' '), "td");
    lang = WLS[ri][CFG['_taxa']];

    /* only take those sequences into account which are currently selected in the alignment */
    if (CFG['_selected_doculects'].indexOf(lang) != -1 || CFG['align_all_words'] != "false") {
      alms.push('<td class="alm_taxon">'+lang+'</td>'+alm);
    }
  }
  if (alms.length == 1) {
    fakeAlert('Cognate set &quot;'+idx+'&quot; links only one entry.');
    return;
  }
  var text = '<div class="edit_links" id="editlinks">';
  text += '<p>';
  text += '<span class="main_handle pull-left" style="margin-left:-7px;margin-top:2px;" ></span>';
  text += 'Cognate set &quot;'+idx+'&quot; links the following '+alms.length+' entries:</p>';
  text += '<div class="alignments" id="alignments"><table onclick="fakeAlert(\'Press on EDIT or ALIGN to edit the alignments.\');">';
  for (i = 0; alm = alms[i]; i += 1) {
    text += '<tr>'+alm+'</tr>';
  }
  text += '</table></div>';
  text += '<div class="submitline">';
  text += '<input id="edit_alignment_button" class="btn btn-primary submit" type="button" onclick="editAlignment()" value="EDIT" /> ';
  text += '<input id="automatic_alignment_button" class="btn btn-primary submit" type="button" onclick="automaticAlignment();" value="ALIGN" /> ';
  text += '<input id="submit_alignment_button" class="btn btn-primary submit hidden" type="button" onclick="$(\'#popup_background\').show();PART.storeAlignment();$(\'#popup_background\').fadeOut();ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="SUBMIT" /> '; 
  text += '<input class="btn btn-primary submit" type="button" onclick="ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="CLOSE" /></div><br><br> ';
  text += '</div> ';

  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editmode').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  };

  $('#editlinks').draggable({handle:'.main_handle'}).resizable();
}

/* write alignment to wordlist object and eventually to server */
PART.storeAlignment = function() {
  ALIGN.export_alignments();
  if (CFG['_alignments'] != -1) { var this_idx = CFG['_alignments']; }
  else {
    /* get index of tokens */
    var tidx = CFG['_segments']; 
    WLS.header.push('ALIGNMENT');
    WLS.columns['ALIGNMENT'] = WLS.header.indexOf('ALIGNMENT');
    WLS.column_names['ALIGNMENT'] = 'ALIGNMENT';
    for (k in WLS) { if (!isNaN(k)) { WLS[k].push(''); } }
    var this_idx = WLS.header.indexOf('ALIGNMENT');
    CFG['_alignments'] = this_idx;
    createSelectors();
  }
  /* XXX we now try to update them all at once, in order to save time TODO */
  /* in order to make sure that we can submit everything at once, we collect
   * all info in three arrays, ids,cols, vals */
  var ids = [];
  var cols = [];
  var vals = [];
  var idx;
  for (i = 0; idx = CFG['_current_idx'][i]; i += 1) {
    var alm_part = ALIGN.ALMS[i].join(' ');
    var alm_full = WLS[idx][this_idx];
    var all_alms_with_morphemes = (alm_full != '?' && alm_full != '') 
      ? MORPH.get_morphemes(alm_full.split(' '), true)
      : MORPH.get_morphemes(WLS[idx][CFG['_segments']].split(' '), true)
      ;
    var all_alms = all_alms_with_morphemes[0];
    var all_mms = all_alms_with_morphemes[1];

    /* get new alm string */
    var alm_list = [];
    for (var j=0; j<all_alms.length; j++) {
      var tmp = (j != CFG['_current_jdx'][i]) 
        ? all_alms[j].join(' ')
        : alm_part 
        ;
      if (typeof all_mms[j] != 'undefined') {
        tmp += ' ' + all_mms[j];
      }
      else if (j < all_alms.length -1) {
        tmp += ' '+CFG['morpheme_separator'];
      }
      alm_list.push(tmp);
    }
    var alm_string = alm_list.join(' ');
    WLS[idx][this_idx] = alm_string;
    
    /* add the values to the three arrays */
    ids.push(idx);
    cols.push(this_idx);
    vals.push(alm_string);
  }
  
  storeModification(ids, cols, vals, CFG['async']);
  resetRootFormat(CFG['root_formatter']);
  applyFilter();

  if (CFG._patterns != -1 && CFG._morphology_mode == "partial") {
    PATS.recheck([WLS[CFG._current_idx[0]][CFG._roots].split(" ")[CFG._current_jdx[0]]]);
  }

  var test = document.getElementById('partial-overview');
  if (typeof test != 'undefined' && test) {
    var t = test.style.top;
    var b = test.style.bottom;
    var l = test.style.left;
    var r = test.style.right;

    $('#editmode-overview').remove();
    PART.partial_alignment(false, test.dataset['value']);
    var test = document.getElementById('partial-overview');
    test.style.top = t;
    test.style.bottom=b;
    test.style.left = l;
    test.style.right=r;
  }
};

PART.get_new_cogid = function () {
  if (!CFG['storable']) {
    cogid = partialCognateIdentifier("?");
  }
  else {
    var cogid = false;
    var postdata = {};
    var url = 'triples/triples.py';
    postdata['remote_dbase'] = CFG['remote_dbase'];
    postdata['file'] = CFG['filename'];
    postdata['new_id'] = CFG['root_formatter'];
    $.ajax({
      async: false,
      type: "POST",
      data : postdata,
      contentType: "application/text; charset=utf-8",
      url: url,
      dataType: "text",
      success: function(data) {
        cogid=parseInt(data);
      },
      error: function(){
        fakeAlert("problem retrieving a new cognate ID from the dbase");
      }
    });
  }
 return cogid;
};

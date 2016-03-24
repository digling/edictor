/* <++>
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-21 14:14
 * modified : 2016-03-21 14:14
 *
 */

var PART = {};

PART.partial_alignment = function(event, widx) {
  event.preventDefault();
  var idx_string = WLS[widx][CFG['_roots']];
  var concept = WLS[widx][CFG['_concepts']];
  var doculect = WLS[widx][CFG['_taxa']];
  var idxs = idx_string.split(' ');
  var words = {};

  var all_taxa = []; /* collect all taxa in the sample */
  var text = '<div class="edit_links" id="editlinks">' + 
    '<p>'+doculect+' «'+concept+'» ('+CFG['root_formatter']+': '+idxs+')'; 
  var cogids = [];
  for (var i=0,cogid; cogid=idxs[i]; i++) {
    words[cogid] = {morphemes: [], indices: [], positions: [], taxa: []};
    for (var j=0; j<WLS.roots[cogid].length; j++) {
      var idx = WLS.roots[cogid][j][0];
      var jdx = WLS.roots[cogid][j][1];
      var word = WLS[idx][CFG['_segments']];
      var morphemes = MORPH.get_morphemes(word.split(' '));
      var this_morpheme = morphemes[jdx];
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
  text += '<div class="alignments" id="alignments">' + 
    '<table>' + 
    '<tr>'+'<th class="pchead">DOCULECTS</th><td style="width:3px"></td>';
  for (var i=0;i<cogids.length; i++) {
    var cogid = cogids[i];
    if (words[cogid]['taxa'].length > 1){
      text += '<th class="pchead" colspan="'+words[cogid]['alignment']['ALMS'][0].length+'">ID: '+cogid+'</th>';
      for (var j=0,taxon; taxon=words[cogid]['taxa'][j]; j++) {
	if (all_taxa.indexOf(taxon) == -1) {
	  all_taxa.push(taxon);
	}
      }
      if (i <cogids.length-1) {text += '<td style="width:3px"></td>';}
    }
  }
  text += '</tr>';
  all_taxa.sort();
  for (var i=0; i<all_taxa.length; i++) {
    var taxon = all_taxa[i];
    text += '<tr>' +
      '<td class="alm_taxon">' + all_taxa[i] + '</td><td style="width:3px"></td>';
    for (var j=0; j<cogids.length; j++) {
      var almidx = words[cogids[j]]['alignment']['TAXA'].indexOf(taxon);
      var almlen = words[cogids[j]]['alignment']['ALMS'][0].length;
      console.log('partlast', almidx, almlen, words[cogids[j]]['alignment']);
      if (almidx != -1) {
	text += plotWord(words[cogids[j]]['alignment']['ALMS'][almidx].join(' '), 'td');
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
  text += '<div><input class="btn btn-primary submit" type="button" onclick="ALIGN.destroy_alignment();$(\'#editmode\').remove();basickeydown(event);" value="CLOSE" /></div><br><br></div>';
  console.log(cogids, all_taxa);
  var editmode = document.createElement('div');
  editmode.id = 'editmode';
  editmode.className = 'editmode';
  document.body.appendChild(editmode);
  editmode.innerHTML = text;
  document.onkeydown = function(event) {
    $('#editmode').remove(); 
    document.onkeydown = function(event) {
      basickeydown(event);
    };
  };

  $('#editlinks').draggable({handle:'.main_handle'}).resizable();

};

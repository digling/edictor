var COMMENTS = {};

COMMENTS.edit_comment = function(event, widx) {
  event.preventDefault();
  var entry = WLS[widx][CFG._note];
  var doculect = WLS[widx][CFG._tidx];
  var concept = WLS[widx][CFG._cidx];
  var text = '<div class="edit_links niceblue" id="comment-popup" data-value="'+widx+'">' + 
    '<span class="main_handle pull-left" style="margin-left:5px;margin-top:2px;" ></span>' +
    '<p>Comment on '+doculect+' «'+concept+'» (ROW: '+widx+'):</p>';
  console.log('text', text);
  text += '<p id="comment-preview" class="comment-text">'+COMMENTS.markdown(entry)+'</p>';
  
  /* we do not show the edit mode if the text is not empty, but show it if it is empty, or if the user clicks
   * the button to modify */
  text += '<textarea style="display:none;" placeholder="type your comment here..." id="comment-value" rows="5" cols="40">' +
    COMMENTS.unescape_text(entry) +
    '</textarea></p>';
  text += '<div>' +
    '<input id="edit-comment-btn" class="btn btn-primary submit" type="button" onclick="COMMENTS.show_edit_display();" value="EDIT" /> ' +
    '<input id="submit-comment-btn" class="btn btn-primary submit" style="display:none;" type="button" onclick="COMMENTS.storeEntry(event,'+widx+');basickeydown(event);" value="SUBMIT" /> ' +
    '<input id="refresh-comment-btn" class="btn btn-primary submit" style="display:none;" type="button" onclick="COMMENTS.refresh();" value="REFRESH" /> '+
    '<input class="btn btn-primary submit" type="button" onclick="$(\'#editmode-overview\').remove();basickeydown(event);" value="CLOSE" />' + 
    '</div><br><br></div>';
  var editnote = document.createElement('div');
  editnote.id = 'editmode-overview';
  editnote.className = 'editmode';
  document.body.appendChild(editnote);
  editnote.innerHTML = text;
  $('#comment-popup').draggable({handle:'.main_handle'}).resizable();

  /* if the comment field is empty, show the editing display */
  if (!(entry.replace(/\s/g))) {
    COMMENTS.show_edit_display();
  }
};

/* display patterns, consider putting this into a customized patterns.js later */
COMMENTS.show_pattern = function(event, widx) {
  event.preventDefault();
  var entry = WLS[widx][CFG._patterns];
  var doculect = WLS[widx][CFG._tidx];
  var concept = WLS[widx][CFG._cidx];
  var table = '<div class="edit_links niceblue" id="pattern-popup" data-value="'+widx+'">' + 
    '<span class="main_handle pull-left" style="margin-left:5px;margin-top:2px;" ></span>' +
    '<p>Patterns for '+doculect+' «'+concept+'» (ROW: '+widx+'):</p>';
  var morphemes = entry.split(' + ');
  var taxon_string = [];
  for (var i=0,taxon; taxon=CFG['sorted_taxa'][i]; i++) {
    if (taxon.indexOf('Proto') == -1) {
      taxon_string.push('<th class="pchead" title="'+taxon+'">'+taxon.slice(0,1)+'</th>');
    }
  }
  taxon_string = '<tr>' + taxon_string.join('')+'</tr>';
  table += '<table><tr>';
  for (var i=0,morpheme; morpheme=morphemes[i]; i++) {
    var patterns = morpheme.split(' ');
    table += '<td><table class="alignments">';
    table += taxon_string;
    for (var j=0,pattern; pattern=patterns[j]; j++) {
      console.log(pattern);
      table += '<tr>' + plotWord(pattern, 'td') + '</tr>';
    }
    table += '</table></td>';
  }
  table += '</tr></table><div><input class="btn btn-primary submit" type="button" onclick="$(\'#show_pattern\').remove();basickeydown(event);" value="CLOSE" /></div><br><br></div>';
  var showpattern = document.createElement('div');
  showpattern.id = 'show_pattern';
  showpattern.className = 'editmode';
  document.body.appendChild(showpattern);
  showpattern.innerHTML = table;
  $('pattern-popup').draggable({handle:'.main_handle'}).resizable();
};

/* time stamp formatting follows mediawiki conventions */
COMMENTS.timestamp = function(text) {
  /* get datetime string for time stamp */
  var d = new Date();
  var timestamp = d.toLocaleString();
  if (typeof CFG['user'] == 'undefined') {
     var user = '@Unknown';
  }
  else {
    var user = '@' + CFG['user'];
  }
  
  if (text.indexOf('~~~~~') != -1) {
    text = text.replace('~~~~~', timestamp);
  }
  else if (text.indexOf('~~~~') != -1) {
    text = text.replace('~~~~', user+' '+timestamp);
  }
  else if (text.indexOf('~~~') != -1) {
    text = text.replace('~~~', user);
  }
  return text;
}

/* edit the entry */
COMMENTS.storeEntry = function(event, idx) {
  var value = COMMENTS.escape_text(document.getElementById('comment-value').value);
  value = COMMENTS.timestamp(value);
  WLS[idx][CFG['_note']] = value;

  $('#editmode-overview').remove();
  basickeydown(event);
  applyFilter();
  showWLS(parseInt(getCurrent()));
};

/* make minimal markdown display of comments */
COMMENTS.markdown = function(text) {

  var blocks = text.split(/\r\n|\n/);
  var out = '';
  var italics = new RegExp(/\*([^\s]+)\*/, 'g');
  var bold = new RegExp(/\*\*([^\s]+)\*\*/, 'g');
  var ipa = new RegExp(/\/\/([^\/]+)\/\//, 'g');
  var ipar = function (match, p1) {
    return sampa2ipa('/'+p1+'/');
  };
  var segments = new RegExp(/\|\|([^\|]+)\|\|/, 'g');
  var segmentsr = function (match, p1) { 
    return plotWord(sampa2ipa(p1), 'span');
  };
  
  var url = new RegExp(/\[([^\]]+)\]\(([^\)]+)\)/, 'g');
  var urlr = function (match, p1, p2) {
    return '<a class="outlink" href="'+p2+'" target="_blank">'+p1+'</a>';
  };

  var bib = new RegExp(/:cite([pt]*):([A-Za-z\-]+)([0-9a-z]+)/, 'g');
  var bibr = function (match, p1, p2, p3) {
    if (p1 == 'p' || p1 == '') {
      return '<a class="outlink" target="_blank" href="http://bibliography.lingpy.org?key='+
        p2 + p3 + '">(' + p2 + ' ' + p3 + ')</a>';
    }
    else if (p1 == 't') {
      return '<a class="outlink" target="_blank" href="http://bibliography.lingpy.org?key='+
        p2 + p3 + '">' + p2 + ' (' + p3 + ')</a>';
    }
  };

  for (var i=0, block; block=blocks[i]; i++) {
    block = block.replace(bold, '<strong>$1</strong>');
    block = block.replace(italics, '<i>$1</i>');
    block = block.replace(ipa, ipar);
    block = block.replace(segments, segmentsr);
    block = block.replace(url, urlr);
    block = block.replace(bib, bibr);
    out += block +'<br>';
  }
  return out;
};

/* make escape function to make text storable in tsv */
COMMENTS.escape_text = function(text) {
  var tabs = new RegExp(/\t/, 'g');
  text = text.replace(tabs, ' ');
  var blocks = text.split(/\r\n|\n/);
  return blocks.join('<br>');
};

/* make unescape function for text */
COMMENTS.unescape_text = function(text) {
  var br = new RegExp(/<br>/, 'g');
  return text.replace(br, '\n')
};

/* updating comments when switching to preview */
COMMENTS.refresh = function() {
  var comment = document.getElementById('comment-preview');
  var input = document.getElementById('comment-value');
  comment.innerHTML = COMMENTS.markdown(TEXT.escapeValue(input.value));
  return;
};

/* toggle edit display for comments */
COMMENTS.show_edit_display = function() {
  document.getElementById('comment-value').style.display = 'block';
  document.getElementById('edit-comment-btn').style.display = 'none';
  document.getElementById('submit-comment-btn').style.display = 'inline';
  document.getElementById('refresh-comment-btn').style.display = 'inline';
};

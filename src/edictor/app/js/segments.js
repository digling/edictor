/* Segment operations
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2020-10-09 06:40
 * modified : 2023-04-12 08:41
 *
 */

var SEG = {};
SEG.groupby = "form";
SEG.filter_form = "";
SEG.filter_sound = "";

SEG.plotWord = function(seq, idx, jdx, functions){
  if (typeof functions == 'undefined'){
    functions = '';
  }
  var i, text;
  text = ''
  for (i = 0; i < seq.length; i += 1){
    if (seq[i] != '+'){
      text += plotWord(seq[i], 'span', 'pointed', ' onclick="SEG.splitWord('+i+','+idx+','+jdx+');'+functions+'"');
    }
    else {
      text += plotWord(seq[i], 'span', 'pointed', ' onclick="SEG.joinWord('+i+','+idx+','+jdx+');'+functions+'"');
    }
  }
  return text;
};

SEG.prepare_tokens = function(idx, tokens) {
  var out = [];
  var i, token, addon;
  for (i = 0; token = tokens[i]; i += 1) {
    if (token != CFG.morpheme_separator) {
      out.push(
        plotWord(token, 'span', 'pointed', 
          'title="click to segment, right click to group" ' + 
          'data-idx="' + idx + '" ' + 
          'data-pos="' + i + '" ' + 
          'oncontextmenu="SEG.groupSounds(event, this)" ' +
          'onclick="SEG.splitForm(this);" '));
      if (token.indexOf(".") != -1) {
        out.push('<span title="click to group sounds" ' + 
          'class="residue pointed dolgo_DOT" ' + 
          'onclick="SEG.ungroupSounds(this)" ' +
          'data-idx="' + idx + '" ' +
          'data-pos="' + i + '">' +
          '·</span>');
      }
    }
    else {
      out.push(
        plotWord(token, 'span', 'pointed',
          'data-idx="' + idx + '" ' + 
          'data-pos="' + i + '" ' +
          'onclick="SEG.joinForm(this);"'));
    }
  }
  return out.join("");
};

SEG.splitForm = function(node) {
  var idx = node.dataset["idx"];
  var pos = node.dataset["pos"];
  var tokens = WLS[idx][CFG._segments].split(" ");
  if (pos == 0) {
    return;
  }
  var before = tokens.slice(0, pos);
  var after = tokens.slice(pos, tokens.length);
  tokens = before.join(" ") + " " + CFG.morpheme_separator + " " + after.join(" ");
  
  node.parentNode.innerHTML = SEG.prepare_tokens(idx, tokens.split(" "));
  WLS[idx][CFG._segments] = tokens;
  storeModification([idx], [CFG._segments], [tokens]);
};

SEG.joinForm = function(node) {
  var idx = node.dataset["idx"];
  var pos = parseInt(node.dataset["pos"]);
  var tokens = WLS[idx][CFG._segments].split(" ");
  var before = tokens.slice(0, pos);
  var after = tokens.slice(pos + 1, tokens.length);
  tokens = before.join(" ") + " " + after.join(" ");
  node.parentNode.innerHTML = SEG.prepare_tokens(idx, tokens.split(" "));
  WLS[idx][CFG._segments] = tokens;
  storeModification([idx], [CFG._segments], [tokens]);
};

SEG.groupSounds = function(event, node) {
  event.preventDefault();
  var idx = node.dataset["idx"];
  var pos = parseInt(node.dataset["pos"]);
  var tokens = WLS[idx][CFG._segments].split(" ");
  var before = tokens.slice(0, pos + 1);
  var after = tokens.slice(pos + 1, tokens.length);
  tokens = before.join(" ") + "." + after.join(" ");
  node.parentNode.innerHTML = SEG.prepare_tokens(idx, tokens.split(" "));
  WLS[idx][CFG._segments] = tokens;
  storeModification([idx], [CFG._segments], [tokens]);
};

SEG.ungroupSounds = function(node) {
  var idx = node.dataset["idx"];
  var pos = parseInt(node.dataset["pos"]);
  var tokens = WLS[idx][CFG._segments].split(" ");
  var i;
  var tokens_ = [];
  for (i = 0; i < tokens.length; i += 1) {
    if (i == pos) {
      tokens_.push(...tokens[i].split("."));
    }
    else {
      tokens_.push(tokens[i]);
    }
  }
  node.parentNode.innerHTML = SEG.prepare_tokens(idx, tokens_);
  WLS[idx][CFG._segments] = tokens_.join(" ");
  storeModification([idx], [CFG._segments], [tokens_.join(" ")]);
};

SEG.splitWord = function(pos, idx, jdx){
  var i, before, after, word, glosses, cognates, form, gloss, cog;
  [word, glosses, cognates] = GLOSSES.check_morphemes(
    WLS[idx][CFG._segments].split(' + '), 
    WLS[idx][CFG._morphemes].split(' '), 
    WLS[idx][CFG._roots].split(' ')
  );
    
  [form, gloss, cog] = [word[jdx].split(' '), glosses[jdx], cognates[jdx]];
  [before, after] = [form.slice(0, pos), form.slice(pos, form.length)];
  word[jdx] = before.join(' ')+' + '+after.join(' ');
  glosses[jdx] = gloss+' ?';
  cognates[jdx] = cog+' 0';

  WLS[idx][CFG._segments] = word.join(' + ');
  WLS[idx][CFG._morphemes] = glosses.join(' ');
  WLS[idx][CFG._roots] = cognates.join(' ');

  if (CFG._alignments != -1) {
    alm = WLS[idx][CFG._alignments].split(' ');
    tks = WLS[idx][CFG._segments].split(' ');
    WLS[idx][CFG._alignments] = UTIL.tokens2alignment(
      WLS[idx][CFG._segments].split(" "),
      WLS[idx][CFG._alignments].split(" "))
    storeModification(idx, CFG._alignments, WLS[idx][CFG._alignments]);
  }

  storeModification(idx, CFG._segments, WLS[idx][CFG._segments]);
  storeModification(idx, CFG._morphemes, WLS[idx][CFG._glosses]);
  storeModification(idx, CFG._roots, WLS[idx][CFG._roots]);
};

SEG.prepare_cognates = function(idx, cognates) {
  cognates = String(cognates).split(" ");
  var i;
  var cognate;
  var out = [];
  for (i = 0; cognate = cognates[i]; i += 1) {
    out.push(
      '<span class="cognate">' + cognate + "</span>");
  }
  return out.join("");
};


SEG.prepare_glosses = function(idx, glosses) {
  glosses = glosses.split(" ");
  var i;
  var gloss;
  var out = [];
  for (i = 0; gloss = glosses[i]; i += 1) {
    if (gloss[0] == "_") {
      out.push(
        '<span class="gloss-weak">' + gloss.slice(1, gloss.length) + "</span>");
    }
    else {
      out.push(
        '<span class="gloss">' + gloss + "</span>");
    }
  }
  return out.join("");
};


SEG.make_table = function(){
  var i, row;
  var idx, morphemes, cogids, tokens, concept, doculect;
  var filter, tokens_;
  var table = [];
  for (i = 0; idx = WLS.rows[i]; i += 1) {
    /* retrieve segment, morpheme, cognate sets */
    tokens = WLS[idx][CFG._segments];
    morphemes = (CFG._morphemes != -1) 
        ? WLS[idx][CFG._morphemes] 
        : "?";
    cognates = (CFG._roots != -1) 
        ? WLS[idx][CFG._roots] 
        : WLS[idx][CFG._cognates];
    concept = WLS[idx][CFG._concepts];
    doculect = WLS[idx][CFG._taxa];
    
    passit = true;
    tokens_ = "^" + tokens + "$";
    if (this.filter_form.trim() != "") {
      if (tokens_.indexOf(this.filter_form.trim()) != -1) {
        passit = true;
      }
      else {
        passit = false;
      }
    }
    if (this.filter_sound.trim() != "" && passit) {
      passit = false;
      tokens_ = tokens.split(" ");
      for (j = 0; j < tokens_.length; j += 1) {
        if (tokens_[j].indexOf("/") != -1) {
          if (this.filter_sound.trim().split(" ").indexOf(tokens_[j].split("/")[1]) != -1) {
            passit = true;
          }
        }
        else {
          if (this.filter_sound.trim().split(" ").indexOf(tokens_[j]) != -1) {
            passit = true;
          }
        }
      }
    }

    if (passit) {
      row = [idx, [idx, doculect], [idx, concept], 
        [idx, tokens], [idx, morphemes], [idx, cognates]];
      table.push(row);
    }
  }
  this.table = table;
  if (table.length > 0) {
    this.DTAB = getDTAB(
      "SEGMENTS",
      ["ID", "DOCULECT", "CONCEPT", "FORM", "MORPHEMES", 
      (CFG._roots != -1) ? CFG.root_formatter : CFG.formatter],
      table,
      [
        function(x, y, z) {return '<td dataset-id="' + x + '" id="form-id-' + x + '">' + x + "</td>"},
        function(x, y, z) {return '<td dataset-id="' + x[0] + '" id="form-doculect-' + x[0] + '">' + x[1] + "</td>"},
        function(x, y, z) {return '<td dataset-id="' + x[0] + '" id="form-concept-' + x[0] + '">' + x[1] + "</td>"},
        function(x, y, z) {
          tokens = SEG.prepare_tokens(x[0], x[1].split(" "));
          return '<td dataset-id="' + x[0] + '" id="form-form-' + x[0] + '">' + tokens + "</td>"},
        function(x, y, z) {
          return '<td ' +
            'dataset-id="' + 
            x[0] + '" id="form-morph-' + 
            x[0] + '">' + SEG.prepare_glosses(x[0], x[1]) + "</td>"},
        function(x, y, z) {
          return '<td dataset-id="' + 
            x[0] + '" id="form-cogid-' + 
            x[0] + '">' + SEG.prepare_cognates(x[0], x[1]) + "</td>"}
      ],
      ["id", "doculect", "concept", "form", "morphemes", "cognates"],
      table.length
    );
    return true;
  }
  else {
    return false;
  }
};

SEG.alternate = function(x) {return x[2]};

SEG.present = function() {
  var test = this.make_table();
  if (test) {
    document.getElementById('forms_table').innerHTML = '<br>'+this.DTAB.render(0, 1, SEG.alternate);
    document.getElementById('forms_table').style.display = 'table-cell';
  }
  else {
    document.getElementById('forms_table').innerHTML = '<br>';
    document.getElementById('forms_table').style.display = 'table-cell';
  }
}

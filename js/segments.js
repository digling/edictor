/* Segment operations
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2020-10-09 06:40
 * modified : 2020-10-09 06:40
 *
 */

var SEG = {};

SEG.plotWord = function(seq, idx, jdx, functions){
  if (typeof functions == 'undefined'){
    functions = '';
  }
  var i, text;
  text = ''
  for (i=0; i<seq.length; i++){
    if (seq[i] != '+'){
      text += plotWord(seq[i], 'span', 'pointed', ' onclick="SEG.splitWord('+i+','+idx+','+jdx+');'+functions+'"');
    }
    else {
      text += plotWord(seq[i], 'span', 'pointed', ' onclick="SEG.joinWord('+i+','+idx+','+jdx+');'+functions+'"');
    }
  }
  return text;
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
  storeModification(idx, WLS[idx][CFG._segments]);
  storeModification(idx, WLS[idx][CFG._glosses]);
  storeModification(idx, WLS[idx][CFG._roots]);
};

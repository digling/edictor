
var getline = window.location.href;
var parts = getline.split('?');
var getpart = decodeURIComponent(parts[1].split('#')[0]);
var comps = getpart.split('&');
var settings = {};
for (var i=0,comp; comp=comps[i]; i++) {

  var keyval = comp.split('=');
  settings[keyval[0]] = keyval[1];
}

var sound_list = settings['sound_list'].split(',');
var visited_sounds = [];

var doco = document.getElementById('doculect');
console.log(doco, settings);
doco.innerHTML = settings['doculect'];

var secondary_articulations = ['ʰ','ʲ','ʱ','ː','ⁿ', 'ʷ', '˞', '\u0331', '\u0306'];
console.log(secondary_articulations, sound_list);


var idxs = ['ipa_chart_1', 'ipa_chart_2', 'ipa_chart_3', 
    'ipa_chart_4', 'ipa_chart_5', 'ipa_chart_6'];

for (var idx=0,tidx; tidx=idxs[idx]; idx++) {
  var table = document.getElementById(tidx);
  var ipas = table.getElementsByClassName('IPA');
  var detected_sounds = 0;
  for (var i=0,ipa; ipa=ipas[i]; i++) {
    
    var ipa_children = ipa.childNodes;
    for (var j=0,ipa_child; ipa_child=ipa_children[j]; j++) {
      try {
        /* get the sound */
        var sound = ipa_child.innerHTML.replace(/\s/g, '');
  
	if (sound_list.indexOf(sound) == -1) {
	  /* check for regular sound */
  	  if (typeof sound != 'undefined') {
  	    ipa_child.style.color = '#f2f2f2';
  	  }
        }
        else {
	  visited_sounds.push(sound);
  	  ipa_child.href = 'http://en.wikipedia.org/wiki/'+ipa_child.title.replace(' ','_');
	  detected_sounds += 1;
        }
        for (var k=0; k < secondary_articulations.length; k++) {
          sa = secondary_articulations[k];
          if (sound_list.indexOf(sound+sa) != -1) {
            new_child = document.createElement('a');
            new_child.innerHTML = ' '+sound+sa;
	    ipa.appendChild(new_child);
	    visited_sounds.push(sound+sa);
	    detected_sounds += 1;
          }
        }
      }
      catch (e) {
        ipa.style.color = 'Crimson';
      }
    }
  }
  if (detected_sounds == 0) {
    table.style.display = 'none';
  }
}

var txt = '<table id="missing_sounds"><tr><th style="background-color:Crimson;color:white">Missing sounds</th></tr>'
var missing=false;
for (var i=0,sound; sound=sound_list[i]; i++) {
  if (visited_sounds.indexOf(sound) == -1) {
    txt += '<tr><td>'+sound+'</tr></td>';
    missing = true;
  }
}
txt += '</table>';
if (missing) { 
  document.getElementById('missing_sounds').innerHTML = txt;
}

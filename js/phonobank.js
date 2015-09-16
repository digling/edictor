
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

document.getElementById('doculect').innerHTML = settings['doculect'];

var ipas = document.getElementsByClassName('IPA');
for (var i=0,ipa; ipa=ipas[i]; i++) {
  
  var ipa_children = ipa.childNodes;
  for (var j=0,ipa_child; ipa_child=ipa_children[j]; j++) {
    try {
      var sound = ipa_child.innerHTML.replace(/\s/g, '');
      if (sound_list.indexOf(sound) == -1) {
	console.log(ipa_child);
	if (typeof sound != 'undefined') {
	  ipa_child.style.color = '#f2f2f2';
	}
      }
      else {
	visited_sounds.push(sound);
      }
    }
    catch (e) {
      ipa.style.color = 'Crimson';
    }
  }
}

var txt = '<p>Missing sounds</p><ul>'
for (var i=0,sound; sound=sound_list[i]; i++) {
  if (visited_sounds.indexOf(sound) == -1) {
    txt += '<li>'+sound+'</li>';
  }
}
txt += '</ul>';
document.getElementById('missing_sounds').innerHTML = txt;


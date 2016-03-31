/* Highlight Module of DIGHL.js
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-09-04 14:13
 * modified : 2015-02-10 14:04
 *
 */

/* define keywords for general MSA format */
var keywords = {
  "LOCAL": "", 
  "MERGE": "", 
  "SWAPS": "", 
  "ID": "",
  "IGNORE":"",
  "COLUMNID":"",
  "COMPLEX":"",
  "STANDARD":""
};

var params = ["view", "edit", "save", "refresh", "undo_button", "redo_button"];

var privates = [
  "width",
  "uniques",
  "sequences",
  "mode",
  "taxlen",
  "type"
  ];

/* define the converter object for the coloring of the cols */
var DOLGO = {
  "₆" : "1",
  "⁶" : "1",
  "₀" : "1",
  "⁰" : "0",
  "ñ" : "N",
  "ṅ" : "N",
  "\u1e25": "1", /* display as tone temporarily */
  "ū" : "V",
  "ẽ" : "V",
  "ũ" : "V",
  "ă" : "V",
  "ú" : "V",
  "ṁ" : "N",
  "ŏ" : "V",
  "ĭ" : "V",
  "ә" : "V",
  "t\u035c\u0255": "K", 
  "\u2082\u2085": "1", 
  "\u2082\u2084": "1", 
  "\u2082\u2083": "1", 
  "\u2082\u2082": "1", 
  "\u2082\u2081": "1", 
  "\u0127": "H", 
  "\u02a4": "K", 
  "d\u0361\u0292": "K", 
  "d\u0361\u0291": "K", 
  "\u0221": "T", 
  "\u2083\u2082": "1", 
  "\u2085": "1", 
  "\u0277": "V", 
  "\u0235": "N", 
  "\u03b2": "P", 
  "d\u035cz": "K", 
  "\u012b": "V", 
  "\u028c": "V",
  "ʮ":"V",
  "u": "V", 
  "\u02a8": "K", 
  "\u0288": "T", 
  "t\u035cs": "K", 
  "\u1d07": "V", 
  "\u2084": "1", 
  "t\u0361\u0283": "K", 
  "t\u0361\u0282": "K", 
  "\u0280": "R", 
  "s": "S", 
  "\u011b": "V", 
  "\u0294": "H", 
  "\u2c71": "W", 
  "\u0113": "V", 
  "\u0290": "S", 
  "\u01ce": "V", 
  "\u00ec": "V", 
  "\u026d": "R", 
  "\u025e": "V", 
  "\u00e8": "V", 
  "i": "V", 
  "d": "T", 
  "\u0167": "T", 
  "\u0271": "M", 
  "e": "V", 
  "\u00e0": "V", 
  "\u0261": "K", 
  "\u027d": "R", 
  "p\u035cf": "P", 
  "\u0279": "R", 
  "\u00f4": "V", 
  "\u2075": "1", 
  "\u00f0": "T", 
  "q": "K", 
  "t\u035c\u0282": "K", 
  "\u014b": "N", 
  "\u00b3\u00b2": "1", 
  "\u00b3\u00b3": "1", 
  "\u00b3\u00b9": "1", 
  "\u0259": "V", 
  "\u2081\u2084": "1", 
  "\u2081\u2085": "1", 
  "\u2081\u2082": "1", 
  "\u2081\u2083": "1", 
  "\u2081\u2081": "1", 
  "\u026e": "R", 
  "\u1d00": "V", 
  "\u2083\u2085": "1", 
  "\u2084\u2085": "1", 
  "\u2084\u2084": "1", 
  "\u02a5": "K", 
  "\u2084\u2081": "1", 
  "\u026c": "R", 
  "\u2084\u2083": "1", 
  "\u2084\u2082": "1", 
  "\u00b9": "1", 
  "\u026a": "V", 
  "\u0234": "R", 
  "\u00b3\u2074": "1", 
  "\u00b3\u2075": "1", 
  "\u028d": "M", 
  "p\u0361f": "P", 
  "\u0289": "V", 
  "\u0285": "V", 
  "\u0281": "R", 
  "f": "P", 
  "\u029d": "S", 
  "\u0299": "W", 
  "\u0295": "H", 
  "\u0264": "V", 
  "\u025b": "V", 
  "\u0253": "P", 
  "\u2075\u00b2": "1", 
  "l": "R", 
  "\u00ed": "V", 
  "\u2083\u2081": "1", 
  "h": "H", 
  "\u00e9": "V", 
  "\u0262": "K", 
  "y": "V", 
  "\u00e1": "V", 
  "\u017e": "K", 
  "\u0278": "P", 
  "t\u035c\u0283": "K", 
  "\u0274": "N", 
  "\u00f5": "V", 
  "t\u0361s": "K", 
  "p": "P", 
  "d\u035c\u0292": "K", 
  "\u0255": "S", 
  "d\u0361z": "K", 
  "\u2074": "1", 
  "\u03c7": "K", 
  "\u00f8": "V", 
  "\u0142": "R", 
  "\u0153": "V", 
  "\u025c": "V", 
  "d\u035c\u0290": "K", 
  "d\u035c\u0291": "K", 
  "\u0258": "V", 
  "\u2083\u2084": "1", 
  "\u0254": "V", 
  "\u0251": "V", 
  "\u0152": "V", 
  "\u0250": "V", 
  "\u00b9\u2074": "1", 
  "\u00b9\u2075": "1", 
  "\u0275": "V", 
  "\u00b9\u00b9": "1", 
  "\u0129": "V", 
  "\u02a6": "K", 
  "\u2082": "1", 
  "\u0291": "S", 
  "\u2070": "1", 
  "\u0276": "V", 
  "\u03b8": "T", 
  "t\u0361\u03b8": "K", 
  "d\u0361\u0290": "K", 
  "\u2083": "1", 
  "\u00b2": "1", 
  "t": "T", 
  "\u0131": "V", 
  "\u028e": "R", 
  "\u2075\u00b3": "1", 
  "\u010d": "K", 
  "\u028a": "V", 
  "\u0272": "N", 
  "\u2075\u00b9": "1", 
  "\u0282": "S", 
  "\u0180": "P", 
  "\u0101": "V", 
  "\u0270": "J", 
  "\u0292": "S", 
  "\u0111": "T", 
  "\u00ee": "V", 
  "\u2085\u2083": "1", 
  "\u2085\u2081": "1", 
  "\u00ea": "V", 
  "k": "K", 
  "\u2085\u2084": "1", 
  "\u2085\u2085": "1", 
  "\u00e6": "V", 
  "\u0267": "S", 
  "\u00e2": "V", 
  "c": "K", 
  "\u0161": "S", 
  "\u00fe": "T", 
  "\u027f": "V", 
  "\u207b": "1", 
  "w": "W", 
  "\u014d": "V", 
  "\u00f2": "V", 
  "\u0273": "N", 
  "\u00b2\u2075": "1", 
  "\u00b2\u2074": "1", 
  "\u2074\u00b9": "1", 
  "\u2075\u2074": "1", 
  "\u2074\u00b3": "1", 
  "\u2074\u00b2": "1", 
  "\u025f": "K", 
  "_": "_", 
  "\u0257": "T", 
  "\u2083\u2083": "1", 
  "\u2081": "1", 
  "\u01d0": "V", 
  "x": "K", 
  "\u2085\u2082": "1", 
  "\u026f": "V", 
  "\u02a7": "K", 
  "\u02a3": "K", 
  "t\u0361\u0255": "K", 
  "m": "M", 
  "\u0236": "T", 
  "\u00b3": "1", 
  "o": "V", 
  "\u026b": "R", 
  "\u028f": "V", 
  "\u00b2\u00b3": "1", 
  "\u028b": "W", 
  "\u2074\u2075": "1", 
  "\u2074\u2074": "1", 
  "\u0283": "S", 
  "\u00b2\u00b9": "1", 
  "\u029f": "R", 
  "\u1d1c": "V", 
  "g": "K", 
  "\u00b9\u00b2": "1", 
  "n": "N", 
  "\u0265": "J", 
  "j": "J", 
  "\u00b9\u00b3": "1", 
  "\u0266": "H", 
  "\u00e7": "S", 
  "b": "P", 
  "\u00e3": "V", 
  "\u0263": "K", 
  "\u027e": "R", 
  "z": "S", 
  "v": "W", 
  "+": "+", 
  "a": "V", 
  "r": "R", 
  "\u00f3": "V", 
  "\u00b2\u00b2": "1", 
  "\u0148": "N", 
  "\u2075\u2075": "1", 
  "\u0144": "N", 
  "t\u035c\u03b8": "K", 
  "\u0268": "V", 
  "\u01dd": "V", 
  "\u025a": "V", 
  "\u0256": "T", 
  "\u0252": "V", 
  "\u027b": "R",
  "Ɂ": "H",
  "∼" : "NAS",
  "◦" : "PLUS",
  "." : "PLUS"
};

/* assign tone chars and diacritics for convenience */
DOLGO['_tones'] = '₁₂₃₄₅₀¹²³⁴⁵⁰';
DOLGO['_diacritics'] = '!:|¯ʰʱʲʳʴʵʶʷʸʹʺʻʼʽʾʿˀˀ ˁ˂˃˄˅ˆˈˉˊˋˌˍˎˏːˑ˒˓˔˕˖˗˞˟ˠˡˢˣˤˬ˭ˮ˯˰˱˲˳˴˵˶˷˸˹˺˻˼˽˾˿-̀-́-̂-̃-̄-̅-̆-̇-̈-̉-̊-̋-̌-̍-̎-̏-̐-̑-̒-̓-̔-̕-̖-̗-̘-̙-̚-̛-̜-̝-̞-̟-̠-̡-̢-̣-̤-̥-̦-̧-̨-̩-̪-̫-̬-̭-̮-̯-̰-̱-̲-̳-̴-̵-̶-̷-̸-̹-̺-̻-̼-̽-̾-̿-̀-́-͂-̓-̈́-ͅ-͆-͇-͈-͉-͊-͋-͌-͍-͎-͏-͐-͑-͒-͓-͔-͕-͖-͗-͘-͙-͚-͛-͝-͞-͟-͠-͢-ͣ-ͤ-ͥ-ͦ-ͧ-ͨ-ͩ-ͪ-ͫ-ͬ-ͭ-ͮ-ͯ-҃-҄-҅-҆-҇-҈-҉ՙ-ٖ-ٰ-ܑ-߫-߬-߭-߮-߯-߰-߱-߲-߳ᴬᴭᴮᴯᴰᴱᴲᴳᴴᴵᴶᴷᴸᴹᴺᴻᴼᴽᴾᴿᵀᵁᵂᵃᵄᵅᵆᵇᵈᵉᵊᵋᵌᵍᵎᵏᵐᵑᵒᵓᵔᵕᵖᵗᵘᵙᵚᵛᵜᵝᵞᵟᵠᵡᵢᵣᵤᵥᵦᵧᵨᵩᵪᵸᶛᶜᶝᶞᶟᶠᶡᶢᶣᶤᶥᶦᶧᶨᶩᶪᶫᶬᶭᶮᶯᶰᶱᶲᶳᶴᶵᶶᶷᶸᶹᶺᶻᶼᶽᶾᶿ-᷀-᷁-᷂-᷃-᷄-᷅-᷆-᷇-᷈-᷉-᷊-᷋-᷌-᷍-᷎-᷏-ᷓ-ᷔ-ᷕ-ᷖ-ᷗ-ᷘ-ᷙ-ᷚ-ᷛ-ᷜ-ᷝ-ᷞ-ᷟ-ᷠ-ᷡ-ᷢ-ᷣ-ᷤ-ᷥ-ᷦ᷼-᷽-᷾-᷿ⁱ⁺⁻⁼⁽⁾ⁿ₊₋₌₍₎ₐₑₒₓₔₕₖₗₘₙₚₛₜ-⃐-⃑-⃒-⃓-⃔-⃕-⃖-⃗-⃘-⃙-⃚-⃛-⃜-⃥-⃦-⃧-⃨-⃩-⃪-⃫-⃬-⃭-⃮-⃯-⃰→⇒⨧ⱼⱽⵯ-ⷠ-ⷡ-ⷢ-ⷣ-ⷤ-ⷥ-ⷦ-ⷧ-ⷨ-ⷩ-ⷪ-ⷫ-ⷬ-ⷭ-ⷮ-ⷯ-ⷰ-ⷱ-ⷲ-ⷳ-ⷴ-ⷵ-ⷶ-ⷷ-ⷸ-ⷹ-ⷺ-ⷻ-ⷼ-ⷽ-ⷾ-ⷿ-゙-゚-꙯-꙼-꙽ꚜꚝꜛꜜꜝꜞꜟꞈ꞉꞊-꣠-꣡-꣢-꣣-꣤-꣥-꣦-꣧-꣨-꣩-꣪-꣫-꣬-꣭-꣮-꣯-꣰-꣱ꩰꭜꭞ-︠-︡-︢-︣-︤-︥-︦';
DOLGO['_vowels'] = 'aaeeiioouuyyáãææíõøøĩııœœũũūǒǝɐɐɑɑɒɒɔɔɘɘəəəɚɛɛɜɜɞɞɤɤɨɨɪɪɯɯɵɵɶɶɶɷɿɿʅʅʉʉʊʊʌʌʏʏᴀᴀᴇᴇᴜᴜẽỹ';


/* simple helper function to retrieve sound classes */
function getSoundClass(sound) {
    
		if (sound in DOLGO){
      dolgo = DOLGO[sound] 
    }
    else if (sound.slice(0,2) in DOLGO){dolgo = DOLGO[sound.slice(0,2)];}
    else if (sound.slice(0,1) in DOLGO){dolgo = DOLGO[sound.slice(0,1)];}
    else if (sound.slice(1,3) in DOLGO){dolgo = DOLGO[sound.slice(1,3)];}
    else if (sound.slice(1,2) in DOLGO){dolgo = DOLGO[sound.slice(1,2)];}
    else if (sound == "-"){dolgo = "-";}
    else { dolgo = 'dolgo_ERROR';}

    return dolgo;
}

function plotWord(word, tag, classes) {
  if (typeof tag == 'undefined') {
    tag = 'span';
  }
  /* modify classes to be easily handled and inserted */
  if (typeof classes == 'undefined') {
    classes = ' ';
  }
  else {
    classes = ' ' + classes + ' ';
  }
  try {
    var phones = word.split(' ');
  }
  catch(e) {
    alert(word);
    return '';
  }
  var text = '';
  var ignore = false;
  for(var i=0;i<phones.length;i++)
  {
    var phon = phones[i];

    /* check for ingorable phon */
    if (phon == '(') {
      ignore = true;
    }
    else if (phon == ')') {
      ignore = false;
    }
    else {
      /* now try to find the column */
      var dolgo = "dolgo_ERROR";
      
      if (phon[0] == '!'){phon=phon.slice(1,phon.length)}
      else if (phon in DOLGO){dolgo = "dolgo_"+DOLGO[phon]}
      else if (phon.slice(0,2) in DOLGO){dolgo = "dolgo_"+DOLGO[phon.slice(0,2)];}
      else if (phon.slice(0,1) in DOLGO){dolgo = "dolgo_"+DOLGO[phon.slice(0,1)];}
      else if (phon.slice(1,3) in DOLGO){dolgo = "dolgo_"+DOLGO[phon.slice(1,3)];}
      else if (phon.slice(1,2) in DOLGO){dolgo = "dolgo_"+DOLGO[phon.slice(1,2)];}
      else if (phon == "-"){dolgo = "dolgo_GAP";}
      else if (phon == "(" || phon == ")"){dolgo = "dolgo_IGNORE";}
    }
  
    if (phon == '(') {}
    else if (phon == ')') {}
    else if (phon != '-') {
      if (!ignore) {
        text += '<'+tag+' class="residue'+classes+dolgo+'">'+phon+' </'+tag+'>';
      }
      else {
        text += '<'+tag+' class="residue'+classes+dolgo+' dolgo_IGNORE">'+phon+' </'+tag+'>';
      }
    }
    else  {
      if (!ignore) {
        text += '<'+tag+' class="residue '+classes+dolgo+'">'+phon+' </'+tag+'>';
      }
      else {
        text += '<'+tag+' class="residue'+classes+dolgo+' dolgo_IGNORE">'+phon+' </'+tag+'>';
      }
    }
  }

  return text;
}

function plotMorphemes(word, tag, sep)
{
  if(typeof sep == 'undefined')
  {
    sep = '\\+';
  }
  
  var text_lines = [];
  var morphemes = word.split(new RegExp('\\s'+'*'+sep+'\\s'+'*'));
  for(var i=0,m;m=morphemes[i];i++)
  {
    var morpheme = '<span class="morpheme">'+plotWord(m,tag)+'</span>';
    text_lines.push(morpheme);
  }
  return text_lines.join('<span class="boundary">.</span>');
}

/* let's try to make an ipa2tokens function for the EDICTOR */
function ipa2tokens(sequence) {
  /* return if sequence contains whitespace (=is already tokenized) */
  if (sequence.indexOf(' ') != -1) { return sequence.replace(/^ */,'').replace(/ *$/,''); }

  /* define dvt as basic entities */
  var diacritics = DOLGO['_diacritics']; 
  var tones = DOLGO['_tones'];
  var vowels = DOLGO['_vowels'];
  
  /* prepare the sequence */
  var seqs = sequence.split('');
  var out = [''];
  
  var merge_tone = false;
  var merge_vowel = false;
  var merge_consonant = false;
  
  /* start the loop, main idea is to look back (not in front!), that is, 
   * store for each instance of a vowel, whether it is a vowel, or for a 
   * tone, if it is a tone */
  for (var i=0,seg; seg=seqs[i]; i++) {
    
    /* check for diacritics */
    if (diacritics.indexOf(seg) != -1) {
      out[out.length-1] += seg;
    }
    /* check for tones */
    else if (tones.indexOf(seg) != -1) {
      merge_vowel = false;
      merge_consonant = false;
      if (!merge_tone) {
	out.push(seg);
	merge_tone = true;
      }
      else {
	out[out.length-1] += seg;
      }
    }
    else if (vowels.indexOf(seg) != -1) {
      merge_tone = false;
      merge_consonant = false;

      if (!merge_vowel) {
	out.push(seg);
	merge_vowel = true;
      }
      else {
	out[out.length-1] += seg;
      }
    }
    else if (seg == "p͡f"[1]) {
      out[out.length-1] += seg;
      merge_consonant = true;
      merge_tone = false;
      merge_vowel = false;
    }
    else {
      merge_tone=false;
      merge_vowel=false;

      if (!merge_consonant) {
	out.push(seg);
	merge_tone = false;
	merge_vowel = false;
      }
      else {
	out[out.length-1] += seg;
	merge_consonant=false;
      }
    }
  }

  return out.join(' ').replace(/^ */,'').replace(/ *$/,'');
}

var _ART = {
"7" : ["a","ᴀ","ã","ɑ","á","à","ā","ǎ","â","ɛ","æ","ɜ","ɐ","ʌ","e","ᴇ","ə","ɘ","ẽ","ɤ","è","é","ē","ě","ê","ɚ","Œ","ɒ","œ","ɞ","ɔ","ø","ɵ","o","õ","ó","ò","ō","ô","y","ʏ","ʉ","u","ᴜ","ʊ","i","ɪ","ɨ","ɿ","ʅ","ɯ","ĩ","í","ǐ","ì","î","ī","ɶ","l̩","r̩","ı","E","3","ʮ","ᴇ","ɷ","ᴀ","ǝ","ẽ","ú","ū","ū","ā","ō","ē","ī","ũ","ǒ"],
"3" : ["x","s","z","ʃ","ʒ","ʂ","ʐ","ç","ʝ","š","ž","ɕ","ʑ","ɣ","χ","ɸ","β","f","ƀ","ħ","h","ɦ","θ","θ","ð","ŧ","þ","đ","v","ʙ","ⱱ","ʝ","8","X","S","Z","ḥ","ɧ"],
"2" : ["t͡s","t͜s","d͡z","d͜z","ʦ","ʣ","t͡ɕ","t͜ɕ","d͡ʑ","d͜ʑ","ʨ","ʥ","t͡ʃ","t͜ʃ","d͡ʒ","d͜ʒ","ʧ","ʤ","t͡ʂ","t͜ʂ","d͡ʐ","d͜ʐ","č","ž","t͡θ","t͜θ","p͡f","p͜f","C","ʄ"],
"1" : ["k","g","q","ɢ","ɡ","p","c","ɟ","b","ɓ","ʔ","ʕ","t","d","ȶ","ȡ","ɗ","ʈ","ɖ","G","7","Ɂ"],
"6" : ["j","ɥ","ɰ","w","ʋ","ʍ"],
"4" : ["n","ȵ","ɳ","ŋ","ɴ","ň","ń","ɲ","m","ɱ","4","5","N"],
"5" : ["ɹ","ɻ","ʀ","ɾ","r","ʁ","ɽ","l","ȴ","l","ɭ","ʎ","ʟ","ɬ","ɮ","ɹ","ł","ɫ","ɻ","ɐ̯","L"],
"8" : ["¹","²","³","⁴","⁵","⁻","⁰","₁","₂","₃","₄","₅","₆","₀"],
"9" : ["_","#","+"]
};

/* convert art to a dictionary */
var ART = {};
for (key in _ART) {
  for (var i=0,s; s=_ART[key][i]; i++) {
    ART[s] = parseInt(key);
  }
}

/* function to convert a sound sequence into CcV schema */
function prosodic_string (sequence) {
  
  /* first, make the new sequence */
  out = '';

  /* now, convert to prosodic hierarchy */
  var nums = [0];
  for (var i=0,s; s=sequence[i]; i++) {
    if (s in ART) {
      nums.push(ART[s]);
    }
    else if (s[0] in ART) {
      nums.push(ART[s[0]]);
    }
    else {
      nums.push(0);
    }
  }
  
  nums.push(0);

  /* now we need to determine the down points */
  var first,second,third;
  var splits = {1:[]};
  var cnt = 1;
  for (var i=1; i < nums.length-1; i++) {
    first = nums[i-1];
    second = nums[i];
    third = nums[i+1];

    if ((first > second) && (second < third)) {
      cnt += 1;
      splits[cnt] = [i];
    }
    else {
      splits[cnt].push(i);
    }
  }

  /* now we crawl through each key and have each item filled with 
   * pre-and post-vowel */
  for (key in splits) {
    var prev = true;
    for (var i=0,idx; idx=splits[key][i]; i++) {
      var num = nums[idx];
      var seq = sequence[(idx-1)];
      if (prev && num < 7) {
	out += 'C';
      }
      else if (num == 7) {
	out += 'V';
	prev = false;
      }
      else if (num == 8) {
	out += 'T';
	prev = false;
      }
      else if (num == 9) {
	out += '_';
	prev = false;
      }
      else if (!prev && num != 7) {
	out += 'c';
      }
      else {
	console.log('warning', sequence.join(' '), prev,num,idx, splits[key]);
      }
    }
  }
  return out.split('');
}

/* Starting Script for the Wordlist editor.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-09-03 13:40
 * modified : 2024-06-09 07:02
 *
 */

/* http://www.phpied.com/sleep-in-javascript/ */
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function startWordlist() {
  var pop = document.getElementById('popup_background');
  var spinner = new Spinner().spin();
  pop.appendChild(spinner.el);

  try {
    document.getElementById('file').addEventListener('change', handleFileSelect, false);
    $('#eingang').remove();
    if ('css' in CFG) {
      for(var i=0,line;line=CFG['css'][i];i++) {
        var linesplit = line.split(':');
        var mystring = '$('+"'#"+linesplit[0]+"')."+linesplit[1]+"()";
        eval(mystring);
        CFG['status'][linesplit[0]] = linesplit[1]; 
      }
    }
    return 1;
  }
  catch (e) {
    fakeAlert(e);
    return 0;
  }
}

/* handle key events */
function basickeydown (event) {
  /* CTRL + I */
  if (event.keyCode == 73 && event.ctrlKey) {
    event.preventDefault();
    var ids = document.getElementsByClassName('ID')[0];
    var idx = parseInt(ids.innerHTML);
    editEntry(idx,1,0,0);
    return;
  }
  /* drag table left right when key is pressed */
  else if (event.keyCode == 37 && event.altKey) {
    event.preventDefault();
    $('#qlc_table').animate({
      'marginLeft' : "-=100"
    });
    return;
  }
  /* drag table right when key is pressed */
  else if (event.keyCode == 39 && event.altKey) {
    event.preventDefault();
    $('#qlc_table').animate({
      'marginLeft' : "+=100"
    });
    return;
  }
  /* page down key code */
  else if (event.keyCode == 34) {
    event.preventDefault();
    var next = document.getElementById('next').value;
    var idx = parseInt(next.split('-')[0]);
    showWLS(idx);
  }
  /* page up key code */
  else if (event.keyCode == 33) {
    event.preventDefault();
    var previous = document.getElementById('previous').value;
    var idx = parseInt(previous.split('-')[0]);
    showWLS(idx);
  }
  /* toggle columns F4 */
  else if (event.keyCode == 115) {
    event.preventDefault();
    var cols = document.getElementById('columns');
    if (cols.value != '') {
      cols.value = '';
    }
    else {
      cols.value = '*';
    }
    applyFilter();
    showCurrent();
  }

  /* toggle filters F3*/
  else if (event.keyCode == 114) {
    event.preventDefault();
    $('#textfields').toggle();
  }

  /* toggle help F1 */
  else if (event.keyCode == 112) {
    event.preventDefault();
    $('#help').toggle();
  }
  /* ctrl z goes back */
  else if (event.keyCode == 90 && event.ctrlKey) {
    event.preventDefault();
    UnDo();
  }
  /* ctrl y goes front */
  else if (event.keyCode == 89 && event.ctrlKey) {
    event.preventDefault();
    ReDo();
  }
  /* save page */
  else if (event.keyCode == 69 && event.ctrlKey) {
    event.preventDefault();
    saveFile();
  }
  /* CTRL + S */
  else if (event.keyCode == 83 && event.ctrlKey) {
    event.preventDefault();
    refreshFile();
  }
  /* CTRL + E */
  else if (event.keyCode == 82 && event.ctrlKey) {
    window.location.reload();
  }
  return;
}

document.onkeydown = function(event){basickeydown(event);};

/* undo redo manager */
function UnDo() {
  undoManager.undo();
  var idx = undoManager.getindex();
  var ldx = undoManager.lastindex();
  if (idx != -1) {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }
  if (ldx-1>idx) {
    $('#redo').removeClass('hidden');
    $('#redo').addClass('unhidden');
  }
  else {
    $('#redo').removeClass('unhidden');
    $('#redo').addClass('hidden');
  }  
}

/* undo redo manager */
function ReDo() {
  undoManager.redo();
  var idx = undoManager.getindex();
  var ldx = undoManager.lastindex();
  if (idx != -1) {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }
  if (ldx-1>idx) {
    $('#redo').removeClass('hidden');
    $('#redo').addClass('unhidden');
  }
  else {
    $('#redo').removeClass('unhidden');
    $('#redo').addClass('hidden');
  }  
}


function modifyDisplayForStart() {
  /* carry out basic modification of the display, this is currently still
   * ugly and messy and should definitely be modified next time */
  var modify = ['first','previous', 'next','current','filename'];
  for (i in modify) {
    $('#' + modify[i]).removeClass('unhidden');
    $('#' + modify[i]).addClass('hidden');
  }
  $('#mainsettings').css('display','inline');
  $('#view').css('display','block');
  $('#qlc').html('');
  
  /* add the filename to the filename-button */
  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';

  /* toggle display if the wordlist is not hidden */
  var fd = document.getElementById('filedisplay');
  if (fd.style.display != 'none' && fd.style.display != ''){
    toggleDisplay('', 'filedisplay');
  }

  /* check for navbar */
  if (!CFG['navbar']) {
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('outerbox').style.margin = "20px";
    document.getElementById('filedisplay').style.marginBottom = "25px";
    document.getElementById('add_column').style.display = 'none';
    document.getElementById('mainsettings').style.display = 'none';
    document.getElementById('file').style.display = 'none';
    document.getElementById('ajaxfile').style.display = 'none';
    document.getElementById('menu_handle').style.width = '90%';
    document.getElementById('menu').style.minHeight = "80px";
    document.getElementById('menu').style.margin = "5px";
    document.getElementById('undoredo').style.display = "none";
    var brs = document.getElementsByClassName('menubr');
    for (var i=0, br; br=brs[i]; i++) {
      br.style.display = 'none';
    }
  }
}

/* function handles the cases of remotely stored tsv files
 * which are loaded if the user selects them 
 */
function handleAjax (event, url) {

  if (url == 'url') {
    url = document.getElementById('ajaxfile').value;
  }
  else if (url == 'db') {
    url = document.getElementById('database').value;
  }
  
  /* handle keyup event */
  if (typeof event != 'string') {
    if (event.keyCode != 13) {
      return;
    }
  }

  /* reset whole process in case this is not the first time the stuff
   * stuff is loaded */
  reset();
  
  var postdata = {}
  var new_url; 

  /* check for actual value of url */
  if (url.indexOf('.tsv') == url.length - 4 && url.length -4 != -1) {
    new_url = 'data/' + url;
    CFG['storable'] = false;
    CFG['load_new_file'] = true;
  }
  else {
    var new_url = 'triples/triples.py';
    postdata['file'] = url;
    CFG['load_new_file'] = true;
    
    /* append values for columns etc. to url */
    if (CFG['columns']) {
      postdata['columns'] = CFG['columns'].join('|');
    }
    if (CFG['doculects']) {
      postdata['doculects'] = CFG['doculects'].join('|');
    }
    if (CFG['concepts']) {
      postdata['concepts'] = CFG['concepts'].join('|');
    }
    if (CFG['remote_dbase']) {
      postdata['remote_dbase'] = CFG['remote_dbase'];
    }
    if (CFG['template']) {
      postdata['template'] = template;
    }
      
    CFG['storable'] = true;
  }

  /* we set the filename as the same as the url */
  CFG['filename'] = url;

  /* load the file by putting all data in the STORE global variable */
  STORE = '';
  $.ajax({
        async: false,
        type: "POST",
        contentType: "application/text; charset=utf-8",
	      data: postdata,
        url: new_url,
        dataType: "text",
        success: function(data) {
          STORE = data;
        },
        error: function() {
          CFG['storable'] = false;
        }    
  });
  
  modifyDisplayForStart();
}

/* helper function that handles the drag over event */
function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

/* read url parameters */
if (document.URL.indexOf('=') != -1) {
  var tmp_url = document.URL.split('#');
  var query = tmp_url[0].split('?')[1];
  var keyvals = query.split('&');
  var params = {};
  for (var i=0; i<keyvals.length; i++) {
    var keyval = keyvals[i].split('=');
    params[keyval[0]] = keyval[1];
  }
  PARAMS = params;

  reset();
    
  /* account for display modifications */
  if ('sound_classes' in params) {
    for (var i=0,dlg; dlg=CFG['sound_classes'][i]; i++) {
      var vals = dlg.split(':');
      DOLGO[vals[0]] = vals[1];
    }
  }

  /* account for tables displayed */
  if ('display' in params) {
    PARAMS['display'] = PARAMS['display'].split('|');
  }
  
  /* account for server-side stuff */
  if (CFG.server_side_files.indexOf(params['file']) != -1) {
    handleAjax("event",params['file']);
    try {
    $('#welcome').remove();

      showWLS(1);
      toggleDisplay('','filedisplay');
      $('#textfields').show();
    }
    catch (e) {
      $('#view').css('display','block');
    }
  }
  else if ('file' in params) {
    handleAjax("event", params['file']);
    $('#welcome').remove();
    try {
      toggleDisplay('','filedisplay');
      showWLS(1);
      $('#textfields').show();
    }
    catch (e) {
      $('#view').css('display', 'block');
    }
  }
}
else if (typeof localStorage.text != 'undefined') {
    modifyDisplayForStart();
    toggleDisplay('','filedisplay');
    $('#welcome').remove();
    showWLS(1);
    $('#textfields').show();
}  if ('display' in CFG) {
    if (CFG.display.indexOf('cognates') != -1) {
      document.getElementById('toggle_cognates').onclick({"preventDefault": function(x){return x}}, 'sortable', 'cognates', 'colx largebox');
    }
    if (CFG.display.indexOf('filedisplay') == -1) {
      document.getElementById('toggle_filedisplay').onclick({"preventDefault": function(x){return x}}, 'filedisplay');
    }
    if (CFG.display.indexOf('morphology') != -1) {
      document.getElementById('toggle_morphology').onclick({"preventDefault": function(x){return x}}, 'sortable', 'morphology', 'colx largebox');
    }
  }


/* handle the different resources which are loaded using ajax */
var tmp_file_handler = '';
    if ('display' in CFG) {
      if (CFG.display.indexOf('cognates') != -1) {
	document.getElementById('toggle_cognates').onclick({"preventDefault": function(x){return x}}, 'sortable', 'cognates', 'colx largebox');
      }
      if (CFG.display.indexOf('filedisplay') == -1) {
	document.getElementById('toggle_filedisplay').onclick({"preventDefault": function(x){return x}}, 'filedisplay');
      }
      if (CFG.display.indexOf('morphology') != -1) {
	document.getElementById('toggle_morphology').onclick({"preventDefault": function(x){return x}}, 'sortable', 'morphology', 'colx largebox');
      }
    }


function loadAjax(event, where, what, classes) {  
  event.preventDefault();
  if (CFG.loaded_files.indexOf(what) != -1) {
    if (what == 'settings') {
      UTIL.load_settings();
    }
    $('#'+what).toggle();
    if (document.getElementById(what).style.display == 'none') {
      window.location.hash = '#top';
    }
    else {
      window.location.hash = '#'+what+'_anchor';
    }
    $('#toggle_'+what+' > span').toggle();
    return;
  }
  CFG.loaded_files.push(what); 
  $('#'+where).append('<li id="'+what+'" class="'+classes+'"></li>');
  $.ajax( {
      async:false,
      type: "GET",
      url: "panels/" + what + '.html',
      dataType: "text",
      success: function(data)  {
        tmp_file_handler = data;
      }
    });

  document.getElementById(what).innerHTML = '<a name="'+what+'_anchor" ' + 
    'style="visibility:hidden;position:relative;top:-100px">alala</a>' +
    tmp_file_handler;
  window.location.hash = '#'+what+'_anchor';

  if (what == 'customize') {
    $('#file_nameX').autocomplete({
      delay: 0,
      source: CFG['server_side_files']
    });
  }
  if (what == 'phonology') {
    $('#input_phonology').autocomplete({
      delay: 0,
      source: Object.keys(WLS['taxa'])
    });
  }
  if (what == 'morphology') {
    $('#input_morphology').autocomplete({
      delay: 0,
      source: Object.keys(WLS['taxa'])
    });
  }

  if (what == 'correspondences') {
    var doculs = CFG.sorted_taxa;
    $('#corrs_docula').autocomplete({
      delay: 0, source: doculs});
    $('#corrs_doculb').autocomplete({
      delay: 0, source: doculs
    });
    $('#corrs_context').autocomplete({
      delay: 0, source: Object.keys(WLS.columns),
      select: function(event,ui){CORRS.show_correspondences('doculA',1)}
    });
  }

  $('#toggle_'+what+' > span').toggle();  


}

/* helper function for URL creation */
function makeMyURL() {
  var base_url = "https://edictor.org?";

  var menuX = document.getElementById("showMenuX");
  var filtersX = document.getElementById("showFiltersX");
  var dbase = document.getElementById("showDatabase");
  var previewX = document.getElementById("showPreviewX");
  var basicsX = document.getElementById("basic_fieldsX");
  var pinyinX = document.getElementById("pinyinX");
  var sampaX = document.getElementById("sampaX");
  var highlightX = document.getElementById("highlightX");
  var file_nameX = document.getElementById("file_nameX");
  var formatterX = document.getElementById("formatterX");
  
  /* check out on-off-switches (could be done more elegantly, but this suffices so far */
  if (menuX.checked && filtersX.checked) {
    base_url += 'css=menu:show|textfields:show|'; 
  }
  else if (menuX.checked) {
    base_url += 'css=menu:show|textfields:hide|';
  }
  else if (filtersX.checked) {
    base_url += 'css=menu:hide|textfields:show|';
  }
  else {
    base_url += 'css=menu:hide|textfields:hide|';
  }
  
  /* check out database and append to url */
  if ( dbase.checked ) {
    base_url += 'database:show'; 
  }
  else {
    base_url += 'database:hide'; 
  }
  
  if (formatterX.value != '') {
    base_url += '&formatter='+formatterX.value.replace(/\s/g, '').toUpperCase();
  }


  if (previewX.value != '') {
    base_url += '&preview='+previewX.value;
  }
  if (basicsX.value != '') {
    base_url += '&basics='+basicsX.value.toUpperCase().replace(/,/g, '|').replace(/\s/g, '');
  }
  base_url += '&sampa='+sampaX.value.toUpperCase().replace(/,/g, '|').replace(/\s/g, '');
  base_url += '&highlight='+highlightX.value.toUpperCase().replace(/,/g, '|').replace(/\s/g, '');
  if (file_nameX.value != '') {
    base_url += '&file='+file_nameX.value;
  }
  
  var my_url = document.getElementById('generated_url');
  my_url.innerHTML = '<br><strong>Copy your URL from the field below or' + 
    ' open it directly via this <a style="color:Crimson;" target="_blank" ' +
    'href="'+base_url+'">this link:</a>';
  my_url.innerHTML += '<br><br><pre><code>'+base_url+'</code></pre>';
  return 1;
}

function makeMyTemplate() {
  /* function creates customized templates for the user */
  var cols = document.getElementById('template_columns');
  var lngs = document.getElementById('template_languages');
  var conc = document.getElementById('template_concepts');
  var syns = document.getElementById('template_synonyms');
  var glcs = document.getElementById('template_glottocode'); 

  var concept_lists = [];
  for(var i=0,option;option=conc.options[i];i++) {
    if (option.selected) {
      concept_lists.push(option.value);
    }
  }

  /* first get the concept list */
  var tmp = '';
  $.ajax( {
      async:false,
      type: "GET",
      url: 'data/conceptlists/'+concept_lists[0]+'.tsv',
      dataType: "text",
      success: function(data)  {
        tmp = data;
  var glosses = {};
  var rows = tmp.split(/\r\n|\n/);
  var header = rows[0].split(/\s*\t\s*/);
  //-> console.log(header);
  var owIdx = header.indexOf('CONCEPTICON_ID');
  var glIdx = header.indexOf('ENGLISH');
  var nrIdx = header.indexOf('NUMBER');
  for(var i=1,row;row=rows[i];i++) {
    var cells = row.split(/\s*\t\s*/);
    glosses[cells[owIdx]] = [cells[nrIdx],cells[glIdx]];
  }

  /* now we start creating the text */
  var doculects = lngs.value.split(',');
  var glottos = glcs.value.split(',');
  var columns = cols.value.split(',');
  
  if (columns.length == 0 || doculects.length == 0) {
    fakeAlert("You must specify values for both the COLUMNS and the DOCULECT option.");
    return;
  }
  var text = 'ID\t'+columns.join('\t')+'\n';
  text = text.replace('CONCEPT','CONCEPT\tCONCEPTICON_ID');
  var counter = 1;
  for(gloss in glosses) {
    for(var i=0,doculect;doculect=doculects[i];i++) {
      for(var j=0;j<parseInt(syns.value);j++) {
        text += counter;
        counter += 1;
        for(var k=0,cell;cell=columns[k];k++) {
          var itm = cell.toUpperCase();
          if (itm == 'DOCULECT') {
            text += '\t'+doculect;
          }
          else if (itm == 'CONCEPT') {
            text += '\t'+ glosses[gloss][1]+'\t'+gloss;
          }
          else if (itm == 'GLOTTOLOG') {
            if (typeof glottos[i] != 'undefined') {
              text += '\t'+glottos[i];
            }
            else {fakeAlert("You did not specify enough glottocodes for all your languages."); return;}
          }
          else {
            text += '\t-';
          }
        }
        text += '\n';
      }
    }
  }
  CFG['template'] = text;
  saveTemplate(); 

      }
    });

}

function showSpinner(code, time) {
  if (typeof time == "undefined"){
    time = 10;
  }
  $('#popup_background').toggle();
  setTimeout(function(){
    code();
    $('#popup_background').toggle();
  }, time);
}

/* a simple helper function for those cases where no ajax load will create the elements
 * in our file display */
function toggleDisplay(event,elm_id) {
  if (typeof event != 'string') {
    event.preventDefault();
  }
  $('#'+elm_id).toggle();
  $('#toggle_'+elm_id+'>span').toggle();  
}


function startEverything () {

  /* handle server-side files */
  $.ajax({
    async: false,
    type: "GET",
    url: 'data/filelist.csv',
    contentType: 'application/text; charset=utf-8',
    dataType: "text",
    success: function(data) {
      CFG['server_side_files'] = data.split('\n');
      /* manage autocomplete */
      $('#ajaxfile').autocomplete({
        delay: 0,
        source: CFG['server_side_files']
      });
    },
    error: function() {
      fakeAlert("Could not load remote files. Usage will be restricted " + 
          " to explicit file selection.");
      $('#ajaxfile').hide(); 
    }
  });

  /* Check if this is the local version */
  $.ajax({
    async: false,
    type: "POST",
    url: 'check.py',
    contentType: 'application/text; charset=utf-8',
    dataType: "text",
    success: function(data) {
      if (data.indexOf("python") != -1) {
        console.log("running with Python");
        CFG["python"] = true;
      }
      else if (data.indexOf("lingpy") != -1) {
        console.log("running with LingPy");
        CFG["python"] = true;
        CFG["lingpy"] = true;
        CFG["with_lingpy"] = true;
        document.getElementById("settings_with_lingpy").style.display = "table-row";
      }
    },
    error: function() {
      document.getElementById("save-python").style.display = "none";
      CFG["python"] = false;
    }
  });

  startWordlist();



  /* make stuff sortable, based on 
   * http://stackoverflow.com/questions/18365768/jquery-ui-sortable-placeholder-clone-of-item-being-sorted */
  $(function() {
    $("#sortable").sortable({
      start: function( event, ui ) {
        clone = $(ui.item[0].outerHTML).clone();
      },
      placeholder: {
        element: function(clone, ui) {
          return $('<li class="selected" style="opacity:0.2;">'+clone[0].innerHTML+'</li>');
        },
        update: function() {
          return;
        }
      },
      handle: '.main_handle',

    });

  });

  $('.colx').addClass('ui-helper-clearfix');
  $(window).load(function(){$("#popup_background").fadeOut("fast");});

}

//-> console.log('starter loaded now');
startEverything();

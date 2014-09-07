/* Starting Script for the Wordlist editor.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-09-03 13:40
 * modified : 2014-09-06 20:24
 *
 */

//reload = false;

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

    if (typeof localStorage.text == 'undefined'){}
    else {
      STORE = localStorage.text;
      $("#last").show();
      var last = document.getElementById('last');
      last.value = "VIEW "+"<"+localStorage.filename+">";
      document.getElementById('filename').innerHTML = '<'+localStorage.filename+'>';
      CFG['filename'] = localStorage.filename;
    }
    $('#eingang').remove();
    if ('css' in CFG) {
      for(var i=0,line;line=CFG['css'][i];i++) {
        var linesplit = line.split(':');
        var mystring = '$('+"'#"+linesplit[0]+"')."+linesplit[1]+"()";
        eval(mystring);
        CFG['status'][linesplit[0]] = linesplit[1]; 
      }
    }
    /* check for database in which the stuff will be stored */
    if (CFG['status']['database'] == 'show')
    {
      getDataBases();
    }

    return 1;
  }
  catch (e) {
    fakeAlert(e);
    return 0;
  }
}

function toggleDiv(divid) {
  var divo = document.getElementById(divid);
  if (divo.style.display != 'none') {
    divo.style.display = 'none';
  }
  else {
    divo.style.display = 'block';
  }
}

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
  /* toggle settings F2 */
  else if (event.keyCode == 113) {
    event.preventDefault();
    $('#settings').toggleClass("hidden unhidden");
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

  /* check for actual value of url */
  if (url.indexOf('.tsv') == url.length - 4 && url.length -4 != -1) {
    var new_url = 'data/'+url;
    CFG['storable'] = false;
  }
  else {
    var new_url = 'triples/triples.php?file='+url;
    CFG['storable'] = true;
  }

  console.log(new_url);

  /* we set the filename as the same as the url */
  localStorage.filename = url;
  CFG['filename'] = url;

  /* load the file by putting all data in the STORE global variable */
  STORE = '';
  $.ajax({
        async: false,
        type: "GET",
        contentType: "application/text; charset=utf-8",
        url: new_url,
        dataType: "text",
        success: function(data) {
          STORE = data;
        },
        error: function() {
          CFG['storable'] = false;
        }    
  });
  
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

  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';
}

/* helper function that handles the drag over event */
function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

/* handle server-side files */
$.ajax({
      async:false,
      type: "GET",
      url: 'data/filelist.csv',
      dataType: "text",
      success: function(data) {
        CFG['server_side_files'] = data.split('\n');
        /* manage autocomplete */
        $('#ajaxfile').autocomplete({
          delay:0,
          source: CFG['server_side_files']
        });
      },
      error: function() {
        fakeAlert("Could not load remote files. Usage will be restricted " + 
            " to explicit file selection.");
        $('#ajaxfile').hide(); 
      }    
});

function getDataBases() {
  console.log("Loading database");
  $.ajax({
        async: false,
        type: "GET",
        url: 'triples/triples.php?tables',
        dataType : "text",
        success: function(data) {
          CFG['server_side_bases'] = data.split('\n');
          /* manage autocomplete */
          $('#database').autocomplete({
            delay: 0,
            source: CFG['server_side_bases']
          });
        },
        error: function() {console.log('failed to load');}
  });
}

if (document.URL.indexOf('=') != -1) {
  var tmp_url = document.URL.split('#');
  var query = tmp_url[0].split('?')[1];

  //var query = document.URL.split('?')[1];
  var keyvals = query.split('&');
  var params = {};
  for (var i=0; i<keyvals.length; i++) {
    var keyval = keyvals[i].split('=');
    params[keyval[0]] = keyval[1];
  }
  PARAMS = params;
  reset();

  if (CFG.server_side_files.indexOf(params['file']) != -1) {
    handleAjax("event",params['file']);
    try {
      showWLS(1);
    }
    catch (e) {
      $('#view').css('display','block');
    }
  }
  else if('file' in params) {
    handleAjax("event", params['file']);
    try {
      $('#toggle_filedisplay > span').toggle();
      showWLS(1);
    }
    catch (e) {
      $('#view').css('display', 'block');
    }
  }
}

/* handle the different resources which are loaded using ajax */
var tmp_file_handler = '';
var loaded_files = [];
function loadAjax(event, where, what, classes) {
  
  event.preventDefault();

  if (loaded_files.indexOf(what) != -1) {
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

  loaded_files.push(what); 

  $('#'+where).append('<li id="'+what+'" class="'+classes+'"></li>');
  $.ajax( {
      async:false,
      type: "GET",
      url: what+'.html',
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

  $('#toggle_'+what+' > span').toggle();
}

/* helper function for URL creation */
function makeMyURL() {
  var base_url = "http://tsv.lingpy.org?";

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
    base_url += 'css=menu:show,textfields:show,'; 
  }
  else if (menuX.checked) {
    base_url += 'css=menu:show,textfields:hide,';
  }
  else if (filtersX.checked) {
    base_url += 'css=menu:hide,textfields:show,';
  }
  else {
    base_url += 'css=menu:hide,textfields:hide,';
  }
  
  /* check out database and append to url */
  if ( dbase.checked ) {
    base_url += 'database:show,'; 
  }
  else {
    base_url += 'database:hide,'; 
  }
  
  if (formatterX.value != '') {
    base_url += '&formatter='+formatterX.value;
  }


  if (previewX.value != '') {
    base_url += '&preview='+previewX.value;
  }
  if (basicsX.value != '') {
    base_url += '&basics='+basicsX.value;
  }
  if (pinyinX.value != '') {
    base_url += '&pinyin='+pinyinX.value;
  }
  if (sampaX.value != '') {
    base_url += '&sampa='+sampaX.value;
  }
  if (highlightX.value != '') {
    base_url += '&highlight='+highlightX.value;
  }
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
      url: 'data/conceptlists/'+concept_lists[0],
      dataType: "text",
      success: function(data)  {
        tmp = data;
      }
    });

  var glosses = {};
  var rows = tmp.split(/\n/);
  var header = rows[0].split('\t');
  var owIdx = header.indexOf('OMEGAWIKI');
  var glIdx = header.indexOf('GLOSS');
  var nrIdx = header.indexOf('NUMBER');
  for(var i=1,row;row=rows[i];i++) {
    var cells = row.split('\t');
    glosses[cells[owIdx]] = [cells[nrIdx],cells[glIdx]];
  }

  /* now we start creating the text */
  var doculects = lngs.value.split(',');
  var columns = cols.value.split(',');

  var text = 'ID\t'+columns.join('\t')+'\n';
  text = text.replace('CONCEPT','CONCEPT\tOMEGAWIKI');
  text += '#\n';

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
          else {
            text += '\t-';
          }
        }
        text += '\n';
      }
    }
    text += '#\n';
  }

  CFG['template'] = text;

  saveTemplate(); 
}

function showSpinner(code) {
  $('#popup_background').toggle();
  setTimeout(function(){
    code();
    $('#popup_background').toggle();
  }, 10);
}

/* a simple helper function for those cases where no ajax load will create the elements
 * in our file display */
function toggleDisplay(event,elm_id) {
  event.preventDefault();
  $('#'+elm_id).toggle();
  $('#toggle_'+elm_id+'>span').toggle();  
}

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

$(window).load(function(){$("#popup_background").fadeOut("slow");});

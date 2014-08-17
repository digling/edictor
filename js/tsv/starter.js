reload = false;


/* http://www.phpied.com/sleep-in-javascript/ */
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function startWordlist()
{
  try
  {
    document.getElementById('file').addEventListener('change', handleFileSelect, false);
    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop_zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect2, false);
    dropZone.style.backgroundColor = "#2e5ca8";

    if(typeof localStorage.text == 'undefined'){}
    else
    {
      STORE = localStorage.text;
      $("#last").show();
      //$("#last").removeClass("hidden");
      //$("#last").addClass("unhidden");
      var last = document.getElementById('last');
      last.value = "VIEW "+"<"+localStorage.filename+">";
      document.getElementById('filename').innerHTML = '<'+localStorage.filename+'>';
      CFG['filename'] = localStorage.filename;
    }
    $('#eingang').remove();
    if('css' in CFG)
    {
      for(var i=0,line;line=CFG['css'][i];i++)
      {
        var linesplit = line.split(':');
        var mystring = '$('+"'#"+linesplit[0]+"')."+linesplit[1]+"()";
        eval(mystring);
      }
    }
    return 1;
  }
  catch (e)
  {
    fakeAlert(e);
    return 0;
  }
}

function toggleDiv(divid)
{
  var divo = document.getElementById(divid);
  if(divo.style.display != 'none')
  {
    divo.style.display = 'none';
  }
  else
  {
    divo.style.display = 'block';
  }
}


function basickeydown (event) {
  /* CTRL + I */
  if(event.keyCode == 73 && event.ctrlKey)
  {
    event.preventDefault();
    var ids = document.getElementsByClassName('ID')[0];
    var idx = parseInt(ids.innerHTML);
    editEntry(idx,1,0,0);
    return;
  }
  /* drag table left right when key is pressed */
  else if(event.keyCode == 37 && event.altKey)
  {
    event.preventDefault();
    $('#qlc_table').animate({
      'marginLeft' : "-=100"
    });
    return;
  }
  /* drag table right when key is pressed */
  else if(event.keyCode == 39 && event.altKey)
  {
    event.preventDefault();
    $('#qlc_table').animate({
      'marginLeft' : "+=100"
    });
    return;
  }
  /* page down key code */
  else if(event.keyCode == 34)
  {
    event.preventDefault();
    var next = document.getElementById('next').value;
    var idx = parseInt(next.split('-')[0]);
    showWLS(idx);
  }
  /* page up key code */
  else if(event.keyCode == 33)
  {
    event.preventDefault();
    var previous = document.getElementById('previous').value;
    var idx = parseInt(previous.split('-')[0]);
    showWLS(idx);
  }
  /* toggle columns F4 */
  else if(event.keyCode == 115)
  {
    event.preventDefault();
    var cols = document.getElementById('columns');
    if(cols.value != '')
    {
      cols.value = '';
    }
    else
    {
      cols.value = '*';
    }
    applyFilter();
    showCurrent();
  }
  /* toggle settings F2 */
  else if(event.keyCode == 113)
  {
    event.preventDefault();
    $('#settings').toggle();
  }
  /* toggle filters F3*/
  else if(event.keyCode == 114)
  {
    event.preventDefault();
    $('#textfields').toggle();
  }

  /* toggle help F1 */
  else if(event.keyCode == 112)
  {
    event.preventDefault();
    $('#help').toggle();
  }
  /* ctrl z goes back */
  else if(event.keyCode == 90 && event.ctrlKey)
  {
    event.preventDefault();
    UnDo();
  }
  /* ctrl y goes front */
  else if(event.keyCode == 89 && event.ctrlKey)
  {
    event.preventDefault();
    ReDo();
  }
  /* save page */
  else if(event.keyCode == 69 && event.ctrlKey)
  {
    event.preventDefault();
    saveFile();
  }
  /* CTRL + S */
  else if(event.keyCode == 83 && event.ctrlKey)
  {
    event.preventDefault();
    refreshFile();
  }
  /* CTRL + E */
  else if(event.keyCode == 82 && event.ctrlKey)
  {
    window.location.reload();
  }
  return;
}

document.onkeydown = function(event){basickeydown(event);};

function UnDo()
{
  undoManager.undo();
  var idx = undoManager.getindex();
  var ldx = undoManager.lastindex();
  if(idx != -1)
  {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else
  {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }
  if(ldx-1>idx)
  {
    $('#redo').removeClass('hidden');
    $('#redo').addClass('unhidden');
  }
  else
  {
    $('#redo').removeClass('unhidden');
    $('#redo').addClass('hidden');
  }  
}
function ReDo()
{
  undoManager.redo();
  var idx = undoManager.getindex();
  var ldx = undoManager.lastindex();
  if(idx != -1)
  {
    $('#undo').removeClass('hidden');
    $('#undo').addClass('unhidden');
  }
  else
  {
    $('#undo').removeClass('unhidden');
    $('#undo').addClass('hidden');
  }
  if(ldx-1>idx)
  {
    $('#redo').removeClass('hidden');
    $('#redo').addClass('unhidden');
  }
  else
  {
    $('#redo').removeClass('unhidden');
    $('#redo').addClass('hidden');
  }  
}

function handleFileSelect2(evt) 
{  
  evt.stopPropagation();
  evt.preventDefault();
  
  /* reset if wordlist has been parsed already */
  reset();
  
  var files = evt.dataTransfer.files; /* FileList object */
  var file = files[0];
  //var store = document.getElementById('store');
  CFG['filename'] = file.name;
  localStorage.filename = file.name;
  STORE = '';

  /* create file reader instance */
  var reader = new FileReader({async:false});
  reader.onload = function(e){STORE = reader.result;}
  reader.readAsText(file);

  var modify = ['previous', 'next', 'first','current', 'filename'];
  for (i in modify)
  {
    $('#' + modify[i]).removeClass('unhidden');
    $('#' + modify[i]).addClass('hidden');
  }

  document.getElementById('mainsettings').style.display = 'inline';
  document.getElementById('view').style.display = 'block';
  document.getElementById("qlc").innerHTML = '';

  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';
  var dropZone = document.getElementById('drop_zone');
  //dropZone.style.display = "none";

}

function handleAjax(event,url)
{
  if(typeof event != 'string')
  {
    if(event.keyCode != 13)
    {
      return;
    }
  }
  reset();
  localStorage.filename = url;
  STORE = '';
  CFG['filename'] = url;
  
  $.ajax(
      {
        async: false,
        type: "GET",
        contentType: "application/text; charset=utf-8",
        url: 'data/'+url,
        dataType: "text",
        success: function(data) {STORE = data;}
      });

  var modify = ['first','previous', 'next','current','filename'];
  for (i in modify)
  {
    $('#' + modify[i]).removeClass('unhidden');
    $('#' + modify[i]).addClass('hidden');
  }
  

  $('#mainsettings').css('display','inline');
  $('#view').css('display','block');
  $('#qlc').html('');

  //document.getElementById("qlc").innerHTML = '';
  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';

  //var dropZone = document.getElementById('drop_zone');
  //dropZone.style.display = "none";
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}



var server_side_files = [];
$.ajax(
    {
      async:false,
      type: "GET",
      url: 'data/filelist.csv',
      dataType: "text",
      success: function(data) {server_side_files = data.split('\n');}
      //error: fakeAlert("could not load filelist.")
    });

$('#ajaxfile').autocomplete(
    {
      delay: 0,
      source: server_side_files
    });

if(document.URL.indexOf('=') != -1)
{
  var tmp_url = document.URL.split('#');
  var query = tmp_url[0].split('?')[1];

  //var query = document.URL.split('?')[1];
  var keyvals = query.split('&');
  var params = {};
  for(var i=0;i<keyvals.length;i++)
  {
    var keyval = keyvals[i].split('=');
    params[keyval[0]] = keyval[1];
  }
  PARAMS = params;
  reset();
  
  if(server_side_files.indexOf(params['file']) != -1)
  {
    handleAjax("event",params['file']);
    try
    {
      showWLS(1);
    }
    catch(e)
    {
      $('#view').css('display','block');
    }
  }

}

var tmp_file_handler = '';
var loaded_files = [];

function loadAjax(where,what,classes)
{
  if(loaded_files.indexOf(what) != -1)
  {
    $('#'+what).toggle();
    if(document.getElementById(what).style.display == 'none')
    {
      window.location.hash = '#top';
    }
    else
    {
      window.location.hash = '#'+what+'_anchor';
    }
    return;
  }

  loaded_files.push(what); 

  $('#'+where).append('<li id="'+what+'" class="'+classes+'"></li>');
  $.ajax(
    {
      async:false,
      type: "GET",
      url: what+'.html',
      dataType: "text",
      success: function(data) 
      {
        tmp_file_handler = data;
      }
    });


  document.getElementById(what).innerHTML = '<a name="'+what+'_anchor" style="visibility:hidden;position:relative;top:-100px">alala</a>'+tmp_file_handler;
  $('#'+what).toggle();
  window.location.hash = '#'+what+'_anchor';

  if(what == 'customize')
  {
    $('#file_nameX').autocomplete(
        {
          delay: 0,
          source: server_side_files
        });
  }
}
      
function makeMyURL()
{
  /* helper function for URL creation */

  var base_url = "http://tsv.lingpy.org?";

  var menuX = document.getElementById("showMenuX");
  var filtersX = document.getElementById("showFiltersX");
  var previewX = document.getElementById("showPreviewX");
  var basicsX = document.getElementById("basic_fieldsX");
  var pinyinX = document.getElementById("pinyinX");
  var sampaX = document.getElementById("sampaX");
  var highlightX = document.getElementById("highlightX");
  var file_nameX = document.getElementById("file_nameX");
  var formatterX = document.getElementById("formatterX");

  if(menuX.checked && filtersX.checked)
  {
    base_url += 'css=menu:show,textfields:show,';
  }
  else if(menuX.checked)
  {
    base_url += 'css=menu:show,textfields:hide,';
  }
  else if(filtersX.checked)
  {
    base_url += 'css=menu:hide,textfields:show,';
  }
  else
  {
    base_url += 'css=menu:hide,textfields:hide,';
  }
  
  if(formatterX.value != '')
  {
    base_url += '&formatter='+formatterX.value;
  }


  if(previewX.value != '')
  {
    base_url += '&preview='+previewX.value;
  }
  if(basicsX.value != '')
  {
    base_url += '&basics='+basicsX.value;
  }
  if(pinyinX.value != '')
  {
    base_url += '&pinyin='+pinyinX.value;
  }
  if(sampaX.value != '')
  {
    base_url += '&sampa='+sampaX.value;
  }
  if(highlightX.value != '')
  {
    base_url += '&highlight='+highlightX.value;
  }
  if(file_nameX.value != '')
  {
    base_url += '&file='+file_nameX.value;
  }
  
  var my_url = document.getElementById('generated_url');
  my_url.innerHTML = '<br><strong>Copy your URL from the field below or open it directly via this <a style="color:Crimson;" target="_blank" href="'+base_url+'">this link:</a>';
  my_url.innerHTML += '<br><br><pre><code>'+base_url+'</code></pre>';
  return 1;
}


function makeMyTemplate()
{
  /* function creates customized templates for the user */
  var cols = document.getElementById('template_columns');
  var lngs = document.getElementById('template_languages');
  var conc = document.getElementById('template_concepts');
  var syns = document.getElementById('template_synonyms');
  
  var concept_lists = [];
  for(var i=0,option;option=conc.options[i];i++)
  {
    if(option.selected)
    {
      concept_lists.push(option.value);
    }
  }

  /* first get the concept list */
  var tmp = '';
  $.ajax(
    {
      async:false,
      type: "GET",
      url: 'data/conceptlists/'+concept_lists[0],
      dataType: "text",
      success: function(data) 
      {
        tmp = data;
      }
    });

  var glosses = {};
  var rows = tmp.split(/\n/);
  var header = rows[0].split('\t');
  var owIdx = header.indexOf('OMEGAWIKI');
  var glIdx = header.indexOf('GLOSS');
  var nrIdx = header.indexOf('NUMBER');
  for(var i=1,row;row=rows[i];i++)
  {
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
  for(gloss in glosses)
  {
    for(var i=0,doculect;doculect=doculects[i];i++)
    {
      for(var j=0;j<parseInt(syns.value);j++)
      {
        text += counter;
        counter += 1;
        for(var k=0,cell;cell=columns[k];k++)
        {
          var itm = cell.toUpperCase();
          if(itm == 'DOCULECT')
          {
            text += '\t'+doculect;
          }
          else if(itm == 'CONCEPT')
          {
            text += '\t'+ glosses[gloss][1]+'\t'+gloss;
          }
          else
          {
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

startWordlist();

/* make stuff sortable, based on http://stackoverflow.com/questions/18365768/jquery-ui-sortable-placeholder-clone-of-item-being-sorted */
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
        }

    });
});

$('.colx').addClass('ui-helper-clearfix');

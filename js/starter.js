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
      //$("#last").removeClass("inactive");
      //$("#last").addClass("active");
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
    $('#undo').removeClass('inactive');
    $('#undo').addClass('active');
  }
  else
  {
    $('#undo').removeClass('active');
    $('#undo').addClass('inactive');
  }
  if(ldx-1>idx)
  {
    $('#redo').removeClass('inactive');
    $('#redo').addClass('active');
  }
  else
  {
    $('#redo').removeClass('active');
    $('#redo').addClass('inactive');
  }  
}
function ReDo()
{
  undoManager.redo();
  var idx = undoManager.getindex();
  var ldx = undoManager.lastindex();
  if(idx != -1)
  {
    $('#undo').removeClass('inactive');
    $('#undo').addClass('active');
  }
  else
  {
    $('#undo').removeClass('active');
    $('#undo').addClass('inactive');
  }
  if(ldx-1>idx)
  {
    $('#redo').removeClass('inactive');
    $('#redo').addClass('active');
  }
  else
  {
    $('#redo').removeClass('active');
    $('#redo').addClass('inactive');
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

  document.getElementById('mainsettings').style.display = 'inline';
  document.getElementById('view').style.display = 'block';
  document.getElementById("qlc").innerHTML = '';

  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';
  var dropZone = document.getElementById('drop_zone');
  dropZone.style.display = "none";

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
  localStorage.filename = file.name;
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

  
  document.getElementById('mainsettings').style.display = 'inline';
  document.getElementById('view').style.display = 'block';
  document.getElementById("qlc").innerHTML = '';
  var fn = document.getElementById('filename');
  fn.innerHTML = '&lt;'+CFG['filename']+'&gt;';
  var dropZone = document.getElementById('drop_zone');
  dropZone.style.display = "none";
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}



$('#qlc').draggable({axis:"x",cursor:"pointer"}); //,grid:[50,20]});
$('#settings').draggable({cursor:"crosshair"});
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
  var query = document.URL.split('?')[1];
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
    showWLS(1);
  }

}
startWordlist();


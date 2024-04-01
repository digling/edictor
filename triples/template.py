# *-* coding: utf-8 *-*
html1 = r"""
<html>
<head>
  <title>Lexical Databases with HELP of the EDICTOR</title>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <script src="../js/vendor/jquery-1.10.2.js"></script>
  <script src="../js/vendor/bootstrap.min.js"></script>
  <script src="../js/vendor/bootstrap-multiselect.js"></script>
  <link rel="stylesheet" type="text/css" href="../css/main.css" />
</head>
<body>
  <div style="border-radius:10px;padding:10px;margin:10px;" class="form-horizontal bg-info">
    <h3>Select your settings for the {DBASE} database:</h3>
    <div class="form-group" style="padding-left:15px">
      <p>This database contains {DLEN} languages and {CLEN} concepts. Its values
      are distributed over {COLEN} columns.</p>
	<p class="text-center" style="color:#2e5ca8;font-size:120%;font-weight:bold;">Data Selection</p>
      <p>Use parameters of data selection to organize, which part of the database you want to 
      inspect, work on, or check. By using the selections below, you can choose which doculects should
      be displayed, which concepts the selection should contain, and which columns (the main fields of
      data) the resulting wordlist should contain. The result is a specific URL that communicates all
      necessary parameters to the database application and can also be bookmarked for convenience.</p>
      <div class="form-group">
	<label style="text-align:justify;padding-left:15px;">Select Doculects:
	  <select id="doculects" class="selex btn btn-primary submit" multiple="" style="display: none;">
	    {DOCULECTS}
	  </select>
	</label>
      </div>
      <div class="form-group">
	<label  style="text-align:justify;padding-left:15px;">Select Concepts:
	  <select id="concepts" class="selex btn btn-primary submit" multiple="" style="display: none;">
          {CONCEPTS}
	  </select></label>
      </div>
      <div class="form-group">
	<label style="text-align:justify;padding-left:15px;">Select Columns: 
	  <select id="columns" class="selex btn btn-primary submit" multiple="" style="display: none;">
          {COLUMNS}
	  </select></label>
      </div>
	<p class="text-center" style="color:#2e5ca8;font-size:120%;font-weight:bold;">Basic Parameters</p>
      <p>The basic parameters allow you to customize the appearance of your data when you open an
      interactive session in the EDICTOR.</p>
	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label">Show on Start</label>
	  <div class="checkbox">
	    <label style="text-align:justify">
	      <input type="checkbox" name="menu" id="showMenuX" checked /> Menu
	    </label>
	    <label style="text-align:justify">
	      <input type="checkbox" name="filters" id="showFiltersX" /> Filters
	    </label>
	    <label style="text-align:justify">
	      <input type="checkbox" name="filters" id="showDatabase" /> Database
	    </label>
	  </div>
	</div>
	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specifify the basic fields which will be displayed when loading your Wordlist file.">Basic Fields</label>
	  <div class="form-sm-9">
	    <input type="text" class="form-control textfield" style="display:inline;width:70%" value="DOCULECT,CONCEPT,IPA,COGID,ALIGNMENT" id="basic_fieldsX"/>
	  </div>
	</div>
	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specify the
	  formatting options for cognate sets by specifying the field containing cognate IDs.">Cognate
	  ID</label>
	  <div class="form-sm-9">
	    <input id="formatterX" type="text" class="col-sm-3 form-control textfield titled"
					style="width:120px" placeholder="cognate identifier" value="" />
	  </div>
	</div>

	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specify the number of items you want to see in the preview of the Wordlist.">Preview</label>
	  <div class="form-sm-9">
	    <input id="showPreviewX" type="number" class="form-control textfield" style="width:110px" value="10" />
	  </div>
	</div>
	<p class="text-center" style="color:#2e5ca8;font-size:120%;font-weight:bold;">Transformations</p>
      <p>The transformations allow you to control how data is modified automatically when entering
      data in the EDICTOR.</p>

	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specify the fields which shall be transformed to Chinese characters upon input of Pīnyīn.">Pīnyīn</label>
	  <input type="text" class="col-sm-3 form-control textfield" style="width:120px" id="pinyinX" placeholder="Pīnyīn" value="CHINESE" />
	</div>
	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specify the columns in which SAMPA input will be automatically converted to IPA.">SAMPA</label>
	  <input type="text" class="col-sm-3 form-control textfield titled" style="width:70%" id="sampaX" placeholder="SAMPA" value="IPA,TOKENS"/>
	</div>
	<div class="form-group">
	  <label style="text-align:justify" class="col-sm-2 control-label titled" title="Specify the columns in which tokenized input of IPA characters will be automatically converted to highlighted colored output.">Highlight</label>
	  <input type="text" class="col-sm-3 form-control textfield titled" style="width:70%" id="highlightX" placeholder="HIGHLIGHT" value="TOKENS,ALIGNMENT"/>
	</div>
    <button class="btn btn-primary submit3" onclick="makeURL('{DBASE2}','{DBASE3}');">SUBMIT</button>

    <div id="output"></div></div>
    <script>{SCRIPT}</script>
</body>
</html>"""
script = """
$('#concepts').multiselect({
      disableIfEmtpy: true,
      includeSelectAllOption : true,
      enableFiltering: true,
      enableCaseInsensitiveFiltering: true,
 }
    );

$('#doculects').multiselect({
      disableIfEmtpy: true,
      includeSelectAllOption : true,
      enableFiltering: true,
      enableCaseInsensitiveFiltering: true,
}
    );

$('#columns').multiselect({
      disableIfEmtpy: true,
      includeSelectAllOption : true,
      enableFiltering: true,
      enableCaseInsensitiveFiltering: true,
}
    );

var sortprefs = {
  'DOCULECT' : 1,
  'CONCEPT' : 3,
  'GLOSS_IN_SOURCE' :2,
  'IPA' : 5,
  'ENTRY_IN_SOURCE' : 4,
  'TOKENS' : 6,
  'ALIGNMENT' : 7,
  'NOTE' : 8
};

function makeURL(file, dbase) {
  var base_url = 'http://digling.org/edictor?remote_dbase='+dbase
    + '&file='+file
    ;
 
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
    base_url += '&css=menu:show|textfields:show|'; 
  }
  else if (menuX.checked) {
    base_url += '&css=menu:show|textfields:hide|';
  }
  else if (filtersX.checked) {
    base_url += '&css=menu:hide|textfields:show|';
  }
  else {
    base_url += '&css=menu:hide|textfields:hide|';
  }
  
  /* check out database and append to url */
  if ( dbase.checked ) {
    base_url += 'database:show|'; 
  }
  else {
    base_url += 'database:hide|'; 
  }
  
  if (formatterX.value != '') {
    base_url += '&formatter='+formatterX.value;
  }


  if (previewX.value != '') {
    base_url += '&preview='+previewX.value;
  }
  if (basicsX.value != '') {
    base_url += '&basics='+basicsX.value.replace(/,/g,'|');
  }
  if (pinyinX.value != '') {
    base_url += '&pinyin='+pinyinX.value.replace(/,/g,'|');
  }
  if (sampaX.value != '') {
    base_url += '&sampa='+sampaX.value.replace(/,/g,'|');
  }
  if (highlightX.value != '') {
    base_url += '&highlight='+highlightX.value.replace(/,/g,'|');
  }


  /* get selected doculects */
  var docs = document.getElementById('doculects');
  var doculects = [];
  for (var i=0,doc; doc=docs.options[i]; i++) {
    if (doc.selected) {doculects.push(doc.value);
    }
  }

  if (doculects.length != docs.options.length && doculects.length > 0) {
    base_url += '&doculects='+doculects.join('|');
  }

  /* get selected concepts */
  var docs = document.getElementById('concepts');
  var concepts = [];
  for (var i=0,doc; doc=docs.options[i]; i++) {
    if (doc.selected) {concepts.push(doc.value);
    }
  }
  if (concepts.length != docs.options.length && concepts.length > 0) {
    base_url += '&concepts='+concepts.join('|');
  }

  /* get selected columns */
  var docs = document.getElementById('columns');
  var columns = [];
  for (var i=0,doc; doc=docs.options[i]; i++) {
    if (doc.selected) {columns.push(doc.value);
    }
  }
  columns.sort(
      function (x,y) {
	_x = (x in sortprefs) ? sortprefs[x] : x.charCodeAt(0);
	_y = (y in sortprefs) ? sortprefs[y] : y.charCodeAt(0);
	return _x - _y;
      });
  console.log(columns);
  
  if (columns.length != docs.options.length && columns.length > 0) {
    base_url += '&columns='+columns.join('|');
  }

  /* output the url */
  var output = document.getElementById('output');
  output.innerHTML = '<br><br><p style="margin-top:30px;width:60%;font-size:16px">Press <a style="color:red;font-weight:bold;" href="'+base_url+'" target="_blank">here</a> to open the database '
    + 'with your specified settings, or paste the link below in your browser.</p>';
  output.innerHTML += '<pre style="width:60%"><code>'+base_url+'</code></pre>';

}

function MakeTable() {

  var cobu = document.getElementById('coverage_button');
  var json_table = document.getElementById('coverage');

  if (cobu.innerHTML == 'Show Current Data Status') {
    cobu.innerHTML = 'Hide Current Data Status';
    var header = ['iso','subgroup','entries','source','url'];
    var nheader = ['ISO','SUBGROUP','ENTRIES','SOURCE','URL'];
    var out = '';
    out += '<table style="cellspacing:2px;border:2px solid black">';
    out += '<tr><th style="padding:4px;border:1px solid black">NAME</th><th style="padding:4px;border:1px solid black;">'+nheader.join('</th><th style="padding:4px;border:1px solid black;">')+'</th></tr>';
    keys = Object.keys(META);
    keys.sort();
    for(var j=0,key; key=keys[j]; j++) {
      out += '<tr>';
      out += '<td style="border:1px solid black;padding:4px;">'+key+'</td>';
      for (var i=0,h; h=header[i]; i++) {
        if (h == 'iso') {
          var val = '<a href="http://ethologue.com/language/'+META[key][h]+'">'+META[key][h]+'</a>';
        }
        else if (h == 'source') {
          var val = '<a href="http://bibliography.lingpy.org?key='+META[key][h]+'">'+META[key][h]+'</a>';
        }
        else if (h == 'url') {
          var val = '<a href="'+META[key][h]+'">'+META[key][h]+'</a>';
        }
        else {
          var val = META[key][h];
        }
        out += '<td style="padding:4px;border:1px solid black;">'+val+'</td>';
      }
      out += '</tr>';
    }
    out += '</table>';
    json_table.innerHTML = out;
  }
  else {
    cobu.innerHTML = 'Show Current Data Status';
    json_table.innerHTML = '';
  }
}
"""

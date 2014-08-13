/* Newick display for trees based on treelib.js
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-07-30 12:09
 * modified : 2014-07-30 12:09
 *
 */

/* set current font size */
var current_font_size = 10;

/* svg for tree-display */
var svg_popup = '<div id="svgcontainer"><svg viewBox="0 0 500 500" id="svg" class="newick" xmlns="http://www.w3.org/2000/svg" version="1.1"><g transform="matrix(0.493421052631579,0,0,0.493421052631579,284.02630615234375,288.02630615234375)" id="viewport"><path d="M 300 0 150 0" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M 1.8369701987210297e-14 300 9.184850993605149e-15 150" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M 106.06601717798213 106.06601717798212 0 0" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M 150 0 A 150 150 0  0  1 9.184850993605149e-15 150" fill="none" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M -300 3.6739403974420595e-14 -150 1.8369701987210297e-14" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M -5.510910596163089e-14 -300 -2.7554552980815446e-14 -150" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M -106.06601717798215 -106.06601717798212 0 0" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M -150 1.8369701987210297e-14 A 150 150 0  0  1 -2.7554552980815446e-14 -150" fill="none" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M 0 0 A 0 0 0  0  1 0 0" fill="none" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><path d="M 0 0 0 0" style="stroke:black;stroke-width:1;" vector-effect="non-scaling-stroke"></path><text text-anchor="start" y="0" x="300" style="alignment-baseline:middle">a</text><text transform="rotate(90 1.8369701987210297e-14 300)" text-anchor="start" y="300" x="1.8369701987210297e-14" style="alignment-baseline:middle">b</text><text transform="rotate(360 -300 3.6739403974420595e-14)" text-anchor="end" y="3.6739403974420595e-14" x="-300" style="alignment-baseline:middle">c</text><text transform="rotate(270 -5.510910596163089e-14 -300)" text-anchor="start" y="-300" x="-5.510910596163089e-14" style="alignment-baseline:middle">d</text></g><style type="text/css">text{font-size:125px;}</style></svg></div>';

/* setup the viewing controls for the tree */
var controls ='<div id="treeControls"> <img src="dighl/img/radial.svg" onclick="changeTree('+"'radial'"+')"> <img src="dighl/img/cladogram.svg"       onclick="changeTree('+"'cladogram'"+')"> <img src="dighl/img/rectangle.svg"       onclick="changeTree('+"'rectanglecladogram'"+')"> <img src="dighl/img/phylogram.svg"       onclick="changeTree('+"'phylogram'"+')"> <img src="dighl/img/circle.svg"          onclick="changeTree('+"'circle'"+')"> <img src="dighl/img/circlephylogram.svg" onclick="changeTree('+"'circlephylogram'"+')">       <img onclick="enlargeText()" src="dighl/img/plus.svg">     <img onclick="shrinkText()" src="dighl/img/minus.svg">  <img src="dighl/img/download.svg"        onclick="downloadSVG()"> </div>'

/* add a changeTree function to modify a given tree when everything has already been set up */
function changeTree(drawing_type)
{
  var newick = document.getElementById('newick').innerHTML;
  reset_newick();
  showTree(newick, drawing_type);
}

/* simple function creates a popup window to display a newick tree */
function showTree(newick, drawing_type)
{
  /* set default params for drawing_type as radial */
  if(typeof drawing_type == 'undefined')
  {
    drawing_type = 'circle';
  }

  /* append message to the body */
  $('body').append('<div style="display:none" id="message"></div>');

  $('body').append('<div id="newick" style="display:none">'+newick+'</div>');
  
  /* append svg to the body */
  $('body').append('<div id="popup" ><p onclick="'+"reset_newick();"+'" class="close"> × </p><br><br>'+svg_popup+'<br><br>'+controls+'</div>');

  $('#svgcontainer').resizable({aspectRatio: true});

  /* initialize the tree */
  draw_tree(newick, drawing_type);
  $('text').dblclick(function (event){alert("Do you want to edit the node «"+event.target.textContent+"»?")}).css('cursor','pointer');
}

function placeTree(newick, where, drawing_type)
{
  if(typeof drawing_type == 'undefined')
  {
    drawing_type = 'circle';
  }
  /* append message to specified div */
  $('#'+where).append(svg_popup+'<br>'+controls);
}

function downloadSVG()
{
  var svg = document.getElementById('svg');
  var svg_xml = (new XMLSerializer).serializeToString(svg);
  svg_xml = svg_xml.replace('<svg ','<svg width="500" height="500" ');
  var blob = new Blob([svg_xml],{type:'text/svg;charset=utf-8'});
  saveAs(blob, 'newick.svg');
}

function reset_newick()
{
  $('#popup').remove();
  $('#newick').remove();
  $('#message').remove();
}

function enlargeText()
{
  var new_font_size = parseInt(current_font_size) + 15;
  current_font_size = new_font_size;
  var texts = document.getElementsByTagName('text');
  for(var i=0,text;text=texts[i];i++)
  {
    text.style.fontSize = new_font_size + "px";
  }
}

function shrinkText()
{
  var new_font_size = parseInt(current_font_size) - 15;
  current_font_size = new_font_size;
  var texts = document.getElementsByTagName('text');
  for(var i=0,text;text=texts[i];i++)
  {
    text.style.fontSize = new_font_size + "px";
  }
}

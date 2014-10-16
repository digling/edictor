function editDistSimple()
{
  var stringA = document.getElementById("stringA").value;
  var stringB = document.getElementById("stringB").value;

  if(stringA == '' || stringB == '')
  {
    document.getElementById('output').innerHTML = '';
    return;
  }
  
  if(stringA.indexOf(' ') != -1 || stringB.indexOf(' ') != -1)
  {
    var seqA = stringA.split(' ');
    var seqB = stringB.split(' ');

    var alignments = editList(seqA,seqB);
  }
  else
  {
    var alignments = editDist(stringA,stringB);
  }
  var almA = alignments[0];
  var almB = alignments[1];
  var ED = alignments[2];
  
  /* get index for identical elements */
  var almas = '';
  var almbs = '';
  var idx = [];
  for(i=0;i<almA.length;i++)
  {
    var charA = almA[i];
    var charB = almB[i];
    if(charA == charB)
    {
      almas += '<td class="alm match">'+charA+'</td>';
      almbs += '<td class="alm match">'+charB+'</td>';
    }
    else if(charA == "-" || charB == "-")
    {
      almas += '<td class="alm gap">'+charA+"</td>";
      almbs += '<td class="alm gap">'+charB+"</td>";
    }
    else if(charA.indexOf(charB.slice(0,1)) != -1 || charB.indexOf(charA.slice(0,1)) != -1)
    {
      almas += '<td class="alm smatch">'+charA+"</td>";
      almbs += '<td class="alm smatch">'+charB+"</td>";
    }
    else
    {
      almas += '<td class="alm mismatch">'+charA+"</td>";
      almbs += '<td class="alm mismatch">'+charB+"</td>";
    }
  }
  var output = '';
  output = '<br>';
  output += "<b>Edit-Distance: "+ED+"</b><br><br>";
  output += "<b>Alignment:</b><br><br>";
  output += "<table>";
  output += "<tr>"+almas+"</tr>";
  output += "<tr>"+almbs+"</tr>";
  output += "</table>";

  document.getElementById('output').innerHTML = output; 
}


function editDist(stringA,stringB)
{

  if(stringA == '' || stringB == '')
  {
    return;
  }

  var alen = stringA.length;
  var blen = stringB.length;

  var matrix = [];
  for(var i=0;i<alen+1;i++)
  {
    var inline = [];
    for(var j=0;j<blen+1;j++)
    {
      inline.push(0);
    }
    matrix.push(inline);
  }
  
  
  // initialize matrix
  for(i=1;i<blen+1;i++)
  {
    matrix[0][i] = i;
  }
  for(i=1;i<alen+1;i++)
  {
    matrix[i][0] = i;
  }

  var traceback = [];
  for(var i=0;i<alen+1;i++)
  {
    var inline = [];
    for(var j=0;j<blen+1;j++)
    {
      inline.push(0);
    }
    traceback.push(inline);
  }
  

  // initialize traceback
  for(i=1;i<blen+1;i++)
  {
    traceback[0][i] = 2;
  }
  for(i=1;i<alen+1;i++)
  {
    traceback[i][0] = 1;
  }

  // iterate
  for(i=1;i<alen+1;i++)
  {
    for(j=1;j<blen+1;j++)
    {
      var a = stringA.slice(i-1,i);
      var b = stringB.slice(j-1,j);
      
      if(a == b)
      {
        var dist = matrix[i-1][j-1];
      }
      else
      {
        var dist = matrix[i-1][j-1]+1;
      }
      
      var gapA = matrix[i-1][j]+1;
      var gapB = matrix[i][j-1]+1;

      if(dist < gapA && dist < gapB)
      {
        matrix[i][j] = dist;
      }
      else if(gapA < gapB)
      {
        matrix[i][j] = gapA ;
        traceback[i][j] = 1;
      }
      else
      {
        matrix[i][j] = gapB;
        traceback[i][j] = 2;
      }
      
    }
  }
  
  // no other stupid language needs this line apart from JS!!!
  var i = matrix.length-1;
  var j = matrix[0].length-1;

  // get edit-dist
  var ED = matrix[i][j];

  // get the alignment //
  var almA = [];
  var almB = [];

  while(i > 0 || j > 0)
  {
    if(traceback[i][j] == 0)
    {
      almA.push(stringA.slice(i-1,i));
      almB.push(stringB.slice(j-1,j));
      i--;
      j--
    }
    else if(traceback[i][j] == 1)
    {
      almA.push(stringA.slice(i-1,i));
      almB.push("-");
      i--;
    }
    else
    {
      almA.push("-");
      almB.push(stringB.slice(j-1,j));
      j--
    }   
  }
  
  /* reverse alignments */
  almA = almA.reverse();
  almB = almB.reverse();
  return [almA,almB,ED];
}

function editAll()
{
  var db = document.getElementById('db');
  db.innerHTML = 'works';

  // get first textarea
  var stringsAtmp = document.getElementById('stringsA').value.split('\n');
  var stringsBtmp = document.getElementById('stringsB').value.split('\n');
  
  var stringsA = [];
  var stringsB = [];
  for(i=0;i<stringsAtmp.length;i++)
  {
    var tmp = stringsAtmp[i].replace(/\s+/,' ');
    if(tmp != '')
    {
      stringsA.push(tmp);
    }
  }
  for(i=0;i<stringsBtmp.length;i++)
  {
    var tmp = stringsBtmp[i].replace(/\s+/,' ');
    if(tmp != '')
    {
      stringsB.push(tmp);
    }
  }

  var warning = document.getElementById('warning');
  db.innerHTML = stringsA+' '+stringsA.length+' '+stringsB.length;
  if(stringsA.length != stringsB.length)
  {
    warning.style.display = 'inline';
    warning.innerHTML = '<span class="warning">You need to input the same number of words in both input fields!</span>';
    return;
  }
  else
  {
    warning.style.display = 'none';
  }

  // start aligning the stuff
  var alignments = [];
  var dists = 0;
  var atext = '<b>Alignments</b><br>';
  for(var i=0;i<stringsA.length;i++)
  {
    var stringA = stringsA[i];
    var stringB = stringsB[i];

    if(stringA.indexOf(' ') != -1 || stringB.indexOf(' ') != -1)
    {
      var seqA = stringA.split(' ');
      var seqB = stringB.split(' ');

      var alms = editList(seqA,seqB);
    }
    else
    {
      var alms = editDist(stringA,stringB);
    }

    //var alms = editDist(stringA,stringB);
    var almA = alms[0];
    var almB = alms[1];
    var dist = alms[2];

    alignments.push([almA,almB,dist]);
    dists += dist;
    var num = i+1;
    var tmptext = tabularize(almA,almB,dist)+'<br>';

    tmptext += '<b> Word Pair '+num+' (&quot;'+stringA+'&quot; / &quot;'+stringB+'&quot;):</b><br>';
    atext += tmptext;
  }

  var almdiv = document.getElementById('alignments');
  almdiv.innerHTML = atext;
  almdiv.style.display = 'block';
}

function tabularize(almA,almB,dist)
{
  var text = '';
  var textA = '';
  var textB = '';

  for(var i=0;i<almA.length;i++)
  {
    var elmA = almA[i];
    var elmB = almB[i];
    
    if(elmA == '-' || elmB == '-')
    {
      textA += '<td class="gap alm">'+elmA+'</td>';
      textB += '<td class="gap alm">'+elmB+'</td>';
    }
    else if(elmA == elmB)
    {
      textA += '<td class="match alm">'+elmA+'</td>';
      textB += '<td class="match alm">'+elmB+'</td>';
    }
    else if(elmA.indexOf(elmB.slice(0,1)) != -1 || elmB.indexOf(elmA.slice(0,1)) != -1)
    {
      textA += '<td class="smatch alm">'+elmA+'</td>';
      textB += '<td class="smatch alm">'+elmB+'</td>';
    }
    else
    {
      textA += '<td class="mismatch alm">'+elmA+'</td>';
      textB += '<td class="mismatch alm">'+elmB+'</td>';
    }
  }
  
  text = '<table class="almtbl">';
  text += '<tr>'+textA+'<td class="alm dist" rowspan="2">'+dist+'</td></tr>';
  text += '<tr>'+textB+'</tr>';
  return text;
}

function saveAlms()
{
  var head = '<html> <head> <meta http-equiv="content-type" content="text/html; charset=utf-8"> <style> #db{display:inline;} #alignments{ display: none; float: left; background-color: LightGray; margin-left: 30px; } td.alm{ width:50px; padding-left:10px; padding-right:10px; font-weight:bold; text-align:center; background-color:gray; color:white; border: 1px solid white; } td.dist{ background-color: CornflowerBlue; } td.gap{ background-color:black; } td.match{ background-color:gray; } table.almtbl{ display: block; float: none; border: 5px solid black; } td.mismatch{ color:white; background-color:red; } #warning { display: none; color: red; font-weight: bold; } #stringsA{float:left} #stringsB{float:left;margin-left:10px;} #button1{float:left;margin-left:10px;} </style> </head><body>';
 
  var store = document.getElementById('alignments');

  var blob = new Blob([head+store.innerHTML+'</body></html>'], {type: "text/html;charset=utf-8"});
  saveAs(blob, 'alignments.html');  
}

function savePNG()
{
  html2canvas(
      document.getElementById('alignments'), 
      {
        onrendered: function(canvas) {
          Canvas2Image.saveAsPNG(canvas);
          //var blob = new Blob([canvas.toDataURL('image/jpeg')], {type: "image/jpeg"});
          //saveAs(blob, 'alignments.jpg');
          }
      }

      )
  
}


function editList(seqA,seqB)
{

  if(seqA.length == 0 || seqB.length == 0)
  {
    return;
  }

  var alen = seqA.length;
  var blen = seqB.length;

  var matrix = [];
  for(var i=0;i<alen+1;i++)
  {
    var inline = [];
    for(var j=0;j<blen+1;j++)
    {
      inline.push(0);
    }
    matrix.push(inline);
  }
  
  // initialize matrix
  for(i=1;i<blen+1;i++)
  {
    matrix[0][i] = i;
  }
  for(i=1;i<alen+1;i++)
  {
    matrix[i][0] = i;
  }

  var traceback = [];
  for(var i=0;i<alen+1;i++)
  {
    var inline = [];
    for(var j=0;j<blen+1;j++)
    {
      inline.push(0);
    }
    traceback.push(inline);
  }
  

  // initialize traceback
  for(i=1;i<blen+1;i++)
  {
    traceback[0][i] = 2;
  }
  for(i=1;i<alen+1;i++)
  {
    traceback[i][0] = 1;
  }

  var db = document.getElementById('db');
  db.innerHTML = '';

  // iterate
  for(i=1;i<alen+1;i++)
  {
    for(j=1;j<blen+1;j++)
    {
      var a = seqA[i-1];
      var b = seqB[j-1];
      
      if(a == b)
      {
        var dist = matrix[i-1][j-1];
      }
      else if(a.indexOf(b.slice(0,1)) != -1 || b.indexOf(a.slice(0,1)) != -1)
      {
        var dist = matrix[i-1][j-1]+0.5;
      }
      else
      {
        var dist = matrix[i-1][j-1]+1;
      }
      
      var gapA = matrix[i-1][j]+1;
      var gapB = matrix[i][j-1]+1;

      if(dist < gapA && dist < gapB)
      {
        matrix[i][j] = dist;
      }
      else if(gapA < gapB)
      {
        matrix[i][j] = gapA ;
        traceback[i][j] = 1;
      }
      else
      {
        matrix[i][j] = gapB;
        traceback[i][j] = 2;
      }
      
    }
  }
  
  // no other stupid language needs this line apart from JS!!!
  var i = matrix.length-1;
  var j = matrix[0].length-1;

  // get edit-dist
  var ED = matrix[i][j];

  // get the alignment //
  var almA = [];
  var almB = [];

  while(i > 0 || j > 0)
  {
    if(traceback[i][j] == 0)
    {
      almA.push(seqA[i-1]);
      almB.push(seqB[j-1]);
      i--;
      j--
    }
    else if(traceback[i][j] == 1)
    {
      almA.push(seqA[i-1]);
      almB.push("-");
      i--;
    }
    else
    {
      almA.push("-");
      almB.push(seqB[j-1]);
      j--
    }   
  }
  
  /* reverse alignments */
  almA = almA.reverse();
  almB = almB.reverse();
  return [almA,almB,ED];
}

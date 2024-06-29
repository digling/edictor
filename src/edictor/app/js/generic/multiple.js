/* align two list objects */
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

/* Carry out a very simple multiple alignment analysis.
 * The basic idea behind this function is to choose the longest
 * sequence from the pool of sequences being passed to the algorithm,
 * to align all sequences with this one, and to "harmonize" all gaps.
 * As a result, this returns a very simple multiple alignment that works
 * the better, the more similar the sequences are and the better the 
 * longest sequences fits to the rest of the sequences. It seems valid
 * to use this function in the edictor to carry out an initial alignment
 * of sequences once the user chooses to align them.
 */
function multiple(seqs) {

  /* check whether sequences are lists */
  for (var i=0,seq; seq=seqs[i]; i++) {
    if (typeof seq == 'string') {
      seqs[i] = seq.split('');
    }
  }
  
  /* determine the longest sequence */
  var clen = 0;
  var idx = 0;
  for (var i=0,seq; seq=seqs[i]; i++) {

    if (seq.length > clen) {
      clen = seq.length;
      idx = i;
    }
  }

  /* get longest seq */
  var reference = seqs[idx];

  /* create array with one position longer than reference in 
   * order to store the gaps */
  var gaps = [];
  for (var i=0;i<=reference.length; i++) { gaps.push(0)}
  
  /* store aligned sequences */
  var alignments = [];

  /* start aligning all seqs with this seq and store the stuff */
  for (var i=0,seq; seq=seqs[i]; i++) {
    if (i != idx) {
      var alms = editList(reference, seq);
      alignments.push([alms[0],alms[1]]);

      /* iterate over alms to see where gaps have been inserted 
       * in the reference */
      var counter = 0;
      var gcount = 0;
      for (var j=0, segment; segment=alms[0][j]; j++) {
        if (segment == '-') {
          gcount += 1;
          if (gaps[counter] < gcount) {
            gaps[counter] = gcount;
          }
        }
        else {
          counter += 1;
          gcount = 0;
        }
      }
    }
    else {
      alignments.push('x');
    }
  }

  /* convert stuff to gap-string */
  var gapped = [];
  var almIdx = [];
  for (var i=0; i < gaps.length; i++) {
    var gap = gaps[i];
    
    if (i < seqs[idx].length) {
      if (gap == 0) {
        gapped.push(1);
        almIdx.push(seqs[idx][i]);
      }
      else {
        for (var j=0; j < gap; j++) {
          gapped.push(0);
          almIdx.push('-');
        }
        almIdx.push(seqs[idx][i]);
        gapped.push(1);
      }
    }
    else {
      if (gap > 0) {
        for (var j=0; j < gap; j++) {
          gapped.push(0);
          almIdx.push('-');
        }
      }
    }
  }

  /* start combining the stuff */
  var out = [];
  for (var i=0,alignment; alignment=alignments[i]; i++) {
    if (i != idx) {
      /* check for gaps in second string that do not occur in first string */
      var almA = alignment[0];
      var almB = alignment[1];
  
      var counter = 0;
      var almOut = [];
      for (var j=0; j < gapped.length; j++) {
        var gap = gapped[j];
        if (gap == 1) {
          almOut.push(almB[counter]);
          counter += 1;
        }
        else if (gap == 0) {
          if (almA[counter] == '-') {
            almOut.push(almB[counter]);
            counter += 1;
          }
          else {
            almOut.push('-');
          }
        }
      }
      out.push(almOut);
    }
    else {
      var almA = seqs[idx];
      var almOut = [];
      var counter = 0;
      for (var j=0;j < gapped.length; j++) {
        if (gapped[j] == 1) {
          almOut.push(almA[counter]);
          counter += 1;
        }
        else {
          almOut.push('-');
        }
      }
      out.push(almIdx);
    }
  }
  return out;
}

/* function converts a list of input tokens to a sound class schema */
function tokens2class(tokens) {
  var out = [];
  for (var i=0; i<tokens.length; i++) {
    out.push(getSoundClass(tokens[i]));
  }
  return out;
}

/* function converts class strings back to tokens */
function class2tokens(classes, tokens) {
  
  var out = [];
  var counter = 0;
  for (var i=0; i<classes.length; i++) {
    var cls = classes[i];
    var tkn = tokens[counter];
    if (cls == '-') {
      out.push('-');
    }
    else {
      out.push(tkn);
      counter += 1;
    }
  }
  return out;
}

/* carry out simple sound class alignment */
function scalign(seqs) {
  
  /* convert seqs to classes */
  var classes = [];
  for (var i=0; i<seqs.length; i++) {
    classes.push(tokens2class(seqs[i]));
  }

  /* align stuff */
  var alms = multiple(classes);

  /* re-convert to tokens */
  var out = [];
  for (var i=0; i<alms.length; i++) {
    out.push(class2tokens(alms[i],seqs[i]));
  }
  
  return out;
}

//var mystrings = ['voldemort','vladimir','waldemar','volodymyr', 'walter'];
//var m = scalign(mystrings);
//console.log(m);

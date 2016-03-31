/* Main file to load the edictor library.
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-09-04 16:50
 * modified : 2016-03-31 08:29
 *
 */

/* prison variable is our main beest to store things */
var PRISON = {};

/* we pass it a set of modules along with general requirements */
PRISON['modules'] = {
  'highlight' : ['utils'],
  'edit' : ['utils'],
  'sampa' : [],
  'utils' : [],
  'pinyin': [],
  'multiple' : ['utils','highlight'],
  'features' : []
};

PRISON._loadModule = function (module)
{
  var script = document.createElement('script');
  script.src = module+'.js';
  script.async = false;
  script.type="text/javascript";
  document.body.appendChild(script)
};

PRISON._loadStyle = function (style) {
  var script = document.createElement('link');
  script.rel = 'stylesheet';
  script.async = false;
  script.href = style+'.css';
  script.type="text/css";
  document.body.appendChild(script)
};

/* this function can be used for internal loading of a longer list of
 * modules. It checks for dependencies and resorts them accordingly */
PRISON.import = function () {
  /* http://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function */
  var args = Array.prototype.slice.call(arguments, 0);
  var loaded = [];

  /* check function prohibits multiple loading of modules */
  function check_loaded(module) {
    if (loaded.indexOf(module) == -1) {
      loaded.push(module);
      if (module in PRISON.modules) {
        PRISON._loadModule('digling/lib/'+module);
      }
      else {
        PRISON._loadModule(module);
      }
    }
    console.log('module: ',module);
  }

  for (var i=0,module; module = args[i]; i++) {
    
    if (module in PRISON.modules) {
      var dependencies = PRISON.modules[module];
      if (dependencies.length == 0) {
        check_loaded(module);
      }
      else {
        for (var j, dependency; dependency = dependencies[j]; j++) {
          check_loaded(dependency);
        }
        check_loaded(module);
      }
    }
    else {
      check_loaded(module);
    }
  }
};

PRISON.style = function() {
  /* http://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function */
  var args = Array.prototype.slice.call(arguments, 0);
  var loaded = [];

  /* check function prohibits multiple loading of modules */
  function check_loaded(style) {
    if (loaded.indexOf(style) == -1) {
      loaded.push(style);
      PRISON._loadStyle(style);
    }
  }

  for(var i=0,style; style=args[i]; i++) {
    check_loaded(style);
  }
};


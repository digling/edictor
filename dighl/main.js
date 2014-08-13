function loadModule(module)
{
  var script = document.createElement('script');
  script.src = module;
  script.async = false;
  script.type="text/javascript";
  document.head.appendChild(script)
}

function loadStyle(style)
{
  var script = document.createElement('link');
  script.rel = 'stylesheet';
  script.async = false;
  script.href = style;
  script.type="text/css";
  document.head.appendChild(script)
}


loadModule('dighl/setup.js');

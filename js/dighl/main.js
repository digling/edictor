function loadModule(module)
{
  var script = document.createElement('script');
  script.src = module;
  script.async = false;
  script.type="text/javascript";
  document.head.appendChild(script)
}


loadModule('dighl/setup.js');

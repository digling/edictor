var requirements = [
  "js/vendor/jquery-1.10.2.js",
  "js/vendor/jquery-ui.js",
  "js/vendor/FileSaver.js",
  "js/vendor/undomanager.js",
  "js/dighl/sampa.js",
  "js/dighl/highlight.js",
  "js/dighl/pinyin.js",
  "js/tsv/wordlist.js", 
  "js/tsv/starter.js",
  "js/vendor/bootstrap.min.js",
  "js/vendor/bootstrap-select.js",
  ];

for(var i=0,req;req=requirements[i];i++)
{
  loadModule(req);
}


var styles = [
  "css/bootstrap.css",
  "css/bootstrap-theme.css",
  "css/bootstrap-select.css",
  //"css/jquery-ui-1.10.4.custom.css",
  "css/jquery-ui.css",
  "css/wordlist.css",
  "css/jquery-ui.theme.css",
  "css/bs-excerpt.css"
];

for(var i=0,st;st=styles[i];i++)
{
  loadStyle(st);
}

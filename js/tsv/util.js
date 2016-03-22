/* Utility functions
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2016-03-20 10:44
 * modified : 2016-03-20 10:44
 *
 */


var UTIL = {};
UTIL.show_help = function(topic, table, container) {
  container = (typeof container == "undefined") ? topic : container;
  table = (typeof table == 'undefined') ? topic+'_table' : table;
  console.log(topic, container, table);
  
  $.ajax({
    async: true,
    type: "GET",
    url: "help/"+topic+'.html',
    dataType: "text",
    success: function(data) {
      var mid = document.getElementById(table);
      var hid = document.getElementById(topic+'_help');
      var eid = document.getElementById(container);
      hid.innerHTML = data;
      hid.style.width = eid.offsetWidth-50; //(mid.offsetWidth > 500) ? mid.offsetWidth : "0%";
      hid.style.display = '';
      mid.style.display = 'none';
      hid.style.minWidth = '70%';
    }
  });
}

UTIL.randint = function (min, max) {
  return Math.random() * (max - min) + min;
};

UTIL.resizeframe = function (iframe) {
  iframe.height = (10 + iframe.contentWindow.document.body.scrollHeight) + 'px';
  iframe.width =  (iframe.contentWindow.document.body.scrollWidth) + 'px';
}

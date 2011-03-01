function hexToR(h) { return parseInt(h.substring(1,3),16); }
function hexToG(h) { return parseInt(h.substring(3,5),16); }
function hexToB(h) { return parseInt(h.substring(5,7),16); }  
 
function toChanHex(c) {
  c = Math.round(c).toString(16);
  while(c.length < 2) { c = '0' + c; }
  return c; 
}
 
function avgCol(x, y, z, w) {
  var r = (hexToR(x) + hexToR(y) + hexToR(z) + hexToR(w)) / 4;
  var g = (hexToG(x) + hexToG(y) + hexToG(z) + hexToG(w)) / 4;
  var b = (hexToB(x) + hexToB(y) + hexToB(z) + hexToB(w)) / 4;
  return '#' + toChanHex(r) + toChanHex(g) + toChanHex(b);
}
 
var img = new Image();
img.onload = function(){
  var x, y;
  var size = 512,
      p = 14,
      duration = 300,
      minDiam = 4;
  
  var dim  = size / minDiam;
  
  var context = document.getElementById('demoCanvas').getContext('2d');
  context.drawImage(img, 0, 0, dim, dim);
  data = context.getImageData(0, 0, dim, dim).data;
  console.log(data.length);
  
  // Vis
  var colors = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"];
  var colorHash = {};
 
  var depth = Math.round(Math.log(dim) / Math.log(2));
  var t = 0;
  for (y = 0; y < dim; y++) {
    for (x = 0; x < dim; x++) {
      var col = "#" + toChanHex(data[t]) + toChanHex(data[t+1]) + toChanHex(data[t+2]);
      colorHash['c_' + [x,y,depth].join('_')] = col;
      //colors[Math.floor(Math.random() * colors.length)];
      t += 4;
    }
  }
  do {
    dim = dim / 2;
    depth = depth - 1;
    for (y = 0; y < dim; y++) {
      for (x = 0; x < dim; x++) {
        colorHash['c_' + [x,y,depth].join('_')] = avgCol(
            colorHash['c_' + [2*x  ,2*y  ,depth+1].join('_')],
            colorHash['c_' + [2*x+1,2*y  ,depth+1].join('_')],
            colorHash['c_' + [2*x  ,2*y+1,depth+1].join('_')],
            colorHash['c_' + [2*x+1,2*y+1,depth+1].join('_')]
          );
        //colorHash['c_' + [x,y,depth].join('_')] = colors[Math.floor(Math.random() * colors.length)];
      }
    }
  } while(dim > 1)
 
  var vis = d3.select("div#fig")
    .append("svg:svg")
      .attr("width", size + p * 2)
      .attr("height", size + p * 2)
    .append("svg:g")
      .attr("transform", "translate(" + p + "," + p + ")");
 
  window.split = function(x, y, d) {
    var params = [x,y,d];
    var cls = 'c_'+params.join('_');
    d3.select('circle.' + cls).remove();
 
    addCircle(2*x,   2*y,   d+1);
    addCircle(2*x+1, 2*y,   d+1);
    addCircle(2*x,   2*y+1, d+1);
    addCircle(2*x+1, 2*y+1, d+1);
  };
 
  function addCircle(x, y, d) {
    var params = [x,y,d];
 
    var unit = size / Math.pow(2,d);
    var half = unit / 2;
    var cls = 'c_'+params.join('_');
 
    var c = vis.append('svg:circle').attr('class', cls);
 
    if (d > 0) {
      var xOld = Math.floor(x / 2);
      var yOld = Math.floor(y / 2);
      var dOld = d - 1;
      var unitOld = size / Math.pow(2,dOld);
      var halfOld = unitOld / 2;
      var clsOld = 'c_'+[xOld,yOld,dOld].join('_');
 
      c = c.attr('cx', unitOld * xOld + halfOld)
           .attr('cy', unitOld * yOld + halfOld)
           .attr('r', halfOld)
           .attr('fill', colorHash[clsOld])
           .attr('opacity', 0.5)
           .transition()
           .duration(duration);
    } // if
 
    c.attr('cx', unit * x + half)
     .attr('cy', unit * y + half)
     .attr('r', half)
     .attr('fill', colorHash[cls])
     .attr('opacity', 1);
 
    if (unit > minDiam) {
      c.attr('data-params', params.join(','));
    }
  }
  
  addCircle(0, 0, 0);
};

img.src = 'img/koala.jpg';
export function getViewerHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Drawpad — live view</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #ffffff; overflow: hidden; }
  canvas { display: block; width: 100vw; height: 100vh; touch-action: none; }
  #status {
    position: fixed; top: 8px; left: 8px; font: 12px -apple-system, sans-serif;
    color: #999; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px;
  }
</style>
</head>
<body>
<div id="status">connecting…</div>
<canvas id="canvas"></canvas>
<script>
(function () {
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var status = document.getElementById('status');
  var strokes = {};

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }
  window.addEventListener('resize', resize);
  resize();

  function drawStroke(points, color, strokeWidth) {
    if (points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 1) {
      ctx.lineTo(points[0].x, points[0].y);
    } else {
      for (var i = 1; i < points.length - 1; i++) {
        var mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
        ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
      }
      var last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.keys(strokes).forEach(function (id) {
      var s = strokes[id];
      drawStroke(s.points, s.color, s.strokeWidth);
    });
  }

  function connect() {
    var ws = new WebSocket('ws://' + location.host + '/' + location.search);

    ws.onopen = function () {
      status.textContent = 'live';
    };
    ws.onclose = function () {
      status.textContent = 'disconnected — retrying…';
      setTimeout(connect, 1500);
    };
    ws.onerror = function () {
      ws.close();
    };
    ws.onmessage = function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      if (msg.type === 'strokeStart') {
        strokes[msg.id] = { color: msg.color, strokeWidth: msg.strokeWidth, points: [msg.point] };
      } else if (msg.type === 'strokePoint') {
        var s = strokes[msg.id];
        if (s) s.points.push(msg.point);
      } else if (msg.type === 'strokeEnd') {
        // stroke stays on screen; nothing to do
      } else if (msg.type === 'clear') {
        strokes = {};
      }
      redraw();
    };
  }
  connect();
})();
</script>
</body>
</html>`;
}

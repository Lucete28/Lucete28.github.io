// pdf 띄우기
var pdfDoc = null;
var pageNum = 1;
var pageRendering = false;
var pageNumPending = null;
var canvas = document.getElementById('pdfCanvas');
var ctx = canvas.getContext('2d');

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({ scale: 1 });
    var scale = canvas.clientHeight / viewport.height;
    var scaledViewport = page.getViewport({ scale: scale });
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    var renderContext = {
      canvasContext: ctx,
      viewport: scaledViewport
    };
    var renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  document.getElementById('pageNum').textContent = num;
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

document.getElementById('prevPage').addEventListener('click', function() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
});

document.getElementById('fileInput').addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (file) {
    var fileReader = new FileReader();
    fileReader.onload = function() {
      var arrayBuffer = fileReader.result;
      pdfjsLib.getDocument(arrayBuffer).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('pageCount').textContent = pdfDoc.numPages;
        pageNum = 1;
        queueRenderPage(pageNum);
      });
    };
    fileReader.readAsArrayBuffer(file);
  }
});

// 유튜브 재생
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;

function loadVideo() {
  var videoId = document.getElementById("videoId").value;
  
  if (player) {
    player.loadVideoById(videoId);
  } else {
    player = new YT.Player('player', {
      height: '360',
      width: '640',
      videoId: videoId,
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  }
}

function onYouTubeIframeAPIReady() {
  // API 초기화
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    done = true;
  }
}

function stopVideo() {
  player.stopVideo();
}

function restartVideo() {
  player.seekTo(0);
  player.playVideo();
}

function updateCurrentTime() {
  var currentTimeElement = document.getElementById("currentTime");
  var currentTime = player.getCurrentTime().toFixed(2);
  currentTimeElement.textContent = currentTime;
}

setInterval(updateCurrentTime, 500);
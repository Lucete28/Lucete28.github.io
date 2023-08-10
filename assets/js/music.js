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
  var videoId = extractVideoId(document.getElementById("videoId").value); // 동영상 아이디 추출

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

function extractVideoId(url) {
  const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/);
  return videoIdMatch ? videoIdMatch[1] : null;
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
  var currentTime = player.getCurrentTime().toFixed(0);
  currentTimeElement.textContent = currentTime;
}

setInterval(updateCurrentTime, 500);


var times = [null, null, null];
var backTimes = [null, null, null];
var timeThreshold = 1.0;

function toggleTime(index, direction) {
  var inputTime = parseFloat(document.getElementById("time" + index + (direction === 'back' ? 'Back' : '')).value);
  var timeArray = direction === 'back' ? backTimes : times;
  
  if (!isNaN(inputTime)) {
    if (timeArray[index - 1] === inputTime) {
      timeArray[index - 1] = null;
    } else {
      timeArray[index - 1] = inputTime;
    }
    updateButtonState(index, direction);
  }
}

function updateButtonState(index, direction) {
  var button = document.querySelector("#time" + index + (direction === 'back' ? 'Back' : '') + "+button");
  var timeArray = direction === 'back' ? backTimes : times;
  
  if (timeArray[index - 1] !== null) {
    button.textContent = "취소";
  } else {
    button.textContent = "설정";
  }
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    var currentTime = player.getCurrentTime();
    
    for (var i = 0; i < times.length; i++) {
      var forwardTime = times[i];
      var backwardTime = backTimes[i];
      
      if (forwardTime !== null && Math.abs(currentTime - forwardTime) <= timeThreshold) {
        if (pageNum < pdfDoc.numPages) {
          pageNum++;
          queueRenderPage(pageNum);
          // times[i] = null;
          updateButtonState(i + 1);
        }
      }
      
      if (backwardTime !== null && Math.abs(currentTime - backwardTime) <= timeThreshold) {
        if (pageNum > 1) {
          pageNum--;
          queueRenderPage(pageNum);
          // backTimes[i] = null;
          updateButtonState(i + 1, 'back');
        }
      }
    }
  }
}

// 매초마다 호출되는 함수
function checkPlayerState() {
  var playerState = player.getPlayerState();
  if (playerState == YT.PlayerState.PLAYING) {
    var currentTime = player.getCurrentTime();
    onPlayerStateChange({ data: YT.PlayerState.PLAYING }); // onPlayerStateChange 함수 호출
  }
}

// 1초마다 checkPlayerState 함수 호출
setInterval(checkPlayerState, 1000); // 1000 밀리초(1초) 간격으로 호출

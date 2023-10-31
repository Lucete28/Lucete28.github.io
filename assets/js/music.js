let selectedFile = null;

fileInput//setting var
  let music_setting = {
    setting_CUS_NO : null,
    setting_NAME : null,
    setting_URL : null,
    setting_FILE : null, //이거 해야해
    setting_TIME : null,
  }
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
    selectedFile = file
    selectedFileName = file.name; // 파일 이름 업데이트
    music_setting.setting_NAME = selectedFileName
    
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
    fileReader.readAsArrayBuffer(selectedFile);
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
  music_setting.setting_URL = videoId
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
var timeThreshold = 0.3;

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
  music_setting.setting_TIME = times + backTimes
  console.log(music_setting.setting_TIME)
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


// dataload
const queryParams = new URLSearchParams(window.location.search);
const CUS_NO = queryParams.get("CUS_NO");
const userID = queryParams.get("userID");
const welcomeMessageSpan = document.getElementById("welcomeMessage");
const musicList = document.getElementById("musicList");

async function fetchData() {
  try {
    const response = await fetch(`http://localhost:8000/music/${CUS_NO}`, {
  headers: {
    'accept': 'application/json'
  }
});
    music_setting.setting_CUS_NO = CUS_NO
    const musicData = await response.json();
    displayMusicData(musicData);
  } catch (error) {
    console.error("데이터를 가져오는 중 오류 발생:", error);
  }
}

function displayMusicData(musicData) {
  console.log(musicData)
  welcomeMessageSpan.textContent = `${userID}님`;
  musicList.innerHTML = "";

  if (musicData.length === 0) {
    const noDataItem = document.createElement("li");
    noDataItem.textContent = "데이터가 없습니다.";
    musicList.appendChild(noDataItem);
  } else {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>File Name</th>
          <th>Time</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    musicData.forEach(music => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${music.NO}</td>
        <td><a href="music_play.html?NO=${music.NO}&FILE_NAME=${encodeURIComponent(music.FILE_NAME)}&TIME=${music.TIME}&URL=${music.URL}" target="_blank">${music.FILE_NAME}</a></td>
        <td>${music.TIME}</td>
        <td>${music.URL}</td>
      `;
      tbody.appendChild(row);
      
    });

    musicList.appendChild(table);
  }
}



fetchData();


function save_setting() {
  const cusNo = parseInt(music_setting.setting_CUS_NO);
  const settings = {
    CUS_NO: cusNo,
    FILE_NAME: music_setting.setting_NAME,// 파일 이름 설정
    URL: music_setting.setting_URL, 
    TIME: music_setting.setting_TIME
  };
  console.log("Settings:", settings)
  fetch(`http://localhost:8000/set_music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.message); // 서버에서 보내준 응답 메시지 처리
  })
  .catch(error => {
    console.error('설정 저장 중 에러:', error);
  });
// -----------------------------------------------------------------------------------------------
  // 파일 업로드
  if (selectedFile) {
    var formData = new FormData();
    formData.append('pdfFile', selectedFile);
  
    fetch('http://localhost:8000/upload', {  // 서버 URL로 수정
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`파일 업로드 실패: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('파일 업로드 완료:', data);
    })
    .catch(error => {
      console.error('파일 업로드 에러:', error);
    });
  }
  
}
// ArrayBuffer를 Blob으로 변환하는 함수
// function save_setting() {
//   let formData = new FormData();
//   formData.append('CUS_NO', music_setting.setting_CUS_NO);
//   formData.append('NAME', music_setting.setting_NAME);
//   formData.append('URL', music_setting.setting_URL);
//   formData.append('TIME', JSON.stringify([...times, ...backTimes])); // Assuming times and backTimes are arrays
//   formData.append('FILE', new Blob([music_setting.setting_FILE], { type: 'application/pdf' })); // Append Blob directly

//   fetch(`http://localhost:8000/set_music`, {
//     method: 'POST',
//     body: formData
//   })
//   .then(response => response.json())
//   .then(data => {
//     console.log(data.message); // 서버에서 보내준 응답 메시지 처리
//   })
//   .catch(error => {
//     console.error('설정 저장 중 에러:', error);
//   });
// }

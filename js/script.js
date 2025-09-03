const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const tracksContainer = document.getElementById("tracks");

let audioElements = [];
let canvases = [];
let binsData = [];
let animationFrame;

fileInput.addEventListener("change", async (e) => {
  for (const file of e.target.files) {
    await addTrack(file);
  }
  // update status
  fileStatus.textContent = `${tracksContainer.children.length} track(s) loaded`;
  fileInput.value = ""; // allow re-upload
});

async function addTrack(file) {
  const trackDiv = document.createElement("div");
  trackDiv.className = "track";

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.className = "volume-visual";
  trackDiv.appendChild(canvas);

  // Controls container
  const controlsDiv = document.createElement("div");

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.01;
  slider.value = 1;
  slider.className = "volume-slider";
  controlsDiv.className = "controls";

  //   const label = document.createElement("label");
  //   label.className = "volume-label";
  //   label.textContent = "🔊";
  // Replace label creation with an editable input
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = file.name;
  nameInput.className = "form-control form-control-sm me-2";
  nameInput.style.width = "200px"; // optional width
  controlsDiv.appendChild(nameInput, slider); // insert before volume slider

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-sm btn-danger remove-btn";
  removeBtn.textContent = "Remove";

  //   controlsDiv.appendChild(label);
  controlsDiv.appendChild(slider);
  controlsDiv.appendChild(removeBtn);
  trackDiv.appendChild(controlsDiv);

  tracksContainer.appendChild(trackDiv);

  // Audio element
  const audio = new Audio(URL.createObjectURL(file));
  audio.preload = "auto";
  audio.volume = slider.value;
  audioElements.push(audio);
  canvases.push(canvas);

  slider.addEventListener("input", () => {
    audio.volume = slider.value;
  });

  // Preprocess audio for visualization
  const bins = await processAudio(file, canvas, audio);
  binsData.push({ bins, duration: audio.duration || 0 });

  // Remove track
  removeBtn.addEventListener("click", () => {
    const idx = audioElements.indexOf(audio);
    if (idx !== -1) {
      audio.pause();
      audioElements.splice(idx, 1);
      canvases.splice(idx, 1);
      binsData.splice(idx, 1);
    }
    trackDiv.remove();
    fileStatus.textContent = `${tracksContainer.children.length} track(s) loaded`;
  });

  // Seek on canvas click
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekRatio = clickX / rect.width; // use CSS width

    audioElements.forEach((a) => {
      if (!isNaN(a.duration)) {
        a.currentTime = seekRatio * a.duration;
      }
    });
  });
}

async function processAudio(file, canvas, audio) {
  const audioCtx = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const samplesPerBin = Math.floor(audioBuffer.sampleRate * 0.1); // 100ms
  const channelData = audioBuffer.getChannelData(0);
  const bins = [];

  for (let i = 0; i < channelData.length; i += samplesPerBin) {
    let sum = 0;
    for (let j = 0; j < samplesPerBin && i + j < channelData.length; j++) {
      sum += channelData[i + j] ** 2;
    }
    bins.push(Math.sqrt(sum / samplesPerBin));
  }

  drawBins(canvas, bins, 0);
  return bins;
}

function drawBins(canvas, bins, progressRatio = 0) {
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...bins);
  const barWidth = canvas.width / bins.length;

  // RMS bars
  bins.forEach((val, idx) => {
    const barHeight = (val / max) * canvas.height;
    ctx.fillStyle = "#0d6efd";
    ctx.fillRect(
      idx * barWidth,
      canvas.height - barHeight,
      barWidth,
      barHeight
    );
  });

  // Played portion overlay
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, progressRatio * canvas.width, canvas.height);

  // Playhead
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.moveTo(progressRatio * canvas.width, 0);
  ctx.lineTo(progressRatio * canvas.width, canvas.height);
  ctx.stroke();
}

function drawPlayheads() {
  canvases.forEach((canvas, idx) => {
    const { bins, duration } = binsData[idx];
    const audio = audioElements[idx];
    let ratio = 0;
    if (!isNaN(audio.duration) && audio.currentTime <= duration) {
      ratio = audio.currentTime / duration;
    }
    drawBins(canvas, bins, ratio);
  });
  animationFrame = requestAnimationFrame(drawPlayheads);
}

playBtn.addEventListener("click", () => {
  audioElements.forEach((a) => a.play());
  if (!animationFrame) drawPlayheads();
});

pauseBtn.addEventListener("click", () => {
  audioElements.forEach((a) => a.pause());
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
});

const darkModeBtn = document.getElementById("darkModeBtn");
darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

let tracks = [];

function addTrack(event) {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);

  // Create elements
  const container = document.createElement("div");
  container.className = "track";

  const label = document.createElement("label");
  label.textContent = file.name + ": ";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.01;
  slider.value = 1;

  const audio = document.createElement("audio");
  audio.src = url;
  audio.controls = true;

  // Hook up volume
  slider.oninput = () => (audio.volume = slider.value);

  // Append
  container.appendChild(label);
  container.appendChild(slider);
  container.appendChild(audio);
  document.getElementById("tracks").appendChild(container);

  tracks.push(audio);

  // Reset input so user can upload the same file again if needed
  event.target.value = "";
}

function playAll() {
  tracks.forEach((track) => {
    track.currentTime = 0; // restart
    track.play();
  });
}

function pauseAll() {
  tracks.forEach((track) => track.pause());
}

function stopAll() {
  tracks.forEach((track) => {
    track.pause();
    track.currentTime = 0;
  });
}

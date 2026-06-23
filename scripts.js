const players = [...document.querySelectorAll("[data-player]")];

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

const pauseOtherPlayers = (activeAudio) => {
  players.forEach((player) => {
    const audio = player.querySelector("audio");
    if (audio !== activeAudio && !audio.paused) audio.pause();
  });
};

players.forEach((player, playerIndex) => {
  const audio = player.querySelector("audio");
  const playButton = player.querySelector("[data-play]");
  const seek = player.querySelector("[data-seek]");
  const current = player.querySelector("[data-current]");
  const duration = player.querySelector("[data-duration]");
  const waveform = player.querySelector("[data-waveform]");
  const barPattern = playerIndex === 0
    ? [28, 54, 72, 43, 84, 62, 37, 68, 91, 56, 76, 44, 88, 64, 39, 58, 82, 48, 70, 34, 61, 86, 52, 73, 41, 66, 93, 57, 78, 46, 69, 36]
    : [46, 70, 38, 82, 57, 92, 64, 43, 76, 53, 86, 61, 35, 68, 95, 49, 72, 40, 80, 59, 90, 45, 66, 83, 51, 74, 37, 88, 62, 42, 77, 55];

  barPattern.forEach((height) => {
    const bar = document.createElement("span");
    bar.style.setProperty("--bar-height", `${height}%`);
    waveform.append(bar);
  });

  const setPlayingState = (isPlaying) => {
    player.classList.toggle("is-playing", isPlaying);
    playButton.setAttribute(
      "aria-label",
      `${isPlaying ? "Pause" : "Play"} ${player.querySelector("h3").textContent}`
    );
  };

  playButton.addEventListener("click", () => {
    if (audio.paused) {
      pauseOtherPlayers(audio);
      audio.play().catch(() => setPlayingState(false));
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => setPlayingState(false));
  audio.addEventListener("ended", () => {
    seek.value = 0;
    current.textContent = "0:00";
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    seek.value = Math.round((audio.currentTime / audio.duration) * 1000);
    current.textContent = formatTime(audio.currentTime);
    seek.style.setProperty("--progress", `${(audio.currentTime / audio.duration) * 100}%`);
  });

  seek.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(seek.value) / 1000) * audio.duration;
  });
});

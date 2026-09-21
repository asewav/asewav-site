document.documentElement.classList.add("js");

const navToggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector("#site-navigation");
if (navToggle && navigation) {
  const setMenu = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    navigation.classList.toggle("is-open", open);
  };
  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      navToggle.focus();
    }
  });
  const desktop = matchMedia("(min-width: 641px)");
  desktop.addEventListener("change", () => setMenu(false));
  for (const link of navigation.querySelectorAll("a")) {
    if (link.pathname !== "/" && link.pathname === location.pathname) link.setAttribute("aria-current", "page");
  }
}

const players = [...document.querySelectorAll("[data-player]")];
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
};
players.forEach((player) => {
  const audio = player.querySelector("audio");
  const playButton = player.querySelector("[data-play]");
  const seek = player.querySelector("[data-seek]");
  const current = player.querySelector("[data-current]");
  const duration = player.querySelector("[data-duration]");
  const title = player.querySelector("h3").textContent;
  const message = document.createElement("p");
  message.className = "audio-error";
  message.setAttribute("role", "status");
  message.hidden = true;
  player.querySelector(".track-main").append(message);
  const setPlaying = () => {
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle("is-playing", playing);
    playButton.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${title}`);
    playButton.title = `${playing ? "Pause" : "Play"} ${title}`;
  };
  const updateTime = () => {
    const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
    seek.value = Math.round(progress * 1000);
    seek.style.setProperty("--progress", `${progress * 100}%`);
    seek.setAttribute("aria-valuetext", `${formatTime(audio.currentTime)} of ${formatTime(audio.duration)}`);
    current.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) duration.textContent = formatTime(audio.duration);
  };
  const showError = () => {
    message.textContent = "This sample couldn't load. Please try again.";
    message.hidden = false;
    setPlaying();
  };
  playButton.addEventListener("click", async () => {
    if (!audio.paused) return audio.pause();
    players.forEach((other) => { if (other !== player) other.querySelector("audio").pause(); });
    message.hidden = true;
    if (audio.ended) audio.currentTime = 0;
    if (audio.error) audio.load();
    try { await audio.play(); } catch { showError(); }
  });
  audio.addEventListener("loadedmetadata", updateTime);
  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("play", setPlaying);
  audio.addEventListener("pause", setPlaying);
  audio.addEventListener("ended", () => { setPlaying(); audio.currentTime = 0; updateTime(); });
  audio.addEventListener("error", showError);
  seek.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Number(seek.value) / 1000 * audio.duration;
    updateTime();
  });
  setPlaying();
  updateTime();
});

const previews = [...document.querySelectorAll("[data-preview]")];
if (previews.length && typeof HTMLDialogElement !== "undefined") {
  const dialog = document.createElement("dialog");
  dialog.className = "image-dialog";
  dialog.setAttribute("aria-labelledby", "preview-title");
  const header = document.createElement("div");
  header.className = "dialog-header";
  const caption = document.createElement("span");
  caption.id = "preview-title";
  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Close preview");
  close.title = "Close preview";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "icon");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "/assets/icons.svg#x");
  icon.append(use);
  close.append(icon);
  const image = document.createElement("img");
  header.append(caption, close);
  dialog.append(header, image);
  document.body.append(dialog);
  let scrollOverflow = "";
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { document.body.style.overflow = scrollOverflow; });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  previews.forEach((link) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    caption.textContent = (link.querySelector(".product-page") || link.querySelector("img")).alt;
    image.alt = caption.textContent;
    image.src = link.href;
    scrollOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
  }));
}

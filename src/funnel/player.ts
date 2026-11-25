/* TAM branded video player, shared by every funnel page (sales page, Growth Accelerator,
   thank-you). Vanilla TS, no library. Styles live in public/static/css/styles.css (.bfp*)
   and use the page's own tokens (--coral, --night, --on-dark, --font-ui, --r-btn).

   Rules this file keeps:
   - VSL pattern: the video autoplays MUTED (muted + playsinline) behind a big "Click to watch with
     sound" overlay. A click unmutes and restarts from 0:00. If the browser blocks autoplay, or the
     visitor prefers reduced motion, nothing autoplays: the poster and play button show and the first
     click plays WITH sound.
   - Sticky mini player: when the main player scrolls out of view while the video is playing, the
     SAME element is docked into a floating mini player (position: fixed, CSS only). It is never
     moved in the DOM, so playback never restarts or pauses. The .vsl slot stays as a same-size
     placeholder, so nothing shifts. Close pauses and hides the mini until the visitor scrolls back.
   - Captions are burned into the video files, so the caption <track> is kept for assistive
     tech but forced off. There is no CC button, so captions never show twice.
   - The player is never hidden because of a playback problem. A problem shows an error
     panel with "Try again". The only way the slot disappears is when the file is confirmed
     missing from the bucket (see onMissing).
   - Audio-less devices: if sound playback is stuck (the clock does not move although the
     video is ready), it falls back to muted playback and says so. */

type PlayerState = "idle" | "playing" | "paused" | "ended" | "error";

export type PlayerOptions = {
  /** The file was confirmed missing (not a playback error): hide the whole slot. */
  onMissing: () => void;
  /** Resolves "no" only when the bucket says the file is not there. */
  probe: (src: string) => Promise<"yes" | "no" | "unknown">;
};

/* Lucide glyphs (lucide-react is already a dependency of this project); one icon family. */
const ICONS: Record<string, string> = {
  play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
  pause:
    '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
  volume:
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  muted:
    '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
  enter:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  exit: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
  replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  spinner: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  expand: '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

function icon(name: keyof typeof ICONS, cls = ""): string {
  return `<svg class="bfp__ic ${name === "play" || name === "pause" ? "bfp__ic--solid " : ""}${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

const pad = (n: number) => String(n).padStart(2, "0");
function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
function fmtLength(d: number): string {
  if (!Number.isFinite(d) || d <= 0) return "";
  if (d >= 90) return `${Math.round(d / 60)} min`;
  if (d >= 60) return "1 min";
  return `${Math.round(d)} sec`;
}

const SEEK_STEP = 5;
const HIDE_AFTER_MS = 1500;
const MINI_HIDE_AFTER_MS = 3200; // the mini player keeps its buttons a little longer
const SPEEDS = [1, 1.25, 1.5];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  html = "",
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}

export function mountPlayer(
  slot: HTMLElement,
  source: HTMLVideoElement,
  opts: PlayerOptions,
): void {
  const src = source.getAttribute("src") ?? "";
  const title = source.getAttribute("aria-label") ?? "Video";

  /* ---------- The <video> (no native controls) ---------- */
  const video = source;
  video.removeAttribute("controls");
  video.removeAttribute("aria-label");
  video.removeAttribute("width");
  video.removeAttribute("height");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wantsAutoplay = !reduceMotion;
  // Reduced motion: nothing may start by itself (the markup carries autoplay for everyone else).
  if (!wantsAutoplay) video.removeAttribute("autoplay");
  video.setAttribute("preload", wantsAutoplay ? "auto" : "metadata");
  video.setAttribute("disablepictureinpicture", "");
  video.setAttribute("controlslist", "nodownload noplaybackrate nofullscreen");
  video.classList.add("bfp__video");
  video.playsInline = true;
  video.controls = false;

  // Burned-in captions: keep the track for assistive tech, never turn it on.
  const track = video.querySelector("track");
  track?.removeAttribute("default");
  const silenceTracks = () => {
    for (let i = 0; i < video.textTracks.length; i++) {
      const t = video.textTracks[i];
      if (t && t.mode !== "disabled") t.mode = "disabled";
    }
  };
  video.textTracks.addEventListener?.("addtrack", silenceTracks);
  silenceTracks();

  /* ---------- Markup ---------- */
  const root = el("div", "bfp");
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", `Video player: ${title}`);
  root.tabIndex = -1;
  root.dataset["state"] = "idle";
  root.dataset["controls"] = "show";

  const surface = el("div", "bfp__surface");
  const scrim = el("div", "bfp__scrim");
  const big = el("button", "bfp__big");
  big.type = "button";
  big.innerHTML = `<span class="bfp__playbtn">${icon("play", "bfp__ic--big")}</span><span class="bfp__label" data-label>Watch the video</span>`;
  surface.append(scrim, big);

  // "Click to watch with sound": covers the whole picture while the video plays muted on its own.
  const sound = el("button", "bfp__sound");
  sound.type = "button";
  sound.setAttribute("aria-label", `${title}. Click to watch with sound`);
  sound.innerHTML = `<span class="bfp__soundcard"><span class="bfp__soundtile">${icon("muted", "bfp__ic--snd")}</span><span class="bfp__soundtxt">Click to watch with sound</span></span><span class="bfp__mprog" aria-hidden="true"><span data-mprog></span></span>`;

  // Controls of the floating mini player (only shown while docked).
  const mini = el("div", "bfp__mini");
  mini.innerHTML = `
    <div class="bfp__mtop">
      <button type="button" class="bfp__mbtn" data-mini="expand" aria-label="Back to the full video">${icon("expand")}</button>
      <button type="button" class="bfp__mbtn" data-mini="close" aria-label="Close the mini player">${icon("close")}</button>
    </div>
    <div class="bfp__mbot">
      <button type="button" class="bfp__mbtn" data-mini="play" aria-label="Pause">${icon("pause", "bfp__ic--solid")}</button>
      <button type="button" class="bfp__msnd" data-mini="sound" aria-label="Turn the sound on">${icon("muted")}<span class="bfp__msndtxt">Tap for sound</span></button>
    </div>
    <div class="bfp__mline" aria-hidden="true"><span data-mfill></span></div>`;

  const spinner = el("div", "bfp__spinner", icon("spinner", "bfp__spin"));
  spinner.setAttribute("aria-hidden", "true");

  const note = el("p", "bfp__note");
  note.setAttribute("role", "status");

  const errorBox = el("div", "bfp__error");
  errorBox.setAttribute("role", "alert");
  errorBox.innerHTML = `<p class="bfp__errtxt" data-errtxt></p><button type="button" class="bfp__retry" data-retry>Try again</button>`;

  const bar = el("div", "bfp__bar");
  bar.innerHTML = `
    <button type="button" class="bfp__btn" data-act="play" aria-label="Play">${icon("play")}</button>
    <span class="bfp__time" data-time><span data-cur>0:00</span><span class="bfp__sep"> / </span><span data-dur>0:00</span></span>
    <div class="bfp__seek" data-seek role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00">
      <div class="bfp__track"><div class="bfp__buf" data-buf></div><div class="bfp__fill" data-fill></div><div class="bfp__thumb" data-thumb></div></div>
      <div class="bfp__tip" data-tip aria-hidden="true">0:00</div>
    </div>
    <div class="bfp__vol">
      <button type="button" class="bfp__btn" data-act="mute" aria-label="Mute">${icon("volume")}</button>
      <input class="bfp__range" data-vol type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
    </div>
    <button type="button" class="bfp__btn bfp__btn--speed" data-act="speed" aria-label="Playback speed 1x. Change speed">1x</button>
    <button type="button" class="bfp__btn" data-act="fs" aria-label="Full screen">${icon("enter")}</button>`;

  root.append(video, surface, sound, spinner, note, errorBox, bar, mini);
  slot.replaceChildren(root);

  const q = <T extends HTMLElement>(sel: string) => root.querySelector(sel) as T;
  const playBtn = q<HTMLButtonElement>('[data-act="play"]');
  const muteBtn = q<HTMLButtonElement>('[data-act="mute"]');
  const speedBtn = q<HTMLButtonElement>('[data-act="speed"]');
  const fsBtn = q<HTMLButtonElement>('[data-act="fs"]');
  const seek = q<HTMLElement>("[data-seek]");
  const fill = q<HTMLElement>("[data-fill]");
  const buf = q<HTMLElement>("[data-buf]");
  const thumb = q<HTMLElement>("[data-thumb]");
  const tip = q<HTMLElement>("[data-tip]");
  const curEl = q<HTMLElement>("[data-cur]");
  const durEl = q<HTMLElement>("[data-dur]");
  const vol = q<HTMLInputElement>("[data-vol]");
  const labelEl = q<HTMLElement>("[data-label]");
  const errTxt = q<HTMLElement>("[data-errtxt]");
  const retryBtn = q<HTMLButtonElement>("[data-retry]");
  const mprog = q<HTMLElement>("[data-mprog]");
  const mfill = q<HTMLElement>("[data-mfill]");
  const miniPlay = q<HTMLButtonElement>('[data-mini="play"]');
  const miniSound = q<HTMLButtonElement>('[data-mini="sound"]');
  const miniExpand = q<HTMLButtonElement>('[data-mini="expand"]');
  const miniClose = q<HTMLButtonElement>('[data-mini="close"]');

  /* ---------- State ---------- */
  let state: PlayerState = "idle";
  let pending = false; // play() asked for, not yet "playing"
  let waiting = false; // mid-playback buffering
  let started = false;
  let scrubbing = false;
  let scrubTime = 0;
  let hideTimer = 0;
  let noteTimer = 0;
  let lastPointer = "mouse";
  let hiddenAtPointerDown = false;
  let hoverBar = false;
  let mutedFallbackUsed = false;
  let stuckTicks = 0;
  let bufferTicks = 0;
  let lastTime = 0;
  let raf = 0;
  let resumeAt = 0;
  let soundGate = false; // playing muted behind the "Click to watch with sound" overlay
  type Dock = "main" | "mini" | "closed";
  let dock: Dock = "main";
  let ratio = 1; // how much of the main slot is on screen
  let fxTimer = 0;

  const setState = (s: PlayerState) => {
    state = s;
    root.dataset["state"] = s;
    const playing = s === "playing";
    playBtn.innerHTML = icon(playing ? "pause" : s === "ended" ? "replay" : "play");
    playBtn.setAttribute("aria-label", playing ? "Pause" : s === "ended" ? "Replay" : "Play");
    miniPlay.innerHTML = icon(playing ? "pause" : s === "ended" ? "replay" : "play");
    miniPlay.setAttribute("aria-label", playing ? "Pause" : s === "ended" ? "Replay" : "Play");
    const bigFace = big.querySelector(".bfp__playbtn");
    if (bigFace) bigFace.innerHTML = icon(s === "ended" ? "replay" : "play", "bfp__ic--big");
    big.setAttribute(
      "aria-label",
      s === "idle"
        ? `${title}. Play with sound`
        : s === "ended"
          ? `${title}. Watch again`
          : `${title}. Resume`,
    );
    labelEl.textContent = s === "idle" ? idleLabel() : s === "ended" ? "Watch again" : "";
    big.dataset["hasLabel"] = labelEl.textContent ? "1" : "0";
    showControls();
  };

  const idleLabel = () => {
    const l = fmtLength(video.duration);
    return l ? `Watch: ${l}` : "Watch the video";
  };

  const paintBusy = () => {
    root.dataset["busy"] =
      (pending || waiting) && state !== "error" && state !== "paused" ? "1" : "0";
  };

  const say = (msg: string, ms = 7000) => {
    note.textContent = msg;
    note.dataset["on"] = "1";
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(() => {
      note.dataset["on"] = "0";
    }, ms);
  };

  /* ---------- Controls visibility ---------- */
  const keyboardInside = () => {
    const a = document.activeElement;
    return !!a && a !== root && root.contains(a) && a.matches(":focus-visible");
  };
  const hideControls = () => {
    if (state !== "playing" || scrubbing || hoverBar || keyboardInside()) return;
    root.dataset["controls"] = "hide";
  };
  function showControls() {
    root.dataset["controls"] = "show";
    window.clearTimeout(hideTimer);
    if (state === "playing")
      hideTimer = window.setTimeout(
        hideControls,
        dock === "main" ? HIDE_AFTER_MS : MINI_HIDE_AFTER_MS,
      );
  }

  /* ---------- Paint ---------- */
  const paintTime = () => {
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    const t = scrubbing ? scrubTime : video.currentTime;
    const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;
    mprog.style.width = `${pct}%`;
    mfill.style.width = `${pct}%`;
    curEl.textContent = fmtTime(t);
    seek.setAttribute("aria-valuenow", String(Math.floor(t)));
    seek.setAttribute("aria-valuetext", `${fmtTime(t)} of ${fmtTime(d)}`);
  };
  const paintBuffered = () => {
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    let end = 0;
    const t = video.currentTime;
    // Read the ranges once: video.buffered returns a fresh snapshot on every access, and a
    // range can change between the length check and start()/end().
    const ranges = video.buffered;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= t + 0.5 && ranges.end(i) >= end) end = ranges.end(i);
    }
    buf.style.width = d > 0 ? `${Math.min(100, (end / d) * 100)}%` : "0%";
  };
  const paintDuration = () => {
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    durEl.textContent = fmtTime(d);
    seek.setAttribute("aria-valuemax", String(Math.floor(d)));
    if (state === "idle") labelEl.textContent = idleLabel();
    paintTime();
  };
  const loop = () => {
    paintTime();
    if (state === "playing") raf = requestAnimationFrame(loop);
  };

  /* ---------- Actions ---------- */
  const fail = (msg: string) => {
    setGate(false);
    setState("error");
    video.pause();
    note.dataset["on"] = "0";
    pending = false;
    waiting = false;
    errTxt.textContent = msg;
    paintBusy();
    cancelAnimationFrame(raf);
  };

  const requestPlay = async () => {
    pending = true;
    paintBusy();
    try {
      await video.play();
    } catch (err) {
      pending = false;
      paintBusy();
      const name = (err as { name?: string } | null)?.name;
      if (name === "NotAllowedError") {
        setState("paused"); // the browser wants another tap; the play button is showing
      } else if (name !== "AbortError") {
        fail("This video could not start. Check your connection and try again.");
      }
    }
  };

  const setGate = (on: boolean) => {
    soundGate = on;
    root.dataset["snd"] = on ? "off" : "on";
  };

  /* The overlay click (or the first tap on a blocked poster): sound on, from 0:00. */
  const startWithSound = () => {
    started = true;
    setGate(false);
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
    if (video.currentTime > 0.05) video.currentTime = 0;
    void requestPlay();
  };

  /* Sound on without a restart (mini player, keyboard, volume): the picture keeps its place. */
  const unmuteInPlace = () => {
    started = true;
    setGate(false);
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
  };

  /* Autoplay, muted. A browser that refuses falls back to the poster with the play button. */
  const autoStart = async () => {
    setGate(true);
    root.dataset["auto"] = "1";
    video.muted = true;
    pending = true;
    paintBusy();
    try {
      await video.play();
    } catch (err) {
      const name = (err as { name?: string } | null)?.name;
      if (name === "AbortError") return; // a reload interrupted it; the next attempt follows
      pending = false;
      setGate(false);
      root.dataset["auto"] = "0";
      video.muted = false;
      paintBusy();
      if (name !== "NotAllowedError")
        fail("This video could not start. Check your connection and try again.");
    }
  };

  const toggle = () => {
    if (state === "error") return;
    if (state === "idle" || state === "ended") startWithSound();
    else if (video.paused) void requestPlay();
    else video.pause();
  };

  const seekBy = (delta: number) => {
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.max(0, Math.min(d || Infinity, video.currentTime + delta));
    paintTime();
    showControls();
  };

  const toggleMute = () => {
    if (soundGate) {
      unmuteInPlace();
      return;
    }
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(video.playbackRate);
    video.playbackRate = SPEEDS[(i + 1) % SPEEDS.length] ?? 1;
  };

  /* Fullscreen: the element API where it exists, the native video player on iPhone. */
  type FsDoc = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => void;
  };
  type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
  type FsVideo = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
    webkitDisplayingFullscreen?: boolean;
  };
  const fsDoc = document as FsDoc;
  let nativeFs = false;
  const inFullscreen = () =>
    fsDoc.fullscreenElement === root || fsDoc.webkitFullscreenElement === root || nativeFs;
  const toggleFullscreen = () => {
    const fv = video as FsVideo;
    if (inFullscreen() && !nativeFs) {
      if (fsDoc.exitFullscreen) void fsDoc.exitFullscreen();
      else fsDoc.webkitExitFullscreen?.();
      return;
    }
    const r = root as FsEl;
    if (r.requestFullscreen) void r.requestFullscreen().catch(() => fv.webkitEnterFullscreen?.());
    else if (r.webkitRequestFullscreen) r.webkitRequestFullscreen();
    else fv.webkitEnterFullscreen?.(); // iPhone Safari
  };
  const paintFullscreen = () => {
    const on = inFullscreen();
    root.dataset["fs"] = on ? "1" : "0";
    fsBtn.innerHTML = icon(on ? "exit" : "enter");
    fsBtn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
  };
  document.addEventListener("fullscreenchange", paintFullscreen);
  document.addEventListener("webkitfullscreenchange", paintFullscreen);
  video.addEventListener("webkitbeginfullscreen", () => {
    nativeFs = true;
    paintFullscreen();
  });
  video.addEventListener("webkitendfullscreen", () => {
    nativeFs = false;
    paintFullscreen();
  });

  /* ---------- Retry and missing-file check ---------- */
  const retry = () => {
    resumeAt = video.currentTime || 0;
    errTxt.textContent = "";
    stuckTicks = 0;
    bufferTicks = 0;
    setState(started ? "paused" : "idle");
    pending = true;
    paintBusy();
    video.src = src;
    video.load();
    video.addEventListener(
      "loadedmetadata",
      () => {
        if (resumeAt > 1 && resumeAt < video.duration - 1) video.currentTime = resumeAt;
        void requestPlay();
      },
      { once: true },
    );
  };

  /* ---------- Video events ---------- */
  video.addEventListener("loadedmetadata", paintDuration);
  video.addEventListener("durationchange", paintDuration);
  video.addEventListener("progress", paintBuffered);
  video.addEventListener("timeupdate", () => {
    paintBuffered();
    if (!raf) paintTime();
  });
  video.addEventListener("play", () => {
    root.dataset["auto"] = "0";
    setState("playing");
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  });
  video.addEventListener("playing", () => {
    pending = false;
    waiting = false;
    paintBusy();
  });
  video.addEventListener("pause", () => {
    if (video.ended) return;
    if (state === "error") return;
    setState("paused");
    pending = false;
    paintBusy();
    paintTime();
  });
  video.addEventListener("ended", () => {
    setGate(false);
    setState("ended");
    pending = false;
    waiting = false;
    paintBusy();
    paintTime();
  });
  video.addEventListener("waiting", () => {
    waiting = true;
    paintBusy();
  });
  for (const ev of ["canplay", "canplaythrough", "seeked"] as const) {
    video.addEventListener(ev, () => {
      if (video.readyState >= 3) {
        waiting = false;
        paintBusy();
      }
    });
  }
  video.addEventListener("volumechange", () => {
    const muted = video.muted || video.volume === 0;
    muteBtn.innerHTML = icon(muted ? "muted" : "volume");
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    vol.value = String(video.muted ? 0 : video.volume);
    vol.style.setProperty("--v", `${Number(vol.value) * 100}%`);
    if (!muted) note.dataset["on"] = "0";
    root.dataset["muted"] = muted ? "1" : "0";
    miniSound.setAttribute("aria-label", muted ? "Turn the sound on" : "Mute");
    miniSound.innerHTML = muted
      ? `${icon("muted")}<span class="bfp__msndtxt">Tap for sound</span>`
      : icon("volume");
    if (!video.muted && soundGate) setGate(false);
  });
  video.addEventListener("ratechange", () => {
    const label = `${video.playbackRate}x`;
    speedBtn.textContent = label;
    speedBtn.setAttribute("aria-label", `Playback speed ${label}. Change speed`);
  });
  video.addEventListener("error", () => {
    cancelAnimationFrame(raf);
    // A missing file is the only reason to take the slot away; anything else gets a retry.
    void opts.probe(src).then((found) => {
      if (found === "no") {
        opts.onMissing();
        return;
      }
      fail("The video stopped loading. Check your connection and try again.");
    });
  });
  video.addEventListener("contextmenu", (e) => e.preventDefault());

  /* ---------- Watchdog: stuck clock and slow buffering ---------- */
  const watch = window.setInterval(() => {
    if (!root.isConnected) {
      window.clearInterval(watch);
      return;
    }
    if (state !== "playing" || video.paused || video.seeking || scrubbing || document.hidden) {
      stuckTicks = 0;
      bufferTicks = 0;
      lastTime = video.currentTime;
      return;
    }
    const moved = Math.abs(video.currentTime - lastTime) > 0.05;
    lastTime = video.currentTime;
    if (moved) {
      stuckTicks = 0;
      bufferTicks = 0;
      return;
    }
    if (video.readyState < 3) {
      // Genuinely waiting for data.
      bufferTicks += 1;
      if (bufferTicks >= 20)
        fail("The video is taking too long to load. Check your connection and try again.");
      return;
    }
    // Ready to play, not paused, clock not moving: the device is not accepting audio.
    stuckTicks += 1;
    if (stuckTicks >= 3) {
      stuckTicks = 0;
      if (!video.muted && !mutedFallbackUsed) {
        mutedFallbackUsed = true;
        video.muted = true;
        void requestPlay();
        say(
          "Your device would not start the sound, so the video is playing without it. Use the speaker button to try the sound again.",
          10000,
        );
      } else {
        fail(
          "Playback did not start on this device. Try again, or open this page in another browser.",
        );
      }
    }
  }, 1000);

  /* ---------- Pointer and tap ---------- */
  surface.addEventListener("pointerdown", (e) => {
    lastPointer = e.pointerType || "mouse";
    // Read before the browser moves focus to the player, which reveals the controls.
    hiddenAtPointerDown = root.dataset["controls"] === "hide";
  });
  surface.addEventListener("click", () => {
    const controlsWereHidden = hiddenAtPointerDown;
    root.focus({ preventScroll: true });
    if (dock !== "main") {
      // Mini player on a touch screen: the first tap brings the buttons back, the next one pauses.
      if (state === "playing" && lastPointer === "touch" && controlsWereHidden) showControls();
      else toggle();
      return;
    }
    if (state === "idle") {
      startWithSound();
      return;
    }
    if (state === "playing" && lastPointer === "touch" && controlsWereHidden) {
      showControls();
      return;
    }
    toggle();
  });
  root.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    showControls();
    root.dataset["cursor"] = "1";
  });
  root.addEventListener("pointerleave", () => {
    hoverBar = false;
    if (state === "playing") {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideControls, 700);
    }
  });
  bar.addEventListener("pointerenter", () => {
    hoverBar = true;
  });
  bar.addEventListener("pointerleave", () => {
    hoverBar = false;
    showControls();
  });
  root.addEventListener("focusin", showControls);

  playBtn.addEventListener("click", () => {
    toggle();
    showControls();
  });
  muteBtn.addEventListener("click", toggleMute);
  speedBtn.addEventListener("click", cycleSpeed);
  fsBtn.addEventListener("click", toggleFullscreen);
  retryBtn.addEventListener("click", retry);
  vol.addEventListener("input", () => {
    video.volume = Number(vol.value);
    video.muted = Number(vol.value) === 0;
  });

  /* ---------- Seek bar (pointer drag, touch drag, keyboard) ---------- */
  const timeAt = (clientX: number) => {
    const r = seek.getBoundingClientRect();
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    return Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width))) * d;
  };
  const showTip = (clientX: number) => {
    const r = seek.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, clientX - r.left));
    tip.textContent = fmtTime(timeAt(clientX));
    tip.style.left = `${x}px`;
  };
  seek.addEventListener("pointerdown", (e) => {
    if (!Number.isFinite(video.duration)) return;
    scrubbing = true;
    seek.setPointerCapture(e.pointerId);
    scrubTime = timeAt(e.clientX);
    showTip(e.clientX);
    seek.dataset["drag"] = "1";
    paintTime();
  });
  seek.addEventListener("pointermove", (e) => {
    showTip(e.clientX);
    if (!scrubbing) return;
    scrubTime = timeAt(e.clientX);
    paintTime();
  });
  const endScrub = (e: PointerEvent) => {
    if (!scrubbing) return;
    scrubbing = false;
    seek.dataset["drag"] = "0";
    video.currentTime = timeAt(e.clientX);
    paintTime();
    showControls();
  };
  seek.addEventListener("pointerup", endScrub);
  seek.addEventListener("pointercancel", () => {
    scrubbing = false;
    seek.dataset["drag"] = "0";
    paintTime();
  });
  seek.addEventListener("keydown", (e) => {
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    if (e.key === "Home") video.currentTime = 0;
    else if (e.key === "End") video.currentTime = Math.max(0, d - 0.1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });

  /* ---------- Keyboard (only while focus is inside the player) ---------- */
  root.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement;
    const onButton = target.tagName === "BUTTON";
    const onRange = target.tagName === "INPUT";
    switch (e.key) {
      case "Escape":
        if (dock !== "mini") return;
        e.preventDefault();
        closeMini();
        return;
      case " ":
        if (onButton) return; // let the focused button do its own thing
        e.preventDefault();
        toggle();
        break;
      case "k":
      case "K":
        e.preventDefault();
        toggle();
        break;
      case "ArrowLeft":
        if (onRange) return;
        e.preventDefault();
        seekBy(-SEEK_STEP);
        break;
      case "ArrowRight":
        if (onRange) return;
        e.preventDefault();
        seekBy(SEEK_STEP);
        break;
      case "m":
      case "M":
        e.preventDefault();
        toggleMute();
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      default:
        return;
    }
    showControls();
  });

  /* ---------- Sound overlay ---------- */
  sound.addEventListener("click", () => {
    root.focus({ preventScroll: true });
    startWithSound();
  });

  /* ---------- Sticky mini player ----------
     The slot (.vsl) is the placeholder: it keeps its 16:9 box in the page. When it is scrolled away
     while the video plays, the player root switches to position: fixed (data-dock="mini"). Same
     element, same <video>, no DOM move, so the clock never stops. */
  const poster = video.getAttribute("poster");
  if (poster) slot.style.setProperty("--vsl-poster", `url("${poster.replace(/"/g, "%22")}")`);

  const flashFx = (name: string) => {
    if (reduceMotion) return;
    root.dataset["fx"] = name;
    window.clearTimeout(fxTimer);
    fxTimer = window.setTimeout(() => {
      delete root.dataset["fx"];
    }, 260);
  };

  const setDock = (next: Dock) => {
    if (dock === next) return;
    const prev = dock;
    dock = next;
    root.dataset["dock"] = next;
    slot.dataset["docked"] = next === "main" ? "0" : "1";
    document.documentElement.classList.toggle("vsl-mini", next === "mini");
    if (next === "mini") flashFx("in");
    else if (next === "main" && prev !== "main") flashFx("back");
    showControls();
  };

  const closeMini = () => {
    video.pause();
    setDock("closed");
  };

  const expandMini = () => {
    const r = slot.getBoundingClientRect();
    let y = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
    if (r.top + window.scrollY < window.innerHeight * 0.9) y = 0; // it sits in the first screen: back to the top, headline and all
    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
    // If the page cannot scroll any closer, dock it right away.
    window.setTimeout(() => {
      if (dock === "mini" && ratio >= 0.25) setDock("main");
    }, 900);
  };

  miniPlay.addEventListener("click", toggle);
  miniSound.addEventListener("click", () => {
    if (soundGate || video.muted) unmuteInPlace();
    else video.muted = true;
  });
  miniExpand.addEventListener("click", expandMini);
  miniClose.addEventListener("click", closeMini);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e) return;
        ratio = e.isIntersecting ? e.intersectionRatio : 0;
        if (dock === "main") {
          // Out of view and playing (muted autoplay counts): float it. A paused video stays put.
          if (
            ratio < 0.08 &&
            !video.paused &&
            !video.ended &&
            !inFullscreen() &&
            state === "playing"
          ) {
            setDock("mini");
          }
        } else if (ratio >= 0.25) {
          setDock("main"); // back at the top: dock it again; "closed" resets too
        }
      },
      { threshold: [0, 0.04, 0.08, 0.15, 0.25, 0.4, 0.6, 1] },
    );
    io.observe(slot);
    const stop = window.setInterval(() => {
      if (!root.isConnected) {
        io.disconnect();
        document.documentElement.classList.remove("vsl-mini");
        window.clearInterval(stop);
      }
    }, 2000);
  }

  /* ---------- Initial paint ---------- */
  root.dataset["dock"] = "main";
  root.dataset["snd"] = "on";
  root.dataset["auto"] = "0";
  slot.dataset["docked"] = "0";
  video.dispatchEvent(new Event("volumechange"));
  video.dispatchEvent(new Event("ratechange"));
  paintFullscreen();
  paintDuration();
  setState("idle");
  paintBusy();
  if (video.readyState === 0) video.load(); // a player copied out of a <template> may not start loading by itself
  if (wantsAutoplay) void autoStart();
}

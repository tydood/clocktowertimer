// Element references
const timeDisplay = document.getElementById("timeDisplay");
const startStopButton = document.getElementById("startStopButton");
const resetButton = document.getElementById("resetButton");
const incrementTimeButton = document.getElementById("incrementTime");
const editTimeButton = document.getElementById("editTime");
const decrementTimeButton = document.getElementById("decrementTime");
const recallButton = document.getElementById("recallButton");
const toggleTimeOfDayButton = document.getElementById("toggleTimeOfDayButton");
const dayValue = document.getElementById("dayValue");
const body = document.body;
const muteButton = document.getElementById("muteButton");
let timeValues = { day: [], endOfDay: [] }; // Initialize `timeValues` at a higher scope

let toggleTabButton = document.getElementById("toggleHideTab");
let contentDiv = document.getElementById("timerControlsContainer");

toggleTabButton.addEventListener("click", function () {
  if (contentDiv.style.display === "none") {
    contentDiv.style.display = "flex";
    toggleTabButton.classList.remove("hiddenTray");
    toggleTabButton.innerHTML = "<i class='fa fa-arrow-right'></i>";
  } else {
    contentDiv.style.display = "none";
    toggleTabButton.classList.add("hiddenTray");
    toggleTabButton.innerHTML = "<i class='fa fa-arrow-left'></i>";
  }
});

function decrease(id) {
  const element = document.getElementById(id);
  let newValue = parseInt(element.innerText) - 1;
  element.innerText = newValue >= 0 ? newValue : 0; // Prevent negative numbers
}

function increase(id) {
  const element = document.getElementById(id);
  let newValue = parseInt(element.innerText) + 1;
  element.innerText = newValue <= 20 ? newValue : 20; // Limit the maximum value to 20
}

document.getElementById("decreaseHeart").addEventListener("click", function () {
  decrease("heartNumber");
});

document.getElementById("increaseHeart").addEventListener("click", function () {
  increase("heartNumber");
});

document.getElementById("decreaseVote").addEventListener("click", function () {
  decrease("voteNumber");
});

document.getElementById("increaseVote").addEventListener("click", function () {
  increase("voteNumber");
});

// State variables
let isMuted = false;
let countdown;
let isTimerRunning = false;
let defaultTime = 180;
let timeRemaining = defaultTime;
let currentDay = 1;
let phase = 2;
const DAY = 0,
  ENDOFDAY = 1,
  NIGHT = 2;
let timeOfDayText = document.getElementById("timeOfDayText");

function parseKeydown(e) {
  if (document.querySelector("dialog[open]") != null) return;
  let action = findKey(e.key, keybindings);
  switch (action) {
    case "startstop":
      startStopTimer();
      break;
    case "reset":
      resetTimer();
      break;
    case "timer":
      editTimer();
      break;
    case "timeplus":
      incrementTimer();
      break;
    case "timeminus":
      decrementTimer();
      break;
    case "recall":
      recall();
      break;
    case "nextphase":
      advanceTime();
      break;
    case "previousphase":
      if (currentDay == 1 && isNight()) break;
      if (!isEndOfDay()) {
        currentDay = currentDay - 1;
      }
      phase++;
      advanceTime();
      break;
    case "aliveplus":
      increase("heartNumber");
      break;
    case "aliveminus":
      decrease("heartNumber");
      break;
    case "voteplus":
      increase("voteNumber");
      break;
    case "voteminus":
      decrease("voteNumber");
      break;
    case "toggleinfo":
      toggleInfo();
      break;
    case "mute":
      toggleMute();
      break;
    case "fullscreen":
      if (
        document.fullscreenElement /* Standard syntax */ ||
        document.webkitFullscreenElement /* Safari and Opera syntax */ ||
        document.msFullscreenElement /* IE11 syntax */
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          /* IE11 */
          document.msExitFullscreen();
        }
      } else {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          /* Safari */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          /* IE11 */
          elem.msRequestFullscreen();
        }
      }
      break;
    case "togglesettings":
      openSettings();
      break;
    default:
      console.debug(`No Action for key: ${e.key} (${e.keyCode})`);
  }
  if (action != null) {
    e.preventDefault();
  }
}
document.addEventListener("keydown", parseKeydown);

function isDay() {
  return phase == DAY;
}

function isEndOfDay() {
  return phase == ENDOFDAY;
}

function isNight() {
  return phase == NIGHT;
}

function openSettings() {
  const settings = document.querySelector("#settings");
  settings.returnValue = "none";
  settings.showModal();
}

document
  .getElementById("settingsButton")
  .addEventListener("click", openSettings);
openSettings();

document.querySelector("#settings").addEventListener("cancel", (e) => {
  if (document.querySelector("#settings").returnValue === "none")
    e.preventDefault();
});

document.querySelector("#settings").addEventListener("close", (e) => {
  if (document.querySelector("#settings").returnValue === "save") {
    if (!body.classList.contains("gameRunning")) {
      body.classList.add("gameRunning");
      document.querySelector("#playerCountInput").autofocus = false;
      document.querySelector("#travellerCountInput").autofocus = true;
    }
    saveSettings();
  }
  loadSettings();
  document.querySelector("#settingsButton").blur();
});

function displayTimeLeft(seconds) {
  timeDisplay.textContent = formatTime(seconds);
}

function timer() {
  clearInterval(countdown);
  const now = Date.now();
  const then = now + timeRemaining * 1000;
  countdown = setInterval(() => {
    const secondsLeft = Math.round((then - Date.now()) / 1000);
    if (secondsLeft < 0) {
      clearInterval(countdown);
      isTimerRunning = false;
      body.classList.remove("timerRunning");
      timeRemaining = defaultTime;
      playSound();
      return;
    }
    timeRemaining = secondsLeft;
    displayTimeLeft(timeRemaining);
  }, 1000);
}

function playDaySound() {
  if (!isMuted) {
    const sound = document.getElementById("daySound");
    sound.play();
  }
}

function playEndOfDaySound() {
  if (!isMuted) {
    const sound = document.getElementById("endOfDaySound");
    sound.play();
  }
}

function playNightSound() {
  if (!isMuted) {
    const sound = document.getElementById("nightSound");
    sound.play();
  }
}

function playSound() {
  if (!isMuted) {
    const sound = document.getElementById("endTimer");
    sound.play();
  }
}

function updateBackground() {
  const body = document.body; // or the main container element

  // Remove classes to start fresh
  body.classList.remove(
    "background-day",
    "background-endOfDay",
    "background-night"
  );

  // Add the appropriate class based on the phase (Day, End of Day or Night)
  switch (phase) {
    case DAY:
      body.classList.add("background-day");
      break;
    case ENDOFDAY:
      body.classList.add("background-endOfDay");
      break;
    case NIGHT:
      body.classList.add("background-night");
      break;
  }
}

function updateDefaultTime() {
  let newTime = isDay()
    ? timeValues.day[Math.min(currentDay, timeValues.day.length) - 1]
    : timeValues.endOfDay[Math.min(currentDay, timeValues.endOfDay.length) - 1];

  if (!isTimerRunning) {
    defaultTime = newTime;
    timeRemaining = newTime;
    displayTimeLeft(timeRemaining);
  }
}

function startStopTimer() {
  if (!isTimerRunning && !isNight()) {
    timer();
    isTimerRunning = true;
    body.classList.add("timerRunning");
    startStopButton.innerHTML = '<i class="fas fa-stop"></i>';
  } else {
    clearInterval(countdown);
    isTimerRunning = false;
    body.classList.remove("timerRunning");
    startStopButton.innerHTML = '<i class="fas fa-play"></i>';
  }
  startStopButton.blur();
}

startStopButton.addEventListener("click", startStopTimer);

function resetTimer() {
  if (!isTimerRunning && !isNight()) {
    timeRemaining = defaultTime;
    displayTimeLeft(timeRemaining);
  }
  resetButton.blur();
}

resetButton.addEventListener("click", resetTimer);

function incrementTimer() {
  if (!isTimerRunning && !isNight()) {
    defaultTime = Math.min(defaultTime + stepSize, 3599);
    timeRemaining = defaultTime;
    displayTimeLeft(timeRemaining);
  }
  incrementTimeButton.blur();
}

incrementTimeButton.addEventListener("click", incrementTimer);

function editTimer() {
  if (!isTimerRunning && !isNight()) {
    document.querySelector("#timerEditDialog").returnValue = "none";
    document.querySelector("#timerEditDialog").showModal();
  }
}

editTimeButton.addEventListener("click", editTimer);

document.querySelector("#timerEditDialog").addEventListener("close", (e) => {
  const dialog = document.querySelector("#timerEditDialog");
  const userTime = dialog.querySelector("input").value;
  dialog.querySelector("input").value = "";
  editTimeButton.blur();
  if (dialog.returnValue === "none") return;
  if (userTime !== "") {
    const parsedTime = parseTime(userTime);
    if (parsedTime <= 0 || parsedTime > 3599) {
      const message = document.querySelector("#messageDialog");
      message.querySelector("h1").innerText = "Invalid Timer Value";
      message.querySelector(
        "p"
      ).innerHTML = `Invalid input '${userTime}'<br>Possible formats: 7.5, 7:30, 450s<br>Possible range: 1 second - 59:59`;
      message.showModal();
      return;
    } else {
      defaultTime = parsedTime;
      timeRemaining = defaultTime;
      displayTimeLeft(timeRemaining);
    }
  }
});

function decrementTimer() {
  if (!isTimerRunning && !isNight()) {
    defaultTime = Math.max(defaultTime - stepSize, 0);
    timeRemaining = defaultTime;
    displayTimeLeft(timeRemaining);
  }
  decrementTimeButton.blur();
}

decrementTimeButton.addEventListener("click", decrementTimer);

document.addEventListener("DOMContentLoaded", function () {
  const gameSoundsCheckbox = document.getElementById("gameSounds");
  toggleMute(!gameSoundsCheckbox.checked);

  gameSoundsCheckbox.addEventListener("change", function () {
    toggleMute(!this.checked);
  });
});

function toggleMute(shouldMute) {
  isMuted = shouldMute;
  document.getElementById("gameSounds").checked = !isMuted;
}

function setTimerToZero() {
  timeRemaining = 0;
  displayTimeLeft(timeRemaining);
}

function recall() {
  if (!isNight()) {
    if (isTimerRunning) {
      startStopTimer();
    }
    playSound();
    setTimerToZero();
  }
  recallButton.blur();
}

recallButton.addEventListener("click", recall);

function advanceTime() {
  phase = (phase + 1) % 3;

  if (phase === NIGHT) {
    currentDay = (currentDay % 15) + 1;
  }

  updateToggleButtonText();
  updateBackground();
  updateDefaultTime();
  updateSpanText();
  dayValue.textContent = currentDay;

  switch (phase) {
    case DAY:
      playDaySound();
      break;
    case ENDOFDAY:
      playEndOfDaySound();
      break;
    case NIGHT:
      playNightSound();
      break;
  }

  if (useSpotify()) {
    spotifyVolume(volume[phase]);
  }

  toggleTimeOfDayButton.blur();
}

toggleTimeOfDayButton.addEventListener("click", advanceTime);

function toggleInfo() {
  const dialogueBox = document.querySelector("#dialogueBox");
  if (dialogueBox.classList.contains("noDisplay")) {
    dialogueBox.classList.remove("noDisplay");
  } else {
    dialogueBox.classList.add("noDisplay");
  }
  document.querySelector("#infoIcon").blur();
}

document.querySelector("#infoIcon").addEventListener("click", toggleInfo);

function updateToggleButtonText() {
  toggleTimeOfDayButton.innerHTML = isDay()
    ? "<i class='fas fa-cloud'></i></i>"
    : isEndOfDay()
    ? "<i class='fas fa-moon'></i>"
    : "<i class='fas fa-sun'></i>";
}

function updateSpanText() {
  timeOfDayText.innerText = isDay()
    ? "Day"
    : isEndOfDay()
    ? "End of Day"
    : "Night";
}

updateToggleButtonText();
updateBackground();
updateDefaultTime();
updateSpanText();

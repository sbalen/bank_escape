(function () {

  var sfx = new ChiptuneSFX();
  document.addEventListener("click", function unlockSfxOnce() {
    sfx.unlock();
    document.removeEventListener("click", unlockSfxOnce);
  }, { once: true });

  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  var state = {
    knows_about_tank: false,
    tank_opened: false,
    has_toilet_paper: false,
    has_hand_sanitizer: false,
    on_urinal: false,
    vent_open: false,
    heard_muffled_once: false,
    heard_vent_conversation: false,
    knows_fire_opens_door: false,
    has_lipstick: false,
    has_sprint_fragment: false,
    jacket_searched: false,
    fire_started: false,
    emergency_door_open: false,
    door_noticed_once: false,
    zone2_started: false,
    stall1_unlocked: false
  };

  var inventory = []; // array of item ids, in pickup order
  var currentVerb = "notice";
  var armedItem = null;

  // ---------------------------------------------------------------------
  // FALLBACKS
  // ---------------------------------------------------------------------
  var FALLBACK = {
    notice: TEXTS["fallback.notice"],
    take: TEXTS["fallback.take"],
    fiddle: TEXTS["fallback.fiddle"],
    useBare: TEXTS["fallback.use_bare"],
    useItem: TEXTS["fallback.use_item"]
  };

  // ---------------------------------------------------------------------
  // ITEMS
  // ---------------------------------------------------------------------
  var ITEMS = {
    coin: {
      name: "Coin",
      notice: function () { return TEXTS["item.coin.notice"]; }
    },
    cigarettes: {
      name: "Cigarettes",
      notice: function (s) {
        return s.has_lighter
          ? TEXTS["item.cigarettes.notice.has_lighter"]
          : TEXTS["item.cigarettes.notice.no_lighter"];
      }
    },
    lighter: {
      name: "Lighter",
      notice: function () { return TEXTS["item.lighter.notice"]; }
    },
    toilet_paper: {
      name: "Toilet paper",
      notice: function () { return TEXTS["item.toilet_paper.notice"]; }
    },
    hand_sanitizer: {
      name: "Hand sanitizer",
      notice: function () { return TEXTS["item.hand_sanitizer.notice"]; }
    },
    soaked_paper: {
      name: "Soaked toilet paper",
      notice: function () { return TEXTS["item.soaked_paper.notice"]; }
    },
    sprint_fragment: {
      name: "Sprint planning fragment",
      notice: function () { return TEXTS["item.sprint_fragment.notice"]; }
    },
    lipstick: {
      name: "Lipstick",
      notice: function () { return TEXTS["item.lipstick.notice"]; }
    }
  };

  function hasLighterFlag() { return inventory.indexOf("lighter") !== -1; }
  // small patch so cigarettes' notice can check "does the player have a lighter"
  // without a separate state flag duplicating inventory data
  Object.defineProperty(state, "has_lighter", { get: hasLighterFlag });

  function addItem(id) {
    if (inventory.indexOf(id) === -1) {
      inventory.push(id);
      sfx.playPickup();
    }
    renderInventory();
  }
  function removeItem(id) {
    var idx = inventory.indexOf(id);
    if (idx !== -1) inventory.splice(idx, 1);
    renderInventory();
  }

  // ---------------------------------------------------------------------
  // HOTSPOTS
  // ---------------------------------------------------------------------
  var HOTSPOTS = {

    stall1: {
      notice: function (s) {
        if (!s.stall1_unlocked) {
          return TEXTS["hotspot.stall1.notice.locked"];
        }
        openStallSubzone("stall1");
        return TEXTS["hotspot.stall1.notice.unlocked"];
      },
      take: function () { return TEXTS["hotspot.stall1.take"]; },
      fiddle: function (s) {
        if (!s.stall1_unlocked) {
          s.stall1_unlocked = true;
          return TEXTS["hotspot.stall1.fiddle.locked"];
        }
        return TEXTS["hotspot.stall1.fiddle.unlocked"];
      },
      use: function () { return TEXTS["hotspot.stall1.use"]; }
    },

    stall2: {
      notice: function (s) {
        openStallSubzone("stall2");
        return TEXTS["hotspot.stall2.notice"];
      },
      take: function () { return TEXTS["hotspot.stall2.take"]; },
      fiddle: function () { return TEXTS["hotspot.stall2.fiddle"]; },
      use: function () { return TEXTS["hotspot.stall2.use"]; }
    },

    stall3: {
      notice: function (s) {
        openStallSubzone("stall3");
        return TEXTS["hotspot.stall3.notice"];
      },
      take: function () { return TEXTS["hotspot.stall3.take"]; },
      fiddle: function () { return TEXTS["hotspot.stall3.fiddle"]; },
      use: function () { return TEXTS["hotspot.stall3.use"]; }
    },

    jacket: {
      notice: function () { return TEXTS["hotspot.jacket.notice"]; },
      take: function (s) {
        if (!s.jacket_searched) {
          s.jacket_searched = true;
          addItem("coin");
          return TEXTS["hotspot.jacket.take.first"];
        }
        return FALLBACK.take;
      },
      fiddle: function () { return TEXTS["hotspot.jacket.fiddle"]; }
    },

    wall_text_1: {
      notice: function () {
        return TEXTS["hotspot.wall_text_1.notice"];
      }
    },

    wall_text_2: {
      notice: function (s) {
        s.knows_about_tank = true;
        return TEXTS["hotspot.wall_text_2.notice"];
      }
    },

    tp_roll: {
      notice: function () { return TEXTS["hotspot.tp_roll.notice"]; },
      take: function (s) {
        if (!s.has_toilet_paper) {
          s.has_toilet_paper = true;
          addItem("toilet_paper");
          updateTpRollSprite();
          return TEXTS["hotspot.tp_roll.take.first"];
        }
        return FALLBACK.take;
      }
    },

    toilet_tank: {
      notice: function (s) {
        return s.knows_about_tank
          ? TEXTS["hotspot.toilet_tank.notice.knows"]
          : TEXTS["hotspot.toilet_tank.notice.default"];
      },
      use: function (s) {
        if (s.tank_opened) return TEXTS["hotspot.toilet_tank.use.opened"];
        s.tank_opened = true;
        addItem("cigarettes");
        return TEXTS["hotspot.toilet_tank.use.first"];
      }
    },

    urinal_ok1: urinalWorking(), urinal_ok2: urinalWorking(),
    urinal_ok3: urinalWorking(), urinal_ok4: urinalWorking(),

    urinal_broken: {
      notice: function () {
        return TEXTS["hotspot.urinal_broken.notice"];
      },
      use: function (s) {
        if (s.on_urinal) return TEXTS["hotspot.urinal_broken.use.already"];
        s.on_urinal = true;
        openZoomSubzone("vent");
        playStepUpAnimation();
        return TEXTS["hotspot.urinal_broken.use.first"];
      }
    },

    vent: {
      notice: function (s) {
        if (!s.on_urinal) return TEXTS["hotspot.vent.notice.not_on_urinal"];
        openZoomSubzone("vent");
        if (!s.vent_open) {
          if (!s.heard_muffled_once) {
            s.heard_muffled_once = true;
            return TEXTS["hotspot.vent.notice.closed.first"];
          }
          return TEXTS["hotspot.vent.notice.closed.repeat"];
        }
        if (!s.heard_vent_conversation) {
          s.heard_vent_conversation = true;
          s.knows_fire_opens_door = true;
          return TEXTS["hotspot.vent.notice.open.first"];
        }
        return TEXTS["hotspot.vent.notice.open.repeat"];
      },
      fiddle: function (s) {
        if (!s.vent_open) return TEXTS["hotspot.vent.fiddle.closed"];
        return TEXTS["hotspot.vent.fiddle.open"];
      },
      use: function (s, itemId) {
        if (!s.on_urinal) return TEXTS["hotspot.vent.use.not_on_urinal"];
        if (itemId !== "coin") return FALLBACK.useItem;
        if (s.vent_open) return TEXTS["hotspot.vent.use.already_open"];
        s.vent_open = true;
        updateVentBackground();
        updateVentGrilleVisibility();
        updateDuctLighterVisibility();
        return TEXTS["hotspot.vent.use.first"];
      }
    },

    // Inside the vent close-up (data-subzone="vent") — only reachable once vent_open.
    duct_lighter: {
      notice: function (s) {
        return s.has_lighter ? TEXTS["hotspot.duct_lighter.notice.taken"] : TEXTS["hotspot.duct_lighter.notice.default"];
      },
      take: function (s) {
        if (!s.vent_open) return FALLBACK.take;
        if (!s.has_lighter) {
          addItem("lighter");
          updateDuctLighterVisibility();
          return TEXTS["hotspot.duct_lighter.take.first"];
        }
        return FALLBACK.take;
      }
    },

    firstaid: {
      notice: function (s) {
        openZoomSubzone("cabinet");
        return s.has_hand_sanitizer ? TEXTS["hotspot.firstaid.notice.empty"] : TEXTS["hotspot.firstaid.notice.first"];
      }
    },

    // Inside the first-aid cabinet close-up (data-subzone="cabinet").
    bandages: {
      notice: function () { return TEXTS["hotspot.bandages.notice"]; }
    },
    cabinet_sanitizer: {
      notice: function (s) {
        return s.has_hand_sanitizer ? TEXTS["hotspot.cabinet_sanitizer.notice.taken"] : TEXTS["hotspot.cabinet_sanitizer.notice.default"];
      },
      take: function (s) {
        if (!s.has_hand_sanitizer) {
          s.has_hand_sanitizer = true;
          addItem("hand_sanitizer");
          updateCabinetSanitizerVisibility();
          return TEXTS["hotspot.cabinet_sanitizer.take.first"];
        }
        return FALLBACK.take;
      }
    },

    mirror: {
      notice: function () {
        return TEXTS["hotspot.mirror.notice"];
      }
    },

    sink: {
      notice: function (s) {
        if (!s.has_lipstick) return TEXTS["hotspot.sink.notice.has_lipstick"];
        return TEXTS["hotspot.sink.notice.default"];
      },
      take: function (s) {
        if (!s.has_lipstick) {
          s.has_lipstick = true;
          addItem("lipstick");
          return TEXTS["hotspot.sink.take.first"];
        }
        return FALLBACK.take;
      }
    },

    papertowel: {
      notice: function () { return TEXTS["hotspot.papertowel.notice"]; },
      use: function () { return TEXTS["hotspot.papertowel.use"]; }
    },

    trashcan: {
      notice: function () { return TEXTS["hotspot.trashcan.notice"]; },
      take: function (s) {
        if (!s.has_sprint_fragment) {
          s.has_sprint_fragment = true;
          addItem("sprint_fragment");
          return TEXTS["hotspot.trashcan.take.first"];
        }
        return FALLBACK.take;
      }
    }
  };

  var sprinklerHandler = {
    notice: function () { return TEXTS["hotspot.sprinkler.notice"]; },
    take: function () { return TEXTS["hotspot.sprinkler.take"]; },
    fiddle: function () { return TEXTS["hotspot.sprinkler.fiddle"]; },
    use: function (s, itemId) {
      if (itemId === "lighter") return TEXTS["hotspot.sprinkler.use.lighter"];
      return TEXTS["hotspot.sprinkler.use.default"];
    }
  };
  HOTSPOTS.sprinkler1 = sprinklerHandler;
  HOTSPOTS.sprinkler2 = sprinklerHandler;
  HOTSPOTS.sprinkler3 = sprinklerHandler;

  HOTSPOTS.door = {
    notice: function (s) {
      if (!s.emergency_door_open) {
        if (!s.door_noticed_once) {
          s.door_noticed_once = true;
          return TEXTS["hotspot.door.notice.locked_first"];
        }
        return TEXTS["hotspot.door.notice.locked_repeat"];
      }
      return TEXTS["hotspot.door.notice.open"];
    },
    fiddle: function (s) {
      if (!s.emergency_door_open) {
        return TEXTS["hotspot.door.fiddle.locked"];
      }
      return TEXTS["hotspot.door.fiddle.open"];
    },
    use: function (s) {
      if (!s.emergency_door_open) {
        return TEXTS["hotspot.door.use.locked"];
      }
      if (s.zone2_started) {
        return TEXTS["hotspot.door.use.already_zone2"];
      }
      s.zone2_started = true;
      setTimeout(function () {
        setOutput(TEXTS["output.zone2_placeholder"]);
      }, 900);
      return TEXTS["hotspot.door.use.first"];
    }
  };

  HOTSPOTS.keypad = {
    notice: function (s) {
      if (!s.emergency_door_open) {
        return TEXTS["hotspot.keypad.notice.locked"];
      }
      return TEXTS["hotspot.keypad.notice.open"];
    },
    fiddle: function (s) {
      if (!s.emergency_door_open) {
        return TEXTS["hotspot.keypad.fiddle.locked"];
      }
      return TEXTS["hotspot.keypad.fiddle.open"];
    }
  };

  function urinalWorking() {
    return {
      notice: function () { return TEXTS["hotspot.urinal_ok.notice"]; },
      use: function () { return TEXTS["hotspot.urinal_ok.use"]; }
    };
  }

  // ---------------------------------------------------------------------
  // ITEM + ITEM COMBINATIONS
  // ---------------------------------------------------------------------
  function combineItems(a, b) {
    function pair(x, y) { return (a === x && b === y) || (a === y && b === x); }

    if (pair("toilet_paper", "hand_sanitizer")) {
      removeItem("toilet_paper");
      removeItem("hand_sanitizer");
      addItem("soaked_paper");
      return TEXTS["combine.paper_sanitizer"];
    }

    if (pair("soaked_paper", "lighter")) {
      removeItem("soaked_paper");
      state.fire_started = true;
      setTimeout(triggerFireSequence, 1400);
      return TEXTS["combine.soaked_lighter"];
    }

    if (pair("lighter", "toilet_paper")) {
      return TEXTS["combine.lighter_dry_paper"];
    }

    if (pair("hand_sanitizer", "lighter")) {
      return TEXTS["combine.sanitizer_lighter"];
    }

    return null;
  }

  function triggerFireSequence() {
    state.emergency_door_open = true;
    sceneFrame.classList.add("shake");
    playFlash();
    sfx.playExplosion();
    setTimeout(function () {
      sceneFrame.classList.remove("shake");
      if (doorMode) {
        sceneFrame.style.backgroundImage = DOOR_BG_OPEN;
      } else if (!activeStall && !activeZoom && !document.body.classList.contains("watch-mode")) {
        // Main scene is the one currently on screen — swap it to the
        // sprinkler-soaked plate right away instead of waiting for the
        // player to leave and re-enter a subzone.
        sceneFrame.style.backgroundImage = currentMainBg();
      }
      playRain();
    }, 650);
    setOutput(TEXTS["output.fire_sequence"]);
  }

  function playRain() {
    rainOverlay.classList.add("active");
    clearTimeout(rainTimer);
    rainTimer = setTimeout(function () { rainOverlay.classList.remove("active"); }, 2400);
  }

  function playFlash() {
    var el = document.getElementById("flash-overlay");
    el.classList.remove("active");
    void el.offsetWidth; // restart animation
    el.classList.add("active");
  }

  function playStepUpAnimation() {
    sceneFrame.classList.remove("step-up");
    void sceneFrame.offsetWidth; // restart animation
    sceneFrame.classList.add("step-up");
    setTimeout(function () { sceneFrame.classList.remove("step-up"); }, 600);
  }

  // ---------------------------------------------------------------------
  // UI PLUMBING
  // ---------------------------------------------------------------------
  var outputEl = document.getElementById("output-text");
  var statusEl = document.getElementById("status-text");
  var inventoryEl = document.getElementById("inventory-row");
  var sceneFrame = document.getElementById("scene-frame");
  var sceneStage = document.getElementById("scene-stage");
  var IMG_RATIO = 1672 / 940;

  function fitSceneFrame() {
    var stageW = sceneStage.clientWidth;
    var stageH = sceneStage.clientHeight;
    var stageRatio = stageW / stageH;
    var frameW, frameH;
    if (stageRatio > IMG_RATIO) {
      // stage relatively wider than the image -> height is the limiting factor
      frameH = stageH;
      frameW = frameH * IMG_RATIO;
    } else {
      // stage relatively taller/narrower than the image -> width is the limiting factor
      frameW = stageW;
      frameH = frameW / IMG_RATIO;
    }
    sceneFrame.style.width = frameW + "px";
    sceneFrame.style.height = frameH + "px";
    sceneFrame.style.left = ((stageW - frameW) / 2) + "px";
    sceneFrame.style.top = ((stageH - frameH) / 2) + "px";
  }

  fitSceneFrame();
  window.addEventListener("resize", fitSceneFrame);

  // ---------------------------------------------------------------------
  // CHARMIN WATCH SUBZONE
  // ---------------------------------------------------------------------
  var WATCH_BG = "url('{{BG_WATCH}}')";
  var ORIGINAL_BG = sceneFrame.style.backgroundImage;
  var MAIN_BG_WET = "url('{{BG_MAIN_WET}}')";
  var DOOR_BG_CLOSED = "url('{{BG_DOOR_CLOSED}}')";
  var DOOR_BG_OPEN = "url('{{BG_DOOR_OPEN}}')";
  var doorMode = false;
  var rainTimer = null;

  // Main scene background: swaps permanently to the sprinkler-soaked plate
  // once the fire sequence has gone off (mirrors DOOR_BG_CLOSED/OPEN).
  function currentMainBg() {
    return state.fire_started ? MAIN_BG_WET : ORIGINAL_BG;
  }

  var WATCH_WIDGETS = [
    { type: "text", title: TEXTS["watch.heart_rate.title"], console: TEXTS["watch.heart_rate.console"], text: TEXTS["watch.heart_rate.text"] },
    { type: "text", title: TEXTS["watch.sleep.title"], text: TEXTS["watch.sleep.text"] },
    { type: "text", title: TEXTS["watch.notifications.title"], text: TEXTS["watch.notifications.text"] },
    { type: "photo", img: "{{WATCH_PHOTO_1}}", caption: TEXTS["watch.photo1.caption"] },
    { type: "photo", img: "{{WATCH_PHOTO_2}}", caption: TEXTS["watch.photo2.caption"] },
    { type: "photo", img: "{{WATCH_PHOTO_3}}", caption: TEXTS["watch.photo3.caption"] }
  ];

  var watchIndex = 0;
  var watchTextEl = document.getElementById("watch-textbox");
  var watchDotsEl = document.getElementById("watch-dots");
  var watchOpenBtn = document.getElementById("watch-open-btn");
  var watchCloseBtn = document.getElementById("watch-close-btn");
  var watchPrevBtn = document.getElementById("watch-prev");
  var watchNextBtn = document.getElementById("watch-next");

  function renderWatchWidget() {
    var w = WATCH_WIDGETS[watchIndex];
    if (w.type === "text") {
      watchTextEl.innerHTML = "";
      watchTextEl.classList.remove("photo-mode");
      if (w.title) {
        var titleEl = document.createElement("div");
        titleEl.className = "watch-widget-title";
        titleEl.textContent = w.title;
        watchTextEl.appendChild(titleEl);
      }
      var bodyEl = document.createElement("div");
      bodyEl.className = "watch-widget-body";
      bodyEl.textContent = w.text;
      watchTextEl.appendChild(bodyEl);
      if (w.console) setOutput(w.console);
    } else {
      watchTextEl.classList.add("photo-mode");
      watchTextEl.innerHTML = "";
      var imgBox = document.createElement("div");
      imgBox.className = "watch-photo-box";
      if (w.img) {
        var imgEl = document.createElement("img");
        imgEl.src = w.img;
        imgBox.appendChild(imgEl);
      } else {
        imgBox.classList.add("watch-photo-placeholder");
        imgBox.textContent = "[photo pending]";
      }
      watchTextEl.appendChild(imgBox);
      if (w.caption) setOutput(w.caption);
    }
    var dots = "";
    for (var i = 0; i < WATCH_WIDGETS.length; i++) dots += (i === watchIndex ? "●" : "○") + " ";
    watchDotsEl.textContent = dots.trim();
  }

  function openWatch() {
    if (doorMode) closeDoorView();
    if (activeStall) closeStallSubzone();
    if (activeZoom) closeZoomSubzone();
    document.body.classList.add("watch-mode");
    sceneFrame.style.backgroundImage = WATCH_BG;
    watchIndex = 0;
    renderWatchWidget();
  }

  function closeWatch() {
    document.body.classList.remove("watch-mode");
    sceneFrame.style.backgroundImage = doorMode ? currentDoorBg() : currentMainBg();
  }

  // -----------------------------------------------------------
  // DOOR (exit) SUBZONE
  // -----------------------------------------------------------
  var doorOpenBtn = document.getElementById("door-open-btn");
  var rainOverlay = document.getElementById("rain-overlay");

  (function buildRaindrops() {
    for (var i = 0; i < 16; i++) {
      var d = document.createElement("div");
      d.className = "raindrop";
      d.style.left = (Math.random() * 96 + 2) + "%";
      d.style.animationDuration = (0.6 + Math.random() * 0.5) + "s";
      d.style.animationDelay = (Math.random() * 1.2) + "s";
      rainOverlay.appendChild(d);
    }
  })();

  function currentDoorBg() {
    return state.emergency_door_open ? DOOR_BG_OPEN : DOOR_BG_CLOSED;
  }

  function renderDoorBg() {
    sceneFrame.style.backgroundImage = currentDoorBg();
  }

  function openDoorView() {
    if (document.body.classList.contains("watch-mode")) closeWatch();
    if (activeStall) closeStallSubzone();
    if (activeZoom) closeZoomSubzone();
    doorMode = true;
    document.body.classList.add("door-mode");
    renderDoorBg();
    doorOpenBtn.textContent = TEXTS["ui.door_button.turn_back"];
  }

  function closeDoorView() {
    doorMode = false;
    document.body.classList.remove("door-mode");
    sceneFrame.style.backgroundImage = currentMainBg();
    doorOpenBtn.textContent = TEXTS["ui.door_button.turn_around"];
  }

  doorOpenBtn.addEventListener("click", function () {
    if (doorMode) closeDoorView(); else openDoorView();
  });

  // -----------------------------------------------------------
  // STALL INTERIOR SUBZONES (all three now on real, pixel-calibrated art)
  // -----------------------------------------------------------
  var activeStall = null;
  var subzoneBackBtn = document.getElementById("subzone-back-btn");

  var STALL_BG = {
    stall1: "url('{{BG_STALL1}}')",
    stall2: "url('{{BG_STALL2}}')",
    stall3: "url('{{BG_STALL3}}')"
  };

  var tpRollSpriteEl = document.getElementById("tp-roll-sprite");

  function updateTpRollSprite() {
    if (!tpRollSpriteEl) return;
    tpRollSpriteEl.style.display = (activeStall === "stall2" && !state.has_toilet_paper) ? "block" : "none";
  }

  function openStallSubzone(id) {
    if (document.body.classList.contains("watch-mode")) closeWatch();
    if (doorMode) closeDoorView();
    if (activeZoom) closeZoomSubzone();
    activeStall = id;
    document.body.classList.add("stall-mode", "active-" + id);
    sceneFrame.style.backgroundImage = STALL_BG[id];
    updateTpRollSprite();
  }

  function closeStallSubzone() {
    if (!activeStall) return;
    document.body.classList.remove("stall-mode", "active-" + activeStall);
    activeStall = null;
    sceneFrame.style.backgroundImage = currentMainBg();
    updateTpRollSprite();
  }

  // -----------------------------------------------------------
  // VENT CLOSE-UP SUBZONE (real art — full-background swap between the
  // closed-grille and open-grille photos, same technique as the exit door;
  // the two source photos aren't pixel-aligned so a sprite-overlay approach
  // doesn't work here, see zone1-wc.md) / CABINET CLOSE-UP SUBZONE (real art
  // too — single shared photo with the shelf already drawn empty, sanitizer
  // bottle as a separate sprite overlay, same pattern as the stall 2
  // toilet-paper roll)
  // -----------------------------------------------------------
  var activeZoom = null; // "vent" | "cabinet" | null
  var ductLighterEl = document.getElementById("duct-lighter-hitbox");
  var lighterSpriteEl = document.getElementById("lighter-sprite");
  var ventGrilleClosedEl = document.getElementById("vent-grille-closed-hitbox");
  var ventGrilleOpenEl = document.getElementById("vent-grille-open-hitbox");
  var cabinetSanitizerEl = document.getElementById("cabinet-sanitizer-hitbox");
  var sanitizerSpriteEl = document.getElementById("sanitizer-sprite");

  var VENT_BG = {
    closed: "url('{{BG_VENT_CLOSED}}')",
    open: "url('{{BG_VENT_OPEN}}')"
  };
  var CABINET_BG = "url('{{BG_CABINET}}')";

  function updateVentBackground() {
    if (activeZoom !== "vent") return;
    sceneFrame.style.backgroundColor = "";
    sceneFrame.style.backgroundImage = state.vent_open ? VENT_BG.open : VENT_BG.closed;
  }

  function updateVentGrilleVisibility() {
    if (!ventGrilleClosedEl || !ventGrilleOpenEl) return;
    var inVent = activeZoom === "vent";
    ventGrilleClosedEl.style.display = (inVent && !state.vent_open) ? "block" : "none";
    ventGrilleOpenEl.style.display = (inVent && state.vent_open) ? "block" : "none";
  }

  function updateDuctLighterVisibility() {
    var visible = activeZoom === "vent" && state.vent_open && !state.has_lighter;
    if (ductLighterEl) ductLighterEl.style.display = visible ? "block" : "none";
    if (lighterSpriteEl) lighterSpriteEl.style.display = visible ? "block" : "none";
  }
  function updateCabinetSanitizerVisibility() {
    var visible = activeZoom === "cabinet" && !state.has_hand_sanitizer;
    if (cabinetSanitizerEl) cabinetSanitizerEl.style.display = visible ? "block" : "none";
    if (sanitizerSpriteEl) sanitizerSpriteEl.style.display = visible ? "block" : "none";
  }

  function openZoomSubzone(id) {
    if (document.body.classList.contains("watch-mode")) closeWatch();
    if (doorMode) closeDoorView();
    if (activeStall) closeStallSubzone();
    activeZoom = id;
    document.body.classList.add("zoom-mode", "active-" + id);
    sceneFrame.style.backgroundColor = "";
    if (id === "vent") {
      updateVentBackground();
    } else {
      sceneFrame.style.backgroundImage = CABINET_BG;
    }
    updateVentGrilleVisibility();
    updateDuctLighterVisibility();
    updateCabinetSanitizerVisibility();
  }

  function closeZoomSubzone() {
    if (!activeZoom) return;
    // Stepping down off the urinal: the wide shot shows you back on the
    // ground, so `on_urinal` shouldn't still be true after leaving the vent
    // zoom — otherwise Use on the urinal again just says "already up there"
    // instead of climbing back up, even though nothing on screen shows you
    // as elevated. Permanent progress (vent_open, the lighter, what you
    // learned from the conversation) is untouched — only this "currently
    // standing on it" pose flag resets.
    if (activeZoom === "vent") state.on_urinal = false;
    document.body.classList.remove("zoom-mode", "active-" + activeZoom);
    activeZoom = null;
    sceneFrame.style.backgroundColor = "";
    sceneFrame.style.backgroundImage = currentMainBg();
    updateVentGrilleVisibility();
    updateDuctLighterVisibility();
    updateCabinetSanitizerVisibility();
  }

  subzoneBackBtn.addEventListener("click", function () {
    if (activeStall) closeStallSubzone();
    if (activeZoom) closeZoomSubzone();
  });

  watchOpenBtn.addEventListener("click", openWatch);
  watchCloseBtn.addEventListener("click", closeWatch);
  watchPrevBtn.addEventListener("click", function () {
    watchIndex = (watchIndex - 1 + WATCH_WIDGETS.length) % WATCH_WIDGETS.length;
    renderWatchWidget();
  });
  watchNextBtn.addEventListener("click", function () {
    watchIndex = (watchIndex + 1) % WATCH_WIDGETS.length;
    renderWatchWidget();
  });

  function setOutput(text) { outputEl.textContent = text; }

  function updateStatus() {
    var t = "Verb: " + currentVerb.charAt(0).toUpperCase() + currentVerb.slice(1);
    if (armedItem) t += "  |  Using: " + ITEMS[armedItem].name;
    statusEl.textContent = t;
  }

  function renderInventory() {
    inventoryEl.innerHTML = "";
    inventory.forEach(function (id) {
      var chip = document.createElement("button");
      chip.className = "item-chip" + (armedItem === id ? " armed" : "");
      chip.textContent = ITEMS[id].name;
      chip.dataset.item = id;
      inventoryEl.appendChild(chip);
    });
  }

  var VERB_CURSORS = {
    notice: "zoom-in",
    take: "grab",
    fiddle: "pointer",
    use: "crosshair"
  };

  document.querySelectorAll(".verb-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".verb-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentVerb = btn.dataset.verb;
      armedItem = null;
      sceneFrame.style.cursor = VERB_CURSORS[currentVerb] || "default";
      updateStatus();
      renderInventory();
    });
  });

  document.getElementById("debug-check").addEventListener("change", function (e) {
    sceneFrame.classList.toggle("debug", e.target.checked);
  });

  sceneFrame.addEventListener("click", function (e) {
    var box = e.target.closest(".hitbox");
    if (!box) return;
    var id = box.dataset.id;
    var spot = HOTSPOTS[id];
    if (!spot) return;
    handleAction(function () { return callHotspot(spot); });
  });

  inventoryEl.addEventListener("click", function (e) {
    var chip = e.target.closest(".item-chip");
    if (!chip) return;
    var id = chip.dataset.item;
    handleInventoryClick(id);
  });

  function callHotspot(spot) {
    if (currentVerb === "notice") {
      return spot.notice ? spot.notice(state) : FALLBACK.notice;
    }
    if (currentVerb === "take") {
      return spot.take ? spot.take(state) : FALLBACK.take;
    }
    if (currentVerb === "fiddle") {
      return spot.fiddle ? spot.fiddle(state) : FALLBACK.fiddle;
    }
    if (currentVerb === "use") {
      if (armedItem) {
        var result = spot.use ? spot.use(state, armedItem) : FALLBACK.useItem;
        armedItem = null;
        renderInventory();
        return result;
      }
      return spot.use ? spot.use(state, null) : FALLBACK.useBare;
    }
    return FALLBACK.notice;
  }

  function handleInventoryClick(id) {
    if (currentVerb === "notice") {
      setOutput(ITEMS[id].notice(state));
      return;
    }
    if (currentVerb === "use") {
      if (!armedItem) {
        armedItem = id;
        updateStatus();
        renderInventory();
        setOutput(TEXTS["ui.using_item_prompt"].replace("{item}", ITEMS[id].name.toLowerCase()));
        return;
      }
      if (armedItem === id) {
        armedItem = null;
        updateStatus();
        renderInventory();
        setOutput(TEXTS["ui.never_mind"]);
        return;
      }
      var result = combineItems(armedItem, id);
      armedItem = null;
      updateStatus();
      renderInventory();
      setOutput(result !== null ? result : FALLBACK.useItem);
      return;
    }
    // take / fiddle on an inventory item: not really meaningful, use fallback
    setOutput(currentVerb === "take" ? FALLBACK.take : FALLBACK.fiddle);
  }

  function handleAction(fn) {
    var text = fn();
    updateStatus();
    renderInventory();
    setOutput(text);
  }

  renderInventory();
  updateStatus();
  sceneFrame.style.cursor = VERB_CURSORS.notice;
  setOutput(TEXTS["output.intro"]);
})();

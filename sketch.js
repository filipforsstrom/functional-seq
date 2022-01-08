const sampleRate = 512;
let voiceNum = 1;
let activeVoice = 0;
let voices;
let func;
let pitchFunc = [];
let velFunc = [];
let notes = [];
let midiOut = [];
let midiChannel = [];
let sequencer;
let globalScale = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
let globalScaleStep = [];
const synth = new Tone.PolySynth(Tone.Synth, {
  envelope: {
    attack: 0.01,
    decay: 3.5,
    sustain: 0.0,
    release: 0.8,
  },
  oscillator: { type: "sine" },
}).toDestination();
const allWaveforms = [
  "sine",
  "saw",
  "sawdown",
  "phasor",
  "square",
  "rect",
  "pulse",
  "tri",
  "buzz",
];

let midiPromise = new Promise(function (resolve, reject) {
  WebMidi.enable()
    .then(() => console.log("WebMidi enabled!"))
    .catch((err) => alert(err));
  setTimeout(resolve, 500);
});

async function setup() {
  createCanvas(windowWidth * 0.8, windowHeight * 0.85);
  sequencer = new Sequencer();
  func = new Func();

  //default voice
  notes[0] = new Notes(
    0,
    func.generate("sine"),
    func.generate("sine"),
    "sine",
    "sine"
  );

  await midiPromise;
  addMidiDevice();
  addGlobalScale();
  addWaveforms();
  addVoiceToControlPanel();
  addEvenListener();
  sequencer.generateFunc();
  editVoice();
  //createButtons();
}

function addMidiDevice() {
  let midiOutSel = document.getElementById("midiOutDevice");

  // // Inputs
  // WebMidi.inputs.forEach((input) =>
  //   console.log(input.manufacturer, input.name)
  // );

  // Outputs
  WebMidi.outputs.forEach((output) => {
    let device = document.createElement("option");
    device.text = output.name;
    midiOutSel.add(device);
  });
}

function addGlobalScale() {
  for (let i = 0; i < globalScale.length; i++) {
    globalScaleStep[i] = document.getElementById("globalScaleStep" + i);
    if (globalScale[i]) {
      globalScaleStep[i].checked = true;
    }
  }
}

function addWaveforms() {
  let addPitchSel = document.getElementById("addPitchWave");
  let addVelSel = document.getElementById("addVelWave");
  let currentPitchSel = document.getElementById("currentPitchWave");
  let currentVelSel = document.getElementById("currentVelWave");

  for (let i = 0; i < allWaveforms.length; i++) {
    let waveform = document.createElement("option");
    waveform.text = allWaveforms[i];
    addPitchSel.add(waveform);
  }
  for (let i = 0; i < allWaveforms.length; i++) {
    let waveform = document.createElement("option");
    waveform.text = allWaveforms[i];
    addVelSel.add(waveform);
  }
  for (let i = 0; i < allWaveforms.length; i++) {
    let waveform = document.createElement("option");
    waveform.text = allWaveforms[i];
    currentPitchSel.add(waveform);
  }
  for (let i = 0; i < allWaveforms.length; i++) {
    let waveform = document.createElement("option");
    waveform.text = allWaveforms[i];
    currentVelSel.add(waveform);
  }
}

function addVoiceToControlPanel() {
  let voiceSelector = document.getElementById("voiceSelector");

  let voice = document.createElement("option");
  voice.text = voiceNum - 1;
  voiceSelector.add(voice);
}

function addEvenListener() {
  // active voice
  voiceSelector.addEventListener("change", function () {
    let voice = document.getElementById("voiceSelector");
    activeVoice = parseInt(voice.value);
    // console.log(activeVoice);
    editVoice();
  });

  // global scale
  for (let i = 0; i < globalScaleStep.length; i++) {
    globalScaleStep[i].addEventListener("change", function () {
      globalScale[i] = globalScaleStep[i].checked;
      console.log(globalScale);
    });
  }
}

function editVoice() {
  let speed = document.getElementById("speed");
  let lowestPitch = document.getElementById("lowestPitch");
  let highestPitch = document.getElementById("highestPitch");
  let lowestVel = document.getElementById("lowestVel");
  let highestVel = document.getElementById("highestVel");
  let currentPitchWave = document.getElementById("currentPitchWave");
  let currentVelWave = document.getElementById("currentVelWave");
  let scaleSteps = [];

  // set value
  let speedSlider = map(notes[activeVoice].playbackRate, 0, 1.99, 0, 100);
  // speed.value = notes[activeVoice].playbackRate;
  speed.value = speedSlider;
  lowestPitch.value = notes[activeVoice].lowerPitchLimit;
  highestPitch.value = notes[activeVoice].upperPitchLimit;
  lowestVel.value = notes[activeVoice].lowerVelLimit;
  highestVel.value = notes[activeVoice].upperVelLimit;
  currentPitchWave.value = notes[activeVoice].pitchWaveform;
  currentVelWave.value = notes[activeVoice].velWaveform;
  for (let i = 0; i < notes[activeVoice].scale.length; i++) {
    scaleSteps[i] = document.getElementById("scaleStep" + i);
    scaleSteps[i].checked = notes[activeVoice].scale[i];
  }

  // change value
  speed.addEventListener("change", function () {
    // notes[activeVoice].playbackRate = (speed.value / 100) * 2;
    let exp = 1.9;
    let x = Math.pow(speed.value, exp);
    let rate = map(x, 0, 6309, 0, 1.99);
    console.log(x);
    console.log(rate);
    notes[activeVoice].playbackRate = rate;
  });
  lowestPitch.addEventListener("change", function () {
    notes[activeVoice].lowerPitchLimit = parseInt(lowestPitch.value);
    notes[activeVoice].change();
  });
  highestPitch.addEventListener("change", function () {
    notes[activeVoice].upperPitchLimit = parseInt(highestPitch.value);
    notes[activeVoice].change();
  });
  lowestVel.addEventListener("change", function () {
    notes[activeVoice].lowerVelLimit = parseInt(lowestVel.value);
    notes[activeVoice].change();
  });
  highestVel.addEventListener("change", function () {
    notes[activeVoice].upperVelLimit = parseInt(highestVel.value);
    notes[activeVoice].change();
  });
  currentPitchWave.addEventListener("change", function () {
    notes[activeVoice].pitchWaveform = currentPitchWave.value;
    notes[activeVoice].pitchFunc = func.generate(currentPitchWave.value);
    notes[activeVoice].change();
  });
  currentVelWave.addEventListener("change", function () {
    notes[activeVoice].velWaveform = currentVelWave.value;
    notes[activeVoice].velFunc = func.generate(currentVelWave.value);
    notes[activeVoice].change();
  });
  for (let i = 0; i < notes[activeVoice].scale.length; i++) {
    scaleSteps[i].addEventListener("change", function () {
      for (let i = 0; i < notes[activeVoice].scale.length; i++) {
        notes[activeVoice].scale[i] = scaleSteps[i].checked;
        notes[activeVoice].change();
        // console.log(notes[activeVoice].scale);
      }
    });
  }
}

async function draw() {
  await midiPromise;
  background(50);
  sequencer.display(mouseX, mouseY);
  sequencer.run();
}

function globalSettings() {
  let onOff = document.getElementById("onOff");
  if (onOff.checked == true) {
    console.log("check");
  }
}

function createButtons() {
  onOffBox = createCheckbox("on/off", false);
  onOffBox.changed(toggleState);

  selPitchFunc = createSelect();
  for (let i = 0; i < allWaveforms.length; i++) {
    selPitchFunc.option(allWaveforms[i]);
  }
  selVelFunc = createSelect();
  for (let i = 0; i < allWaveforms.length; i++) {
    selVelFunc.option(allWaveforms[i]);
  }

  addButton = createButton("add");
  addButton.mousePressed(() => {
    addVoice(selPitchFunc.value(), selVelFunc.value());
  });
}

// toggle start
document.getElementById("onOffSwitch").addEventListener("click", () => {
  if (document.getElementById("onOffSwitch").checked) {
    toggleState(true);
  } else {
    toggleState(false);
  }
});

function toggleState(state) {
  if (state) {
    console.log("on");
    let midiOutSel = document.getElementById("midiOutDevice");
    for (let i = 0; i < voiceNum; i++) {
      midiOut[i] = WebMidi.getOutputByName(midiOutSel.value);
      midiChannel[i] = midiOut[i].channels[1];
    }
    Tone.start();
    sequencer.start();
    Tone.Transport.start();
  } else {
    console.log("off");
    sequencer.stop();
    Tone.Transport.stop();
  }
}

function start() {
  //console.log("on");
  let midiOutSel = document.getElementById("midiOutDevice");
  for (let i = 0; i < voiceNum; i++) {
    midiOut[i] = WebMidi.getOutputByName(midiOutSel.value);
    midiChannel[i] = midiOut[i].channels[1];
    sequencer.start();
  }
  Tone.Transport.start();
}

// add voice
document.getElementById("addVoiceBtn").addEventListener("click", function () {
  let addPitchWave = document.getElementById("addPitchWave");
  let pitchWave = addPitchWave.value;
  let addVelWave = document.getElementById("addVelWave");
  let velWave = addVelWave.value;
  addVoice(pitchWave, velWave);
});

function addVoice(pitchWaveform, velWaveform) {
  let i = voiceNum;
  notes[i] = new Notes(
    i,
    func.generate(pitchWaveform),
    func.generate(velWaveform),
    pitchWaveform,
    velWaveform
  );
  voiceNum++;
  sequencer.addVoice();
  addVoiceToControlPanel();
  if (document.getElementById("onOffSwitch").checked) {
    start();
  }
}

function mousePressed() {
  sequencer.pressed(mouseX, mouseY);
}

function mouseReleased() {
  sequencer.notPressed();
}
function windowResized() {
  resizeCanvas(windowWidth * 0.8, windowHeight * 0.95);
}

function play(i) {
  let internalSynth = document.getElementById("onOffSynth");
  let pitch = notes[i].getPitch();
  // console.log(pitch % 12);
  let scalePosition = pitch % 12;
  let vel = notes[i].getVel();
  //console.table({ pitch, vel });
  if (globalScale[scalePosition]) {
    // console.log(pitch);
    midiChannel[i].playNote(pitch, { rawAttack: vel });
    midiChannel[i].stopNote(pitch, { time: "+1" });
    if (internalSynth.checked === true) {
      let freq = Tone.mtof(pitch);
      let amp = map(vel, 0, 127, 0.0, 0.2);
      synth.triggerAttackRelease(freq, "+0.0", "+0.0", amp);
    }
  }
  notes[i].cycle();
}

// change tempo
document.getElementById("tempo").addEventListener("change", function () {
  let tempoSlider = document.getElementById("tempo");
  sequencer.changeTempo(tempoSlider.value);
});

class Sequencer {
  constructor() {
    this.running = false;
    this.tempo = 4;
    this.playheadPos = new createVector(0, height);
    this.playheadWidth = 1;
    this.batonPos = new createVector(this.playheadPos.x, height * 0.9);
    this.batonSize = 20;
    this.batonDrag = false;
    // note
    this.noteDrag = [];
    this.noteNum = 1;
    this.noteMinSize = 5;
    this.notes = [];
    this.noteSize = [];
    this.noteSizeOffset = [];
    this.noteXpos = [];
    this.noteXoffset = [];
    this.notePlay = [];
    this.noteDistance = [];
    this.pitchFunc = [];
    this.pitchFuncX = [[]];
    this.velFunc = [];
    this.velFuncX = [[]];
    // setup
    this.create = this.setup();
  }
  display(px, py) {
    stroke(0);
    strokeWeight(1);
    strokeCap(SQUARE);
    // playhead
    if (this.batonDrag) {
      this.playheadPos.x = px;
    }
    if (this.playheadPos.x < 0) {
      this.playheadPos.x = 0;
    }
    if (this.playheadPos.x > width) {
      this.playheadPos.x = width;
    }
    rect(this.playheadPos.x, 0, this.playheadWidth, this.playheadPos.y);
    line(0, this.batonPos.y, width, this.batonPos.y);
    rect(
      this.playheadPos.x - this.batonSize / 2,
      this.batonPos.y,
      this.batonSize,
      height
    );

    // notes
    for (let i = 0; i < this.noteNum; i++) {
      if (this.noteDrag[i]) {
        this.noteXpos[i] = px + this.noteXoffset[i];
        if (this.noteXpos[i] < 0) {
          this.noteXpos[i] = 0;
        }
        if (this.noteXpos[i] > width) {
          this.noteXpos[i] = width - this.noteMinSize;
        }
        this.noteSize[i] = py + this.noteSizeOffset[i];
        if (this.noteSize[i] < this.noteMinSize) {
          this.noteSize[i] = this.noteMinSize;
        }
      }
      line(0, this.notes[i].y, width, this.notes[i].y);
      rect(
        this.noteXpos[i],
        this.notes[i].y,
        this.noteSize[i],
        this.notes[i].x
      );
      //console.log(this.notes[i].x);
    }

    // func

    for (let i = 0; i < this.noteNum; i++) {
      this.pitchFuncX[i] = [i];
      this.velFuncX[i] = [i];
      //console.log(this.pitchFuncX[i])
      for (let j = 0; j < this.pitchFunc[i].length; j++) {
        this.pitchFuncX[i][j] = map(
          j,
          0,
          this.pitchFunc[i].length,
          0,
          this.noteSize[i]
        );
        if (notes[i].positionPitch == j) {
          strokeWeight(4);
          stroke(255, 0, 255);
        } else {
          strokeWeight(1);
          stroke(0);
        }
        line(
          this.pitchFuncX[i][j] + this.noteXpos[i],
          this.pitchFunc[i][j] + this.notes[i].y,
          this.pitchFuncX[i][j] + this.noteXpos[i],
          this.notes[i].y
        );
      }
      // let velFuncYoffset = this.notes[i].x / 2;
      // for (let j = 0; j < this.velFunc[i].length; j++) {
      //   this.velFuncX[i][j] = map(
      //     j,
      //     0,
      //     this.velFunc[i].length,
      //     0,
      //     this.noteSize[i]
      //   );
      //   if (notes[i].positionVel == j) {
      //     strokeWeight(4);
      //     stroke(255, 0, 255);
      //   } else {
      //     strokeWeight(1);
      //     stroke(0);
      //   }
      //   line(
      //     this.velFuncX[i][j] + this.noteXpos[i],
      //     this.velFunc[i][j] + this.notes[i].y + velFuncYoffset,
      //     this.velFuncX[i][j] + this.noteXpos[i],
      //     this.notes[i].x
      //   );
      // }
    }
  }
  generateFunc() {
    for (let i = 0; i < this.noteNum; i++) {
      this.pitchFunc[i] = [...notes[i].pitches];
      this.velFunc[i] = [...notes[i].vels];
      // console.table(this.pitchFunc[i].length);
      for (let j = 0; j < this.pitchFunc[i].length; j++) {
        this.pitchFunc[i][j] = map(
          this.pitchFunc[i][j],
          127,
          0,
          0,
          this.notes[i].x
        );
      }
      for (let j = 0; j < this.velFunc[i].length; j++) {
        this.velFunc[i][j] = map(
          this.velFunc[i][j],
          127,
          0,
          0,
          this.notes[i].x
        );
      }
    }
  }
  setup() {
    let yPos = height / this.noteNum;
    yPos *= 0.9;
    for (let i = 0; i < this.noteNum; i++) {
      this.notes[i] = new createVector(yPos, yPos * i);
      // this.noteSize[i] = random(this.noteMinSize, 50);
      // this.noteXpos[i] = random(0, width);
      this.noteSize[i] = width;
      this.noteXpos[i] = 0;
    }
  }
  start() {
    this.playheadPos.x = 0;
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  run() {
    if (this.running == true) {
      if (this.running == true) {
        this.playheadPos.x += this.tempo;
      }
      if (this.playheadPos.x > width) {
        this.playheadPos.x = 0;
      }
      for (let i = 0; i < this.noteNum; i++) {
        if (
          this.playheadPos.x > this.noteXpos[i] &&
          this.playheadPos.x < this.noteXpos[i] + this.noteSize[i]
        ) {
          notes[i].loop(true);
        } else {
          notes[i].loop(false);
        }
      }
    }
  }
  changeTempo(tempo) {
    this.tempo = parseInt(tempo);
  }
  addVoice() {
    this.noteNum++;
    let yPos = height / this.noteNum;
    yPos *= 0.9;
    for (let i = 0; i < this.noteNum; i++) {
      this.notes[i] = new createVector(yPos, yPos * i);
    }
    this.noteSize.push(random(this.noteMinSize, 50));
    this.noteXpos.push(random(0, width));
    this.generateFunc();
  }
  pressed(px, py) {
    if (py > this.batonPos.y && py < height && px > 0 && px < width) {
      this.batonDrag = true;
    }

    for (let i = 0; i < this.noteNum; i++) {
      if (
        py > this.notes[i].y &&
        py < this.notes[i].y + this.notes[i].x &&
        px > 0 &&
        px < width
      ) {
        this.noteDrag[i] = true;
        let voiceSelector = document.getElementById("voiceSelector");
        activeVoice = i;
        voiceSelector.value = activeVoice;
        editVoice();

        // console.log(i);
        this.noteXoffset[i] = this.noteXpos[i] - px;
        this.noteSizeOffset[i] = this.noteSize[i] - py;
      }
    }
  }
  notPressed() {
    this.batonDrag = false;

    for (let i = 0; i < this.noteNum; i++) {
      this.noteDrag[i] = false;
    }
  }
}

class Func {
  constructor() {
    this.gen = new p5.Gen();
    this.func = [];
    this.sampleRate = sampleRate;
    this.allWaveforms = [
      "sine",
      "saw",
      "sawdown",
      "phasor",
      "square",
      "rect",
      "pulse",
      "tri",
      "buzz",
    ];
  }
  generate(waveform) {
    this.func = this.gen.fillArray("waveform", this.sampleRate, waveform);
    return this.func;
    //console.log(this.func);
    //fplot(this.func);
  }
}

class Notes {
  constructor(number, pitchFunc, velFunc, pitchWaveform, velWaveform) {
    this.number = number;
    this.sampleRate = sampleRate;
    this.scale = [...globalScale];
    // pitch
    this.pitchFunc = pitchFunc;
    this.pitchWaveform = pitchWaveform;
    this.pitches = [];
    this.upperPitchLimit = 100;
    this.lowerPitchLimit = 40;
    this.positionPitch = 0;
    // vel
    this.velFunc = velFunc;
    this.velWaveform = velWaveform;
    this.vels = [];
    this.upperVelLimit = 127;
    this.lowerVelLimit = 30;
    this.positionVel = 0;
    // lfo
    this.speed = 0.0014;
    this.playbackRate = 0.5;
    this.lfo = new Tone.Loop(() => {
      play(this.number);
    }, this.speed);
    // setup
    this.create = this.generateNotesArray();
    this.loading = false;
  }
  generateNotesArray() {
    this.loading = true;
    this.pitches.length = 0;
    this.vels.length = 0;
    let tempPitches = [];
    let tempVels = [];
    for (let i = 0; i < this.sampleRate; i++) {
      tempPitches.push(
        int(
          map(
            this.pitchFunc[i],
            -1,
            1,
            this.lowerPitchLimit,
            this.upperPitchLimit
          )
        )
      );
      tempVels.push(
        int(map(this.velFunc[i], -1, 1, this.lowerVelLimit, this.upperVelLimit))
      );
    }
    // console.log([this.pitches.length]);
    for (let i = 0; i < this.sampleRate; i++) {
      let scalePosition = tempPitches[i] % 12;
      if (tempPitches[i] != tempPitches[i - 1] && this.scale[scalePosition]) {
        this.pitches.push(tempPitches[i]);
      }
    }
    for (let i = 0; i < this.sampleRate; i++) {
      if (tempVels[i] != tempVels[i - 1]) {
        this.vels.push(tempVels[i]);
      }
    }
    // console.table([
    //   tempPitches.length,
    //   this.pitches.length,
    //   tempVels.length,
    //   this.vels.length,
    // ]);
    this.loading = false;
  }
  change() {
    this.loading = true;
    // this.pitchFunc = pitchFunc;
    // this.velFunc = velFunc;
    // this.lowerPitchLimit = pitchLow;
    // this.upperPitchLimit = pitchHigh;
    // this.lowerVelLimit = velLow;
    // this.upperVelLimit = velHigh;
    this.generateNotesArray();
    sequencer.generateFunc();
    this.positionPitch = 0;
    this.positionVel = 0;
    this.loading = false;
  }
  cycle() {
    if (this.loading === false) {
      this.positionPitch++;
      this.positionVel++;
      if (this.positionPitch > this.pitches.length - 1) {
        this.positionPitch = 0;
      }
      if (this.positionVel > this.vels.length - 1) {
        this.positionVel = 0;
      }
    }
  }
  getPitch() {
    // console.log(this.pitches);
    return this.pitches[this.positionPitch];
  }
  getVel() {
    // console.log(this.vels);
    return this.vels[this.positionVel];
  }
  loop(start) {
    if (start) {
      this.lfo.playbackRate = this.playbackRate;
      this.lfo.start(0);
    } else {
      this.lfo.stop();
    }
  }
  loopPlaybackRate(rate) {
    this.lfo.playbackRate = rate;
  }
}

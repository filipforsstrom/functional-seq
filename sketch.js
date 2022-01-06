const sampleRate = 512;
let voiceNum = 1;
let voices;
let func;
let pitchFunc = [];
let pitchfunc;
let velFunc = [];
let notes = [];
let midiOut = [];
let midiChannel = [];
//let speed = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
let mode = 0;
let cycleArray = [];
let sequencer;
let distance = [];
const scales = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
//const synth = new Tone.Synth().toDestination();
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "pulse",
  },
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
  let i = voiceNum - 1;
  notes[i] = new Notes(i, func.generate("sine"), func.generate("sine"));

  await midiPromise;
  addMidiDevice();
  addWaveforms();
  addVoiceToControlPanel();

  sequencer.generateFunc();
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

function addWaveforms() {
  let addPitchSel = document.getElementById("addPitchWave");
  let addVelSel = document.getElementById("addVelWave");
  let changePitchSel = document.getElementById("changePitchWave");
  let changeVelSel = document.getElementById("changeVelWave");

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
    changePitchSel.add(waveform);
  }
  for (let i = 0; i < allWaveforms.length; i++) {
    let waveform = document.createElement("option");
    waveform.text = allWaveforms[i];
    changeVelSel.add(waveform);
  }
}

function addVoiceToControlPanel() {
  let voiceSelector = document.getElementById("voiceSelector");

  let voice = document.createElement("option");
  voice.text = voiceNum;
  voiceSelector.add(voice);
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
    Tone.start();
    for (let i = 0; i < voiceNum; i++) {
      midiOut[i] = WebMidi.getOutputByName("IAC Driver Bus 1");
      midiChannel[i] = midiOut[i].channels[1];
    }
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
  for (let i = 0; i < voiceNum; i++) {
    midiOut[i] = WebMidi.getOutputByName("IAC Driver Bus 1");
    midiChannel[i] = midiOut[i].channels[1];
    //cycleArray[i].start(0);
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
  console.log(pitchWave);
  addVoice(pitchWave, velWave);
});

function addVoice(pitchWaveform, velWaveform) {
  let i = voiceNum;
  notes[i] = new Notes(
    i,
    func.generate(pitchWaveform),
    func.generate(velWaveform)
  );
  voiceNum++;
  sequencer.addVoice();
  addVoiceToControlPanel();
  start();
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
  let pitch = notes[i].getPitch();
  //console.log(pitch % 12);
  let scalePosition = pitch % 12;
  let vel = notes[i].getVel();
  //console.table({ pitch, vel });
  if (scales[scalePosition]) {
    console.log(pitch);
    midiChannel[i].playNote(pitch, { rawAttack: vel });
    midiChannel[i].stopNote(pitch, { time: "+1" });
    let freq = Tone.mtof(pitch);
    let amp = map(vel, 0, 127, 0.0, 0.5);
    //synth.triggerAttackRelease(freq, "+0.5", "+0.0", amp);
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
    this.noteFunc = [];
    this.noteFuncX = [[]];
    this.noteFuncYoffset;
    // setup
    this.create = this.setup();
  }
  display(px, py) {
    strokeWeight(1);
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
    strokeWeight(2);
    this.noteFuncYoffset = this.notes[0].x / 2;

    for (let i = 0; i < this.noteNum; i++) {
      this.noteFuncX[i] = [i];
      //console.log(this.noteFuncX[i])
      for (let j = 0; j < this.noteFunc[i].length; j++) {
        this.noteFuncX[i][j] = map(
          j,
          0,
          this.noteFunc[i].length,
          0,
          this.noteSize[i]
        );
        if (notes[i].positionPitch == j) {
          strokeWeight(20);
        } else {
          strokeWeight(2);
        }
        point(
          this.noteFuncX[i][j] + this.noteXpos[i],
          this.noteFunc[i][j] + this.notes[i].y
        );
      }
    }
  }
  generateFunc() {
    for (let i = 0; i < this.noteNum; i++) {
      this.noteFunc[i] = [...notes[i].pitches];
      // console.table(this.noteFunc[i].length);
      for (let j = 0; j < this.noteFunc[i].length; j++) {
        this.noteFunc[i][j] = map(
          this.noteFunc[i][j],
          127,
          0,
          0,
          this.notes[i].x
        );
      }
      // console.table(this.noteFunc[i]);
    }
  }
  setup() {
    let yPos = height / this.noteNum;
    yPos *= 0.9;
    for (let i = 0; i < this.noteNum; i++) {
      this.notes[i] = new createVector(yPos, yPos * i);
      this.noteSize[i] = random(this.noteMinSize, 50);
      this.noteXpos[i] = random(0, width);
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
  constructor(number, pitchFunc, velFunc) {
    this.number = number;
    this.sampleRate = sampleRate;
    // pitch
    this.scales = scales;
    this.positionScale = 0;
    this.pitchFunc = pitchFunc;
    this.pitches = [];
    this.upperPitchLimit = 100;
    this.lowerPitchLimit = 40;
    this.positionPitch = 0;
    // vel
    this.velFunc = velFunc;
    this.vels = [];
    this.upperVelLimit = 127;
    this.lowerVelLimit = 30;
    this.positionVel = 0;
    // lfo
    this.speed = 0.05;
    this.lfo = new Tone.Loop(() => {
      play(this.number);
    }, this.speed);
    // setup
    this.create = this.generateNotesArray();
  }
  generateNotesArray() {
    console.log([this.pitches.length]);
    // this.pitches.length = 0;
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

      if (this.positionScale > this.scales.length) {
        this.positionScale = 0;
      }
      tempVels.push(
        int(map(this.velFunc[i], -1, 1, this.lowerVelLimit, this.upperVelLimit))
      );
    }
    console.log([this.pitches.length]);
    for (let i = 0; i < this.sampleRate; i++) {
      if (tempPitches[i] != tempPitches[i - 1]) {
        this.pitches.push(tempPitches[i]);
      }
    }
    for (let i = 0; i < this.sampleRate; i++) {
      if (tempVels[i] != tempVels[i - 1]) {
        this.vels.push(tempVels[i]);
      }
    }
    console.table([
      tempPitches.length,
      this.pitches.length,
      tempVels.length,
      this.vels.length,
    ]);
  }
  change(pitchFunc, velFunc, pitchLow, pitchHigh, velLow, velHigh) {
    this.pitchFunc = pitchFunc;
    this.velFunc = velFunc;
    this.lowerPitchLimit = pitchLow;
    this.upperPitchLimit = pitchHigh;
    this.lowerVelLimit = velLow;
    this.upperVelLimit = velHigh;
    this.generateNotesArray();
  }
  cycle() {
    this.positionPitch++;
    this.positionVel++;
    if (this.positionPitch > this.pitches.length - 1) {
      this.positionPitch = 0;
    }
    if (this.positionVel > this.vels.length - 1) {
      this.positionVel = 0;
    }
  }
  getPitch() {
    return this.pitches[this.positionPitch];
  }
  getVel() {
    return this.vels[this.positionVel];
  }
  loop(start) {
    if (start) {
      this.lfo.start(0);
    } else {
      this.lfo.stop();
    }
  }
  get vPosition() {
    return this.position;
  }
  get positionY() {
    return this.position.y;
  }
}

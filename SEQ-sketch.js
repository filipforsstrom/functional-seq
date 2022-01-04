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
let speed = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
let update = false;
let mode = 0;
let cycleArray = [];
let sequencer;
let distance = [];
const scales = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
// UI
let onOffBox;
let selPitchFunc, selVelFunc;
let addButton;
let allWaveforms = [
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
  createCanvas(windowWidth, 800);
  sequencer = new Sequencer();
  func = new Func();

  //default voice
  let i = voiceNum - 1;
  notes[i] = new Notes(
    i,
    func.generate("sine"),
    func.generate("sine"),
    random(width / 4, width / 2),
    random(height / 4, height / 2)
  );

  await midiPromise;
  createButtons();
}

async function draw() {
  await midiPromise;
  background(0);
  sequencer.display(mouseX, mouseY);
  sequencer.run();
  for (let i = 0; i < voiceNum; i++) {
    notes[i].display(mouseX, mouseY);
    distance[i] = dist(sequencer.playheadPosition.x, 0, notes[i].position.x, 0);
    notes[i].checkPlayed(distance[i]);
    if (update === true) {
      speed[i] = map(notes[i].positionY, 0, width, 0.0001, 30.0);
    }
  }
  for (let i = 0; i < voiceNum; i++) {
    sequencer.keysDistance(i, distance);
    //console.log(distance[i]);
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
function logga(val1, val2) {
  console.log(val1, val2);
}

function toggleState() {
  if (this.checked()) {
    console.log("on");
    for (let i = 0; i < voiceNum; i++) {
      midiOut[i] = WebMidi.getOutputByName("IAC Driver Bus 1");
      midiChannel[i] = midiOut[i].channels[1];
      //cycleArray[i].start(0);
      sequencer.start();
    }
    Tone.Transport.start();
  } else {
    console.log("off");
    for (let i = 0; i < voiceNum; i++) {
      //cycleArray[i].stop(0);
      sequencer.stop();
    }
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

function addVoice(pitchWaveform, velWaveform) {
  let i = voiceNum;
  console.log(i);
  notes[i] = new Notes(
    i,
    func.generate(pitchWaveform),
    func.generate(velWaveform),
    random(width / 4, width / 2),
    random(height / 4, height / 2)
  );
  notes[i].generateNotesArray();
  voiceNum++;
  start();
}

function mousePressed() {
  for (let i = 0; i < voiceNum; i++) {
    sequencer.pressed(mouseX, mouseY);
    notes[i].pressed(mouseX, mouseY);
  }
  update = true;
}

function mouseReleased() {
  for (let i = 0; i < voiceNum; i++) {
    sequencer.notPressed();
    notes[i].notPressed();
  }
  update = false;
}

function play(i) {
  let pitch = notes[i].getPitch();
  console.log(pitch % 12);
  let scalePosition = pitch % 12;
  let vel = notes[i].getVel();
  //console.table({ pitch, vel });
  if (scales[scalePosition]) {
    midiChannel[i].playNote(pitch, { rawAttack: vel });
    midiChannel[i].stopNote(pitch, { time: "+1" });
  }
  notes[i].cycle();
}

class Sequencer {
  constructor() {
    this.running = false;
    this.tempo = 4;
    this.playheadPosition = new createVector(0, height);
    this.playheadWidth = 1;
    this.needlePosition = new createVector(
      this.playheadPosition.x,
      height * 0.9
    );
    this.needleSize = 20;
    this.needleOffset = new createVector();
    this.needleDragging = false;
    this.laneNum = 1;
    this.lanes = [new createVector(0, height / 2)];
    this.notes = [new createVector(100, this.lanes[0].y)]
  }
  display(px, py) {
    // playhead
    if (this.needleDragging) {
      this.playheadPosition.x = px;
    }
    rect(
      this.playheadPosition.x,
      0,
      this.playheadWidth,
      this.playheadPosition.y
    );
    line(0, this.needlePosition.y, width, this.needlePosition.y);
    rect(
      this.playheadPosition.x - this.needleSize / 2,
      this.needlePosition.y,
      this.needleSize,
      height
    );

    // lanes
    for (let i = 0; i < this.laneNum; i++) {
      line(this.lanes[i].x, this.lanes[i].y, width, this.lanes[i].y);
      rect(this.notes[i].x, this.notes[i].y, 100, 100);
    }
  }
  run() {
    if (this.running == true) {
      this.playheadPosition.x += this.tempo;
      if (distance < this.playheadWidth + this.keyDiameter) {
        this.keyOn();
      } else {
        this.keyOff();
      }
    }
    if (this.playheadPosition.x > width) {
      this.playheadPosition.x = 0;
    }
  }
  start() {
    this.playheadPosition.x = 0;
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  keysDistance(i, distanceArray) {
    for (let i = 0; i < voiceNum; i++) {
      //console.log(distanceArray[i]);
    }
  }
  keyOn() {
    //console.log("key " + this.key + " on");
  }
  keyOff() {
    //console.log("key " + this.key + " off");
  }
  pressed(px, py) {
    if (py > this.needlePosition.y) {
      this.needleDragging = true;
      //this.needleOffset.y = this.needlePosition.y - py;
    }
  }
  notPressed() {
    this.needleDragging = false;
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
  constructor(number, pitchFunc, velFunc, x, y) {
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
    this.speed = 0.005;
    this.lfo = new Tone.Loop(() => {
      play(this.number);
    }, this.speed);
    // graphics
    this.create = this.generateNotesArray();
    this.position = new createVector(x, y);
    this.pOffset = new createVector();
    this.width = 40;
    this.dragging = false;
  }
  generateNotesArray() {
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
    // console.table([
    //   tempPitches.length,
    //   this.pitches.length,
    //   tempVels.length,
    //   this.vels.length,
    // ]);
    return this.pitches;
  }
  changeFunc(pitchFunc, velFunc) {
    this.pitchFunc = pitchFunc;
    this.velFunc = velFunc;
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
  //display
  display(px, py) {
    stroke(255);
    if (this.dragging) {
      this.position.x = px + this.pOffset.x;
      this.position.y = py + this.pOffset.y;
    }
    if (this.position.y < 0) {
      this.position.y = 0;
    }
    if (this.position.x < 0) {
      this.position.x = 0;
    }
    if (this.position.y > sequencer.needlePosition.y) {
      this.position.y = sequencer.needlePosition.y;
    }
    if (this.position.x > width) {
      this.position.x = width;
    }
    ellipse(this.position.x, this.position.y, this.width, this.width);
    textAlign(CENTER);
    text(this.number, this.position.x, this.position.y);
  }
  checkPlayed(distance) {
    if (distance < this.width) {
      this.lfo.start(0);
      //console.log("play: " + this.number);
    } else {
      this.lfo.stop();
    }
  }
  pressed(px, py) {
    if (
      dist(this.position.x, this.position.y, mouseX, mouseY) <
      this.width / 2
    ) {
      this.dragging = true;
      this.offsetX = this.position.x - px;
      this.offsetY = this.position.y - py;
    }
  }
  notPressed() {
    this.dragging = false;
  }
  get vPosition() {
    return this.position;
  }
  get positionY() {
    return this.position.y;
  }
}

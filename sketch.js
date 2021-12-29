const sampleRate = 512;
const voiceNum = 1;
let voices;
let pitchFunc = [];
let velFunc = [];
let notes = [];
let midiOut = [];
let midiChannel = [];
let speed = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
let update = false;
let mode = 0;
let cycle = [];

let gui;

function preload() {
  // MIDI
  //-----------------------------------------------
  WebMidi.enable()
    .then(onEnabled)
    .catch((err) => alert(err));

  function onEnabled() {
    // Inputs
    WebMidi.inputs.forEach((input) =>
      console.log(input.manufacturer, input.name)
    );
    // Outputs
    WebMidi.outputs.forEach((output) =>
      console.log(output.manufacturer, output.name)
    );
  }
  //-----------------------------------------------
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  gui = new guify({
    title: "Func-SEQ",
    theme: "light", // dark, light, yorha, or theme object
    align: "right", // left, right
    width: 300,
    barMode: "above", // none, overlay, above, offset
    panelMode: "inner",
    opacity: 0.95,
    open: true,
  });
  gui.Register([
    {
      type: "checkbox",
      label: "Start",
      onChange: (value) => {
        toggleState(value);
      },
    },
  ]);

  for (let i = 0; i < voiceNum; i++) {
    cycle[i] = new Tone.Loop(() => {
      play(i);
    }, speed[i]);
    pitchFunc[i] = new Func();
    velFunc[i] = new Func();
    notes[i] = new Notes(
      i,
      pitchFunc[i].generate("sine"),
      velFunc[i].generate("square"),
      random(width / 4, width / 2),
      random(height / 4, height / 2)
    );
    notes[i].generateNotesArray();
  }
}

function draw() {
  background(0);
  for (let i = 0; i < voiceNum; i++) {
    notes[i].display(mouseX, mouseY);
    if (update === true) {
      speed[i] = map(notes[i].positionY, 0, width, 0.0001, 30.0);
      cycle[i].set({ playbackRate: speed[i] });
    }
  }
}

function toggleState(toggle) {
  if (toggle) {
    console.log("on");
    for (let i = 0; i < voiceNum; i++) {
      midiOut[i] = WebMidi.getOutputByName("IAC Driver Bus 1");
      midiChannel[i] = midiOut[i].channels[1];
      cycle[i].start(0);
    }
    Tone.Transport.start();
  } else if (toggle === false) {
    console.log("off");
    for (let i = 0; i < voiceNum; i++) {
      cycle[i].stop(0);
    }
    Tone.Transport.stop();
  }
}

function mousePressed() {
  for (let i = 0; i < voiceNum; i++) {
    notes[i].pressed(mouseX, mouseY);
  }
  update = true;
}

function mouseReleased() {
  for (let i = 0; i < voiceNum; i++) {
    notes[i].notPressed();
  }
  update = false;
}

function play(i) {
  let pitch = notes[i].getPitch();
  let vel = notes[i].getVel();
  //console.table({ pitch, vel });
  midiChannel[i].playNote(pitch, { rawAttack: vel });
  midiChannel[i].stopNote(pitch, { time: "+1" });
  notes[i].cycle();
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
    this.pitchFunc = pitchFunc;
    this.pitch;
    this.pitches = [];
    this.tempPitches = [];
    this.upperPitchLimit = 100;
    this.lowerPitchLimit = 40;
    this.positionPitch = 0;
    //vel
    this.velFunc = velFunc;
    this.vel;
    this.vels = [];
    this.tempVels = [];
    this.upperVelLimit = 127;
    this.lowerVelLimit = 30;
    this.positionVel = 0;
    this.speed = 0.1;
    // this.cycleEvent = new Tone.Loop(() => {
    //   this.cycle();
    // }, this.speed).start(0);
    //display
    this.position = new createVector(x, y);
    this.pOffset = new createVector();
    this.diameter = 20;
    this.dragging = false;
  }
  generateNotesArray() {
    for (let i = 0; i < this.sampleRate; i++) {
      this.tempPitches.push(
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
      this.tempVels.push(
        int(map(this.velFunc[i], -1, 1, this.lowerVelLimit, this.upperVelLimit))
      );
    }
    for (let i = 0; i < this.sampleRate; i++) {
      if (this.tempPitches[i] != this.tempPitches[i - 1]) {
        this.pitches.push(this.tempPitches[i]);
      }
    }
    for (let i = 0; i < this.sampleRate; i++) {
      if (this.tempVels[i] != this.tempVels[i - 1]) {
        this.vels.push(this.tempVels[i]);
      }
    }
    // console.table([
    //   this.tempPitches.length,
    //   this.pitches.length,
    //   this.tempVels.length,
    //   this.vels.length,
    // ]);
    return this.pitches;
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
    ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
    textAlign(CENTER);
    text(this.number, this.position.x, this.position.y);
  }
  pressed(px, py) {
    if (
      dist(this.position.x, this.position.y, mouseX, mouseY) <
      this.diameter / 2
    ) {
      this.dragging = true;
      this.offsetX = this.position.x - px;
      this.offsetY = this.position.y - py;
    }
  }
  notPressed() {
    this.dragging = false;
  }
  get positionX() {
    return this.position.x;
  }
  get positionY() {
    return this.position.y;
  }
}

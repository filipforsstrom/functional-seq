const sampleRate = 512;
let pitchFunc;
let velFunc;
let notes;
let midiIn;
let midiOut;

let mode = 0;

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

  pitchFunc = new Func(1);
  pitchFunc.generate();
  velFunc = new Func(0);
  velFunc.generate();
  notes = new Notes(
    pitchFunc.getFunc(),
    velFunc.getFunc(),
    width / 2,
    height / 2
  );
  notes.generateNotesArray();
}

function draw() {
  background(0);
  notes.display(mouseX, mouseY);
}

function mousePressed() {
  if (mode === 0) {
    midiIn = WebMidi.getInputByName("IAC Driver Bus 1");
    midiOut = WebMidi.getOutputByName("IAC Driver Bus 1");
    midiIn.addListener("noteon", (e) => {
      //console.log(e.note.identifier);
    });
    const playLoop = new Tone.Loop(() => {
      play();
    }, 0.1).start(0);
    Tone.Transport.start();
    mode = 1;
  }
  notes.pressed(mouseX, mouseY);
}

function mouseReleased() {
  notes.notPressed();
}

function play() {
  let channel = midiOut.channels[1];
  let pitch = notes.getPitch();
  let vel = notes.getVel();
  //console.table({ pitch, vel });
  channel.playNote(pitch, { rawAttack: vel });
  channel.stopNote(pitch, { time: "+1" });
}

class Func {
  constructor(waveform) {
    this.gen = new p5.Gen();
    this.func = [];
    this.selectWaveform = waveform;
    this.waveform = [
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
    this.sampleRate = sampleRate;
    this.note = [];
  }
  generate() {
    this.func = this.gen.fillArray(
      "waveform",
      this.sampleRate,
      this.waveform[this.selectWaveform]
    );
    //console.log(this.func);
    //fplot(this.func);
  }
  changeWaveform(x) {
    this.selectWaveform = x;
    //this.generate();
    console.log(this.selectWaveform);
  }
  get() {
    for (let i = 0; i < this.func.length; i++) {
      this.note.push(
        int(map(this.func[i], 1, -1, lowerNoteLimit, upperNoteLimit))
      );
    }
    //console.log(this.note);
    return this.note;
  }
  getFunc() {
    this.func = this.gen.fillArray(
      "waveform",
      this.sampleRate,
      this.waveform[this.selectWaveform]
    );
    return this.func;
  }
}

class Notes {
  constructor(pitchFunc, velFunc, x, y) {
    this.sampleRate = sampleRate;
    //midi
    //pitch
    this.pitchFunc = pitchFunc;
    this.pitch;
    this.pitches = [];
    this.tempPitches = [];
    this.upperPitchLimit = 110;
    this.lowerPitchLimit = 30;
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
    this.cycleEvent = new Tone.Loop(() => {
      this.cycle();
    }, this.speed).start(0);
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
    console.table(this.tempVels);
    console.table(this.vels);
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
    console.log(this.speed);
  }
  getPitch() {
    return this.pitches[this.positionPitch];
  }
  getVel() {
    return this.vels[this.positionVel];
  }
  play(){

  }
  //display
  display(px, py) {
    stroke(255);
    if (this.dragging) {
      this.position.x = px + this.pOffset.x;
      this.position.y = py + this.pOffset.y;
    }
    ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
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
    this.speed = map(this.position.x, 0, height, 0.001, 0.9);
    this.cycleEvent.set({ playbackRate: this.speed });
  }
  notPressed() {
    this.dragging = false;
  }
}

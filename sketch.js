const sampleRate = 512;
let func;
let notes;
let midiIn;
let midiOut;

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

  func = new Func();
  func.generate();
  notes = new Notes(func.getFunc());
  notes.generateNotesArray();
}

function draw() {
  background(0);
}

function mousePressed() {
  //userStartAudio();
  midiIn = WebMidi.getInputByName("IAC Driver Bus 1");
  midiOut = WebMidi.getOutputByName("IAC Driver Bus 1");
  midiIn.addListener("noteon", (e) => {
    //console.log(e.note.identifier);
  });
  //setInterval(play, 10);
  const playLoop = new Tone.Loop(() => {
    play();
  }, 0.2).start(0);
  Tone.Transport.start();
}

function play() {
  let channel = midiOut.channels[1];
  let sendNote = notes.getNote();
  console.log(sendNote);
  channel.playNote(sendNote);
  channel.stopNote(sendNote, { time: "+1" });
}

class Func {
  constructor() {
    this.gen = new p5.Gen();
    this.func = [];
    this.selectWaveform = 1;
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
  constructor(func) {
    this.sampleRate = sampleRate;
    this.func = func;
    this.pitch;
    this.pitches = [];
    this.tempPitches = [];
    this.position = 0;
    this.previousPitch;
    this.nextPitchPosition;
    this.upperPitchLimit = 110;
    this.lowerPitchLimit = 30;
    this.speed = 0.02;
    this.cycleEvent = new Tone.Loop(() => {
      this.cycle();
    }, this.speed).start(0);
  }
  generateNotesArray() {
    for (let i = 0; i < this.func.length; i++) {
      this.tempPitches.push(
        int(map(this.func[i], -1, 1, this.lowerPitchLimit, this.upperPitchLimit))
      );
    }
    for (let i = 0; i < this.tempPitches.length; i++) {
      if (this.tempPitches[i] != this.tempPitches[i - 1]) {
        this.pitches.push(this.tempPitches[i]);
      }
    }
    //console.table(this.tempPitches);
    //console.table(this.pitches);
    return this.pitches;
  }
  cycle() {
    this.position++;
    if (this.position > this.pitches.length - 1) {
      this.position = 0;
    }
  }
  getNote() {
    return this.pitches[this.position];
  }
  play() {
    this.position = this.findNextPitchPosition(
      this.notes,
      this.position,
      this.previousNote
    );

    this.note = this.notes[this.position];

    this.previousNote = this.notes[this.position];
    this.position++;
    if (this.position > 509) {
      this.position = 0;
    }
    console.log(this.position);
    return this.note;
  }
  // function findNextNote(arrayToSearch, currentPosition, previousNote) {
  //   for (let index = currentPosition; index < arrayToSearch.length; index++) {
  //     if (arrayToSearch[index] != previousNote) {
  //       return arrayToSearch[index];
  //     } else {
  //       return arrayToSearch[0];
  //     }
  //   }
  // }
  findNextNotePosition(arrayToSearch, currentPosition, previousNote) {
    for (let index = currentPosition; index < this.sampleRate; index++) {
      if (arrayToSearch[index] != previousNote) {
        return index;
      }
      // console.table([
      //   arrayToSearch[currentPosition],
      //   currentPosition,
      //   previousNote,
      // ]);
    }
  }
}

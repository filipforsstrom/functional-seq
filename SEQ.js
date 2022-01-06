function setup() {
  createCanvas(windowWidth, windowHeight);
  sequencer = new Sequencer();
}

function draw() {
  background(100);
  sequencer.display(mouseX, mouseY);
  sequencer.run();
}

function mousePressed() {
  sequencer.pressed(mouseX, mouseY);
}

function mouseReleased() {
  sequencer.notPressed();
}

class Sequencer {
  constructor() {
    this.running = true;
    this.tempo = 4;
    this.playheadPos = new createVector(0, height);
    this.playheadWidth = 1;
    this.batonPos = new createVector(this.playheadPos.x, height * 0.9);
    this.batonSize = 20;
    this.batonDrag = false;
    // note
    this.noteDrag = [];
    this.noteNum = 3;
    this.noteMinSize = 5;
    this.notes = [];
    this.noteSize = [];
    this.noteSizeOffset = [];
    this.noteXpos = [];
    this.noteXoffset = [];
    this.notePlay = [];
    this.noteDistance = [];
    // setup
    this.create = this.setup();
  }
  display(px, py) {
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
    this.playheadPosition.x = 0;
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
        this.noteDistance[i] = dist(this.playheadPos.x, 0, this.noteXpos[i], 0);
        if (this.noteDistance[i] < this.noteSize[i]) {
          // this.keyOn();
        } else {
          // this.keyOff();
        }
      }
    }
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
  }
  pressed(px, py) {
    if (py > this.batonPos.y) {
      this.batonDrag = true;
    }

    for (let i = 0; i < this.noteNum; i++) {
      if (py > this.notes[i].y && py < this.notes[i].y + this.notes[i].x) {
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

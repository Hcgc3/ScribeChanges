// Core data model for MIDI to MusicXML conversion

export class Score {
  constructor({ parts = [], divisions = 480 }) {
    this.parts = parts;
    this.divisions = divisions;
  }
}

export class Part {
  constructor({ id, measures = [] }) {
    this.id = id;
    this.measures = measures;
  }
}

export class Measure {
  constructor({ number, attributes = {}, notes = [], directions = [], pedal = false, slurs = [], notations = [], timeSignature = undefined }) {
    this.number = number;
    this.attributes = attributes;
    this.notes = notes;
    this.directions = directions;
    this.pedal = pedal;
    this.slurs = slurs;
    this.notations = notations;
    this.timeSignature = timeSignature;
  }
}

export class NoteEvent {
  constructor({ pitch, duration, voice = 1, type, ties = [], articulations = [], velocity = 100, pedal = false, slur = false, notations = [] }) {
    this.pitch = pitch;
    this.duration = duration;
    this.voice = voice;
    this.type = type;
    this.ties = ties;
    this.articulations = articulations;
    this.velocity = velocity;
    this.pedal = pedal;
    this.slur = slur;
    this.notations = notations;
  }
}

export class DirectionEvent {
  constructor({ type, value, position }) {
    this.type = type;
    this.value = value;
    this.position = position;
  }
}

class Port {
  constructor(defaultVal=0, sanitizer=parseFloat, callback=null) {
    this.subscribers = [];
    if (sanitizer) {
      this.value = sanitizer(defaultVal);
    } else {
      this.value = defaultVal;
    }
    this.wired = false;
    this.callback = callback;
    this.sanitizer = sanitizer;
  }
  update(val) {
    if (this.sanitizer) {
      val = this.sanitizer(val);
    }
    this.value = val;
    this.subscribers.forEach((s) => s.update(val));
    if (this.callback) this.callback();
  }
  addListener(port) {
    this.subscribers.push(port);
    this.wired = true;
    port.wired = true;
  }
}
class UGen {
  step() { }
}

function wireUp(fromPort, toPort) {
  fromPort.addListener(toPort);
}

class TickGen extends UGen {
  constructor() {
    super();
    this.tick = new Port(-1);
    this.min = new Port(-1);
    this.max = new Port(1);
    this.incr = new Port(0.01);
  }
  step() {
    let t = this.tick.value;
    t += this.incr.value;
    if (t >= this.max.value) t = this.min.value;
    if (t <= this.min.value) t = this.max.value;
    this.tick.update(t);
  }
}

class LogGen extends UGen {
  constructor() {
    super();
    for (let i = 0; i < 10; i++) {
      this["value" + i] = new Port(null, null);
    }
  }
  step() {
    for (let i = 0; i < 10; i++) {
      if (this["value" + i].wired) {
        console.log("value" + i, ":", this["value" + i].value);
      }
    }
  }
}

function scaleToCanvas(x, y) {
  if (x < -1) x = 1;
  if (x > 1) x = -1;
  if (y < -1) y = 1;
  if (y > 1) y = -1;
  return [
    x % 1,
    y % 1
  ];
}

class PixelGen extends UGen {
  constructor() {
    super();
    this.x = new Port(0);
    this.y = new Port(0);
    this.r = new Port(1.0);
    this.g = new Port(1.0);
    this.b = new Port(1.0);
  }
  step() {
    let c = color(abs(this.r.value), abs(this.g.value), abs(this.b.value));
    let [x, y] = scaleToCanvas(this.x.value, this.y.value);
    set(x, y, c);
  }
}

class LineGen extends UGen {
  constructor() {
    super();
    this.x = new Port(0);
    this.y = new Port(0);
    this.r = new Port(1);
    this.g = new Port(1);
    this.b = new Port(1);
    this.last_x = 0;
    this.last_y = 0;
    this.first = true;

  }

  step() {
    if (!this.first) {
      push();
      let [x1,y1] = scaleToCanvas(this.last_x, this.last_y);
      let [x2,y2] = scaleToCanvas(this.x.value, this.y.value);
      stroke(this.r.value, this.g.value, this.b.value);
      line(x1, y1, x2, y2);
      pop();
    }
    this.last_x = this.x.value;
    this.last_y = this.y.value;
    this.first = false;
  }

}

class TrigGen extends UGen {
  constructor() {
    super();
    this.frequency = new Port(10);
    this.sin = new Port(0);
    this.cos = new Port(0);
    this.tan = new Port(0);
  }

  step() {
    let m = millis() * 2 * PI / 1000 * this.frequency.value;
    this.sin.update(sin(m));
    this.cos.update(cos(m));
    this.tan.update(tan(m)); 
  }
}

class MathGen extends UGen {
  constructor() {
    super();
    this.a = new Port();
    this.b = new Port();
    this.aPlusB = new Port();
    this.aTimesB = new Port();
    this.aMinusB = new Port();
    this.aOverB = new Port();
    this.aModB = new Port();
  }

  step() {
    let a = this.a.value;
    let b = this.b.value;
    this.aPlusB.update(a + b);
    this.aTimesB.update(a * b);
    this.aMinusB.update(a - b);
    this.aOverB.update(a / b);
    this.aModB.update(a % b);
  }
}

class ValueGen extends UGen {
  constructor() {
    super();
    this.value = new Port();
  }
  step() {
    this.value.update(this.value.value);
   }
}

class GateGen extends UGen {
  constructor() {
    super();
    this.key = new Port("q", keyCodeFor);
    this.in = new Port(1.0);
    this.out = new Port();
    this.latches = new Port(false);
  }

  step() {
    if (keyIsDown(this.key.value)) {
      this.out.update(this.in.value);
    } else if (!this.latches.value) {
      this.out.update(0);
    }
  }
}

class ClearGen extends UGen {
  constructor() {
    super();
    this.x = new Port(-3);
    this.y = new Port(-3);
    this.w = new Port(4);
    this.h = new Port(4);
    this.trig = new Port();
  }

  step() {
    if (this.trig.value > 0) {
      push();
      fill(0);
      noStroke();
      rect(this.x.value, this.y.value, this.w.value, this.h.value);
    }
  }
}

class Rotation extends UGen {
  constructor() {
    super();
    this.r = new Port(0);
  }
  step() {
    rotate(this.r.value);
  }
}

class BeatGen extends UGen {
  constructor() {
    super();
    this.pattern = new Port("x--x--x--", null);
    this.in = new Port(1.0);
    this.bpm = new Port(120);
    this.out = new Port();
    this.last = millis();
  }
  step() {
    let bpm = this.bpm.value;
    let bpms = bpm / 60 / 1000;
    let mod = 1.0 / bpms;
    if (typeof this.pattern.value == "string") {
      this.pattern.value = this.pattern.value.split("");
    }
    let patt = this.pattern.value;
    let t = millis();
    if (t >= this.last+mod) {
      let sym = patt.shift();
      if (sym == "x" || sym == "^" || sym == "*") {
        this.out.update(this.in.value);
        this.pattern.value.push(sym);
      } else {
        this.out.update(0.0);
      }
      this.last = t;
    }
  }
}

let GEN_TYPES={"Tick": TickGen, "Trig": TrigGen, 
  "Math": MathGen, "Pixel": PixelGen, 
  "Value": ValueGen, "Log": LogGen,
  "Line": LineGen, "Gate": GateGen,
  "Clear": ClearGen, "Rotate": Rotation, 
  "Beats": BeatGen};

let RUNNING_GENS = {};

function addGen(code, name, param_dict=null) {
  let g = new GEN_TYPES[code]();
  if (param_dict) {
    Object.keys(param_dict).forEach((k) => {
      g[k].update(param_dict[k]);
    });
  }
  RUNNING_GENS[name] = g;
}

function wire(fromName, fromPort, toName, toPort) {
  wireUp(RUNNING_GENS[fromName][fromPort], RUNNING_GENS[toName][toPort]);
}

function runCode() {
  let code = document.getElementById("code").value;
  try {
    let parsed = parser.parse(code);
    RUNNING_GENS = {}; //clear the running gens AFTER we know this code runs
    background(0);
    parsed[0].forEach((stmt) => {
      if (stmt.action == "gen-decl") {
        addGen(stmt.type, stmt.name, stmt.params);
      } else if (stmt.action == "wire-expr") {
        wire(stmt.from.generator, stmt.from.port, stmt.to.generator, stmt.to.port);
      }
    });
    document.getElementById("error").innerText = "";
  } catch (ex) {
    document.getElementById("error").innerText = ex;
    console.log(ex);
  }

}


function setup() {
  createCanvas(windowWidth*0.75, windowHeight);
  frameRate(200);
  colorMode(RGB, 1.0);
  background(0);
  document.getElementById("run").addEventListener("click", runCode);
}

function draw() {
  translate(width/2, height/2);
  scale(width/2,height/2);
  strokeWeight(0.01);
  Object.values(RUNNING_GENS).forEach((g) => g.step());
}

function windowResized() {
  resizeCanvas(windowWidth*0.75, windowHeight);
}
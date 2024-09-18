class Boid {
  constructor(x, y, index) {
    this.index = index;
    this.x = x;
    this.y = y;
    this.vx = Math.random() * 5 - 2.5;
    this.vy = Math.random() * 5 - 2.5;
    this.ax = 0;
    this.ay = 0;
    this.turn = 0.225;
    this.space = 7.5;
    this.sight = 35;
    this.avoidance = 0.005;
    this.matching = 0.05;
    this.centering = 0.0005;
    this.min_v = 1.5;
    this.max_v = 4;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.vx * 5, this.y + this.vy * 5);
    ctx.stroke();
  }

  update() {
    this.vx += this.ax;
    this.vy += this.ay;
    this.x += this.vx;
    this.y += this.vy;
    let velocity_vector_magnitude = vector_length(this.vx, this.vy);
    if (velocity_vector_magnitude > this.max_v) {
      this.vx = (this.vx / velocity_vector_magnitude) * this.max_v;
      this.vy = (this.vy / velocity_vector_magnitude) * this.max_v;
    } else if (velocity_vector_magnitude < this.min_v) {
      this.vx = (this.vx / velocity_vector_magnitude) * this.min_v;
      this.vy = (this.vy / velocity_vector_magnitude) * this.min_v;
    }
  }

  border_check(width, height) {
    if (this.x < 35) { 
      this.vx += this.turn;
    } else if (this.x > width - 35) { 
      this.vx -= this.turn;
    }

    if (this.y < 35) { 
      this.vy += this.turn;
    } else if (this.y > height - 35) { 
      this.vy -= this.turn;
    }
  }

  look_for_mouse(mouse_x, mouse_y, mouse_attraction) {
    let distance = Math.sqrt(
      Math.pow(this.x - mouse_x, 2) + Math.pow(this.y - mouse_y, 2)
    );
    if (distance > this.sight) return;

    let closeness_x = this.x - mouse_x;
    let closeness_y = this.y - mouse_y;

    this.vx += closeness_x * mouse_attraction;
    this.vy += closeness_y * mouse_attraction;
  }

  check_other_boids(boids) {
    let closeness_x = 0;
    let closeness_y = 0;
    let average_y = 0;
    let average_x = 0;
    let neighbors = 0;
    let position_average_x = 0;
    let position_average_y = 0;

    for (let boid of boids) {
      if (this.index === boid.index) continue;

      let dist = distance(this, boid);
      if (dist < this.sight) {
        if (dist < this.space) {
          closeness_x += this.x - boid.x;
          closeness_y += this.y - boid.y;
        } else {
          average_x += boid.vx;
          average_y += boid.vy;
          position_average_x += boid.x;
          position_average_y += boid.y;
          neighbors++;
        }
      }
    }

    if (neighbors > 0) {
      average_x /= neighbors;
      average_y /= neighbors;
      position_average_x /= neighbors;
      position_average_y /= neighbors;

      this.vx += (average_x - this.vx) * this.matching;
      this.vx += (position_average_x - this.x) * this.centering;
      this.vy += (average_y - this.vy) * this.matching;
      this.vy += (position_average_y - this.y) * this.centering;
    }

    this.vx += closeness_x * this.avoidance;
    this.vy += closeness_y * this.avoidance;
  }
}

function distance(boid1, boid2) {
  return Math.sqrt(Math.pow(boid1.x - boid2.x, 2) + Math.pow(boid1.y - boid2.y, 2));
}

function vector_length(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

class BoidSimulationConfig {
  constructor(
    mouse_as_object,
    mouse_attraction,
  ) {
    this.mouse_as_object = mouse_as_object,
    this.mouse_attraction = mouse_attraction
  }
}

class BoidSimulation {
  constructor(canvasId, numBoids, config) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.boids = [];
    this.numBoids = numBoids;
    this.mouse_x = 0;
    this.mouse_y = 0;
    this.simulationInterval = null;
    this.config = config;

    for (let i = 0; i < this.numBoids; i++) {
      this.boids.push(new Boid(Math.random() * this.canvas.width, Math.random() * this.canvas.height, i));
    }

    this.canvas.addEventListener('mousemove', (e) => this.getMousePos(e));
  }

  getMousePos(evt) {
    var rect = this.canvas.getBoundingClientRect();
    this.mouse_x = evt.clientX - rect.left;
    this.mouse_y = evt.clientY - rect.top;
  }

  start() {
    this.simulationInterval = setInterval(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let boid of this.boids) {
        boid.border_check(this.canvas.width, this.canvas.height);
        if (this.config.mouse_as_object) {
          boid.look_for_mouse(this.mouse_x, this.mouse_y, this.config.mouse_attraction);
        }
        boid.check_other_boids(this.boids);
        boid.update();
        boid.draw(this.ctx);
      }
    }, 16.67);
  }

  stop() {
    clearInterval(this.simulationInterval);
  }

  reset() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.boids = [];
    for (let i = 0; i < this.numBoids; i++) {
      this.boids.push(new Boid(Math.random() * this.canvas.width, Math.random() * this.canvas.height, i));
    }
  }
}

let sims = [];

function createSimulations() {
  var sim1config = new BoidSimulationConfig(true, 0);
  var sim1 = new BoidSimulation('BoidsCanvas0', 100, sim1config);

  sims.push(sim1);
}

function startSim(index) {
  sims[index].start();
}

function stopSim(index) {
  sims[index].stop();
}

function resetSim(index) {
  sims[index].reset();
}

window.onload = createSimulations;


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
      this.sight = 75;
      this.avoidance = 0.005;
      this.matching = 0.05;
      this.centering = 0.0005;
      this.min_v = 1.5;
      this.max_v = 4;
      this.smell = 15;
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

      // Normalize velocity if necessary
      let velocity_vector_magnitude = vector_length(this.vx, this.vy);
      if (velocity_vector_magnitude > this.max_v) {
          this.vx = (this.vx / velocity_vector_magnitude) * this.max_v;
          this.vy = (this.vy / velocity_vector_magnitude) * this.max_v;
      } else if (velocity_vector_magnitude < this.min_v) {
          this.vx = (this.vx / velocity_vector_magnitude) * this.min_v;
          this.vy = (this.vy / velocity_vector_magnitude) * this.min_v;
      }

      // Reset acceleration
      this.ax = 0;
      this.ay = 0;
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

  look_for_mouse(mouse_x, mouse_y) {
      let distance = Math.sqrt(
          Math.pow(this.x - mouse_x, 2) + Math.pow(this.y - mouse_y, 2)
      );
      if (distance > this.sight) {
        return [0, 0];
      }

      let closeness_x = this.x - mouse_x;
      let closeness_y = this.y - mouse_y;

      return [closeness_x, closeness_y];      
  }

  calculate_separation(boids) {
      let closeness_x = 0;
      let closeness_y = 0;
      for (let boid of boids) {
          if (this.index === boid.index) continue;

          let dist = distance(this, boid);
          if (dist < this.space) {
              closeness_x += this.x - boid.x;
              closeness_y += this.y - boid.y;
          }
      }

      return [closeness_x * this.avoidance, closeness_y * this.avoidance];
  }

  calculate_alignment(boids) {
      let average_vx = 0;
      let average_vy = 0;
      let neighbors = 0;

      for (let boid of boids) {
          if (this.index === boid.index) continue;

          let dist = distance(this, boid);
          if (dist < this.sight) {
              average_vx += boid.vx;
              average_vy += boid.vy;
              neighbors++;
          }
      }

      if (neighbors > 0) {
          average_vx /= neighbors;
          average_vy /= neighbors;

          let dvx = average_vx - this.vx;
          let dvy = average_vy - this.vy;

          return [dvx * this.matching, dvy * this.matching];
      }

      return [0, 0];
  }

  calculate_cohesion(boids) {
      let position_average_x = 0;
      let position_average_y = 0;
      let neighbors = 0;

      for (let boid of boids) {
          if (this.index === boid.index) continue;

          let dist = distance(this, boid);
          if (dist < this.sight) {
              position_average_x += boid.x;
              position_average_y += boid.y;
              neighbors++;
          }
      }

      if (neighbors > 0) {
          position_average_x /= neighbors;
          position_average_y /= neighbors;

          let dx = position_average_x - this.x;
          let dy = position_average_y - this.y;

          return [dx * this.centering, dy * this.centering];
      }

      return [0, 0];
  }

  release_pheromone(pheromones, strength) {
    let p = new Pheromone(this.x, this.y, strength);
    pheromones.push(p);
  }

  calculate_fear(pheromones) {
    return [0, 0];
  }
}

class Pheromone {
  constructor(x, y, strength) {
    this.x = x;
    this.y = y;
    this.strength = strength;
    this.t = 0;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(95, 50, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fill();
    ctx.stroke();
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
    fear_enabled
  ) {
    this.mouse_as_object = mouse_as_object,
    this.fear_enabled = fear_enabled
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
    this.pheromones = [];

    for (let i = 0; i < this.numBoids; i++) {
      this.boids.push(new Boid(Math.random() * this.canvas.width, Math.random() * this.canvas.height, i));
    }

    if (this.config.mouse_as_object) {
      this.canvas.addEventListener('mousemove', (e) => this.getMousePos(e));
    }
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
          var [mouse_distance_x, mouse_distance_y] = boid.look_for_mouse(this.mouse_x, this.mouse_y);
          boid.release_pheromone(this.pheromones);
        }

        if (this.config.fear_enabled) {
          var [fear_x, fear_y] = boid.calculate_fear(this.pheromones);
        }

        let [separation_x, separation_y] = boid.calculate_separation(this.boids);
        let [alignment_x, alignment_y] = boid.calculate_alignment(this.boids);
        let [cohesion_x, cohesion_y] = boid.calculate_cohesion(this.boids);

        boid.ax = separation_x + alignment_x + cohesion_x;
        boid.ay = separation_y + alignment_y + cohesion_y;

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
  var sim0config = new BoidSimulationConfig(false, false);
  var sim0 = new BoidSimulation('BoidsCanvas0', 100, sim0config);
  var sim1config = new BoidSimulationConfig(true, true);
  var sim1 = new BoidSimulation('BoidsCanvas1', 100, sim1config);

  sims.push(sim0);
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


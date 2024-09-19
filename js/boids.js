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
      this.space = 10;
      this.sight = 200;
      this.avoidance = 0.01;
      this.matching = 0.05;
      this.centering = 0.0005;
      this.nerves = 0.001;
      this.min_v = 1.5;
      this.max_v = 4;
      this.smell = 15;
      this.fear_timer = 0;
      this.fear_release_duration = 10;
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

  distance_from_position(x, y) {
      return Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)
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

  release_pheromone(pheromones, strength, life_time) {
    let p = new Pheromone(this.x, this.y, strength, life_time);
    pheromones.push(p);
  }

  calculate_fear(pheromones) {
    let pheromone_fear_x = 0;
    let pheromone_fear_y = 0;
    let total_fear_strength = 0;
    let pheromones_smelled = 0;
  
    for (let pheromone of pheromones) {
      let distance = this.distance_from_position(pheromone.x, pheromone.y);
      if (pheromone.current_strength > distance) {
        pheromone_fear_x += pheromone.x * pheromone.current_strength;
        pheromone_fear_y += pheromone.y * pheromone.current_strength;
        total_fear_strength += pheromone.current_strength;
        pheromones_smelled++;
      }
    }
  
    if (pheromones_smelled > 0) {
      let avg_pheromone_x = pheromone_fear_x / total_fear_strength;
      let avg_pheromone_y = pheromone_fear_y / total_fear_strength;
  
      // Compute vector from pheromone to boid (reverse direction)
      let dx = this.x - avg_pheromone_x;
      let dy = this.y - avg_pheromone_y;
  
      // Normalize the vector
      let length = vector_length(dx, dy);
      if (length > 0) {
        dx /= length;
        dy /= length;
      }
  
      // Add randomness to the direction
      let randomAngle = (Math.random() - 0.5) * Math.PI;
      let sinAngle = Math.sin(randomAngle);
      let cosAngle = Math.cos(randomAngle);
      let new_dx = dx * cosAngle - dy * sinAngle;
      let new_dy = dx * sinAngle + dy * cosAngle;
  
      // Scale by 'nerves' parameter and average fear strength
      let scaled_fear = total_fear_strength / pheromones_smelled / this.nerves;
      let fear_x = new_dx * this.nerves * scaled_fear;
      let fear_y = new_dy * this.nerves * scaled_fear;
  
      // Set the fear timer to start or reset it
      this.fear_timer = this.fear_release_duration;
  
      return {
        fear_vector: [fear_x, fear_y],
        fear_strength: total_fear_strength / pheromones_smelled
      };
    }
  
    return {
      fear_vector: [0, 0],
      fear_strength: 0
    };
  }
  
}

class Pheromone {
  constructor(x, y, strength, life_time) {
    this.x = x;
    this.y = y;
    this.start_strength = strength; // Maximum strength (s_max)
    this.current_strength = strength * 0.5; // Start at medium strength
    this.life_time = life_time; // Total lifespan (T)
    this.t = 0; // Current time
  }

  update() {
    this.t++;
    let T = this.life_time;
    let s_max = this.start_strength;
    let s_min = s_max * 0.5; // Starting at 50% of s_max
    let t = this.t;
    let T_peak = T / 2; // Time at which strength is maximum

    if (t <= T) {
      if (t <= T_peak) {
        // Growth phase
        this.current_strength = s_min + (s_max - s_min) * (t / T_peak);
      } else {
        // Decay phase
        this.current_strength = s_max * (1 - ((t - T_peak) / (T - T_peak)));
      }
    } else {
      this.current_strength = 0;
    }
  }

  draw(ctx) {
    if (this.current_strength > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.current_strength, 0, 2 * Math.PI);
      let opacity = this.current_strength / this.start_strength;
      ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
      ctx.fill();
      ctx.stroke();
    }
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
        let fear_vector = [0, 0];
        let fear_strength = 0;
  
        if (this.config.mouse_as_object) {
          let distance = boid.distance_from_position(this.mouse_x, this.mouse_y);
          if (distance < boid.sight) {
            boid.release_pheromone(this.pheromones, 20, 60);
          }
        }
  
        if (this.config.fear_enabled) {
          let fear_result = boid.calculate_fear(this.pheromones);
          fear_vector = fear_result.fear_vector;
          fear_strength = fear_result.fear_strength;
        }
  
        // If the boid is scared, release pheromones and decrement fear_timer
        if (boid.fear_timer > 0) {
          let weaker_strength = 10; // Adjust strength as needed
          boid.release_pheromone(this.pheromones, weaker_strength, 60);
          boid.fear_timer--;
        }
  
        let [separation_x, separation_y] = boid.calculate_separation(this.boids);
        let [alignment_x, alignment_y] = boid.calculate_alignment(this.boids);
        let [cohesion_x, cohesion_y] = boid.calculate_cohesion(this.boids);
  
        boid.ax = separation_x + alignment_x + cohesion_x + fear_vector[0];
        boid.ay = separation_y + alignment_y + cohesion_y + fear_vector[1];
  
        boid.update();
        boid.draw(this.ctx);
      }
  
      // Update pheromones
      let pheromone_index = 0;
      while (pheromone_index < this.pheromones.length) {
        let pheromone = this.pheromones[pheromone_index];
        pheromone.update();
        //pheromone.draw(this.ctx);
  
        if (pheromone.current_strength <= 0) {
          this.pheromones.splice(pheromone_index, 1);
        } else {
          pheromone_index++;
        }
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
  var sim1 = new BoidSimulation('BoidsCanvas1', 250, sim1config);

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


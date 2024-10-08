// Ultility Functions
const Utils = {
  distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  vectorLength(x, y) {
    return Math.hypot(x, y);
  },

  normalizeVector(x, y) {
    const length = Utils.vectorLength(x, y);
    return length === 0 ? [0, 0] : [x / length, y / length];
  }
};

// Pheromone Class
class Pheromone {
  constructor(x, y, strength, lifeTime, ownerIndex) {
    this.x = x;
    this.y = y;
    this.startStrength = strength;
    this.currentStrength = strength * 0.5;
    this.lifeTime = lifeTime;
    this.t = 0;
    this.ownerIndex = ownerIndex;
  }

  // Update the pheromones state
  update() {
    this.t++;
    const T = this.lifeTime;
    const sMax = this.startStrength;
    const sMin = sMax * 0.5;
    const t = this.t;
    const T_peak = T / 2;

    if (t <= T) {
      if (t <= T_peak) {
        this.currentStrength = sMin + (sMax - sMin) * (t / T_peak); // Increase to max strength if before peak time
      } else {
        this.currentStrength = sMax * (1 - ((t - T_peak) / (T - T_peak))); // Decrease to 0 if after peak time
      }
    } else {
      this.currentStrength = 0; // Set to 0 after lifetime to delete
    }
  }

  // Draw pheromone as red circle
  draw(ctx) {
    if (this.currentStrength > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentStrength, 0, 2 * Math.PI);
      const opacity = (this.currentStrength / this.startStrength) * 0.2;
      ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
      ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Boid Class
class Boid {
  constructor(x, y, index, options = {}) {
    // Boid Data
    this.index = index;
    this.x = x;
    this.y = y;
    this.vx = options.vx || (Math.random() * 5 - 2.5);
    this.vy = options.vy || (Math.random() * 5 - 2.5);
    this.ax = 0;
    this.ay = 0;

    // Boid Parameters
    this.turn = options.turn || 0.225;
    this.space = options.space || 10;
    this.sight = options.sight || 50;
    this.avoidance = options.avoidance || 0.01;
    this.matching = options.matching || 0.05;
    this.centering = options.centering || 0.0005;
    this.minV = options.minV || 1.5;
    this.maxV = options.maxV || 4;

    // Boid Fear and Pheromone Paramters
    this.fearTimer = 0;
    this.fearReleaseDuration = options.fearReleaseDuration || 5;
    this.escapeAcceleration = options.escapeAcceleration || 0.2;
    this.pheromoneReleaseCounter = 0;
    this.pheromoneReleaseInterval = options.pheromoneReleaseInterval || 3;
    this.escapeTimer = 0;
    this.escapeDirectionX = 0;
    this.escapeDirectionY = 0;
    this.separationAx = 0;
    this.separationAy = 0;

    // Predator
    this.isPredator = options.isPredator || false;

    // Color and Shape
    this.size = options.size || 1.5;
    this.color = options.color || "black";
    this.vel_vector_size = options.vel_vector_size || 5;
  }

  // Draw the boid
  draw(ctx) {
    ctx.strokeStyle = this.color;
    // Draw Boid position
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw Boid velocity vector
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.vx * this.vel_vector_size, this.y + this.vy * this.vel_vector_size);
    ctx.stroke();
  }

  // Update Boid information
  update() {
    if (this.escapeTimer > 0) {
      const desiredVx = this.escapeDirectionX * this.maxV;
      const desiredVy = this.escapeDirectionY * this.maxV;

      let ax = desiredVx - this.vx;
      let ay = desiredVy - this.vy;

      const accMagnitude = Utils.vectorLength(ax, ay);
      const maxAcceleration = this.escapeAcceleration;
      if (accMagnitude > maxAcceleration) {
        ax = (ax / accMagnitude) * maxAcceleration;
        ay = (ay / accMagnitude) * maxAcceleration;
      }

      this.ax = ax + this.separationAx;
      this.ay = ay + this.separationAy;

      this.escapeTimer--;
    }

    this.vx += this.ax;
    this.vy += this.ay;
    this.x += this.vx;
    this.y += this.vy;

    const velocityMagnitude = Utils.vectorLength(this.vx, this.vy);
    if (velocityMagnitude > this.maxV) {
      this.vx = (this.vx / velocityMagnitude) * this.maxV;
      this.vy = (this.vy / velocityMagnitude) * this.maxV;
    } else if (velocityMagnitude < this.minV) {
      this.vx = (this.vx / velocityMagnitude) * this.minV;
      this.vy = (this.vy / velocityMagnitude) * this.minV;
    }

    if (this.escapeTimer <= 0) {
      this.ax = 0;
      this.ay = 0;
    }

    if (this.pheromoneReleaseCounter > 0) {
      this.pheromoneReleaseCounter--;
    }
  }

  borderCheck(width, height) {
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

  distanceFromPosition(x, y) {
    return Utils.distance(this.x, this.y, x, y);
  }

  calculateSeparation(boids) {
    let closenessX = 0;
    let closenessY = 0;
    for (let boid of boids) {
      if (this.index === boid.index) continue;

      const dist = Utils.distance(this.x, this.y, boid.x, boid.y);
      if (dist < this.space) {
        closenessX += this.x - boid.x;
        closenessY += this.y - boid.y;
      }
    }

    return [closenessX * this.avoidance, closenessY * this.avoidance];
  }

  calculateAlignment(boids) {
    let averageVx = 0;
    let averageVy = 0;
    let neighbors = 0;

    for (let boid of boids) {
      if (this.index === boid.index) continue;

      const dist = Utils.distance(this.x, this.y, boid.x, boid.y);
      if (dist < this.sight) {
        averageVx += boid.vx;
        averageVy += boid.vy;
        neighbors++;
      }
    }

    if (neighbors > 0) {
      averageVx /= neighbors;
      averageVy /= neighbors;

      const dvx = averageVx - this.vx;
      const dvy = averageVy - this.vy;

      return [dvx * this.matching, dvy * this.matching];
    }

    return [0, 0];
  }

  calculateCohesion(boids) {
    let positionAverageX = 0;
    let positionAverageY = 0;
    let neighbors = 0;

    for (let boid of boids) {
      if (this.index === boid.index) continue;

      const dist = Utils.distance(this.x, this.y, boid.x, boid.y);
      if (dist < this.sight) {
        positionAverageX += boid.x;
        positionAverageY += boid.y;
        neighbors++;
      }
    }

    if (neighbors > 0) {
      positionAverageX /= neighbors;
      positionAverageY /= neighbors;

      const dx = positionAverageX - this.x;
      const dy = positionAverageY - this.y;

      return [dx * this.centering, dy * this.centering];
    }

    return [0, 0];
  }

  releasePheromone(pheromones, strength, lifeTime) {
    if (this.pheromoneReleaseCounter === 0) {
      const p = new Pheromone(this.x, this.y, strength, lifeTime, this.index);
      pheromones.push(p);
      this.pheromoneReleaseCounter = this.pheromoneReleaseInterval;
    }
  }

  calculateFear(pheromones) {
    let pheromoneFearX = 0;
    let pheromoneFearY = 0;
    let totalFearStrength = 0;
    let pheromonesSmelled = 0;

    for (let pheromone of pheromones) {
      if (pheromone.ownerIndex === this.index) continue;

      const distance = this.distanceFromPosition(pheromone.x, pheromone.y);
      if (pheromone.currentStrength > distance) {
        pheromoneFearX += pheromone.x * pheromone.currentStrength;
        pheromoneFearY += pheromone.y * pheromone.currentStrength;
        totalFearStrength += pheromone.currentStrength;
        pheromonesSmelled++;
      }
    }

    if (pheromonesSmelled > 0) {
      const avgPheromoneX = pheromoneFearX / totalFearStrength;
      const avgPheromoneY = pheromoneFearY / totalFearStrength;

      let dx = this.x - avgPheromoneX;
      let dy = this.y - avgPheromoneY;

      [dx, dy] = Utils.normalizeVector(dx, dy);

      this.escapeDirectionX = dx;
      this.escapeDirectionY = dy;
      this.escapeTimer = 50;
      this.fearTimer = this.fearReleaseDuration;

      return { fearStrength: totalFearStrength / pheromonesSmelled };
    }

    return { fearStrength: 0 };
  }
  
  look_for_predators(boids) {
    let escapeX = 0;
    let escapeY = 0;
    let predators = 0;
    for (let boid of boids) {
      if (boid.isPredator) {
        if (this.index == boid.index) {
          continue;
        }
        let distance = this.distanceFromPosition(boid.x, boid.y);
        if (distance < this.sight) {       
          escapeX += this.x - boid.x;
          escapeY += this.y - boid.y;
        }
        predators++;
      }
    }
    if (predators > 0) {
      let avgEscapeX = escapeX / predators;
      let avgEscapeY = escapeY / predators;
      return [avgEscapeX * 0.01 , avgEscapeY * 0.01];
    } else {
      return [0, 0];
    }
  }
}


class BoidSimulationConfig {
  constructor(options = {}) {
    this.mouseAsObject = options.mouseAsObject || false;
    this.fearEnabled = options.fearEnabled || false;
    this.interval = options.interval || 16.67;
    this.boidOptions = options.boidOptions || {};
    this.predatorOptions = options.predatorOptions || {};
    this.amount_of_predators = options.amount_of_predators || 0;
  }
}

class BoidSimulation {
  constructor(canvasId, numBoids, config = new BoidSimulationConfig()) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.boids = [];
    this.numBoids = numBoids;
    this.mouseX = 0;
    this.mouseY = 0;
    this.simulationInterval = null;
    this.config = config;
    this.pheromones = [];

    this.initializeBoids();

    if (this.config.mouseAsObject) {
      this.canvas.addEventListener('mousemove', (e) => this.getMousePos(e));
    }
  }

  initializeBoids() {
    for (let i = 0; i < this.numBoids; i++) {
      this.boids.push(
        new Boid(
          Math.random() * this.canvas.width,
          Math.random() * this.canvas.height,
          i,
          this.config.boidOptions
        )
      );
    }
    console.log(this.config.amount);
    for (let i = 0; i < this.config.amount_of_predators; i++) {
      console.log("Wheres my preadtor");
      this.boids.push(
        new Boid(
          Math.random() * this.canvas.width,
          Math.random() * this.canvas.height,
          i + this.numBoids,
          this.config.predatorOptions
        )
      )
    }
  }

  getMousePos(evt) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = evt.clientX - rect.left;
    this.mouseY = evt.clientY - rect.top;
  }

  start() {
    this.simulationInterval = setInterval(() => {
      this.update();
    }, this.config.interval);
  }

  stop() {
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
  }

  reset() {
    this.stop();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.boids = [];
    this.initializeBoids();
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let boid of this.boids) {
      boid.borderCheck(this.canvas.width, this.canvas.height);

      if (this.config.fearEnabled && !boid.isPredator) {
        boid.calculateFear(this.pheromones);
      }

      if (this.config.mouseAsObject) {
        const distance = boid.distanceFromPosition(this.mouseX, this.mouseY);
        if (distance < boid.sight) {
          boid.releasePheromone(this.pheromones, 17.5, 40);
        }
      }

      if (boid.fearTimer > 0) {
        const weakerStrength = 5;
        boid.releasePheromone(this.pheromones, weakerStrength, 30);
        boid.fearTimer--;
      }

      if (this.config.amount_of_predators > 0) {
        var [predatorsX, predatorsY] = boid.look_for_predators(this.boids);
        if (predatorsX != 0 || predatorsY != 0) {
          boid.releasePheromone(this.pheromones, 17.5, 40);
        }
      } else {
        var [predatorsX, predatorsY] = [0, 0];
      }

      const [separationX, separationY] = boid.calculateSeparation(this.boids);
      boid.separationAx = separationX;
      boid.separationAy = separationY;

      if (boid.escapeTimer > 0) {

      } else {
        const [alignmentX, alignmentY] = boid.calculateAlignment(this.boids);
        const [cohesionX, cohesionY] = boid.calculateCohesion(this.boids);

        boid.ax = separationX + alignmentX + cohesionX + predatorsX;
        boid.ay = separationY + alignmentY + cohesionY + predatorsY;
      }

      boid.update();
      boid.draw(this.ctx);
    }

    let pheromoneIndex = 0;
    while (pheromoneIndex < this.pheromones.length) {
      const pheromone = this.pheromones[pheromoneIndex];
      pheromone.update();
      pheromone.draw(this.ctx);

      if (pheromone.currentStrength <= 0) {
        this.pheromones.splice(pheromoneIndex, 1);
      } else {
        pheromoneIndex++;
      }
    }
  }
}

const simulations = [];

function createSimulations() {
  const sim0Config = new BoidSimulationConfig({
    mouseAsObject: false,
    fearEnabled: false,
    interval: 16.67,
    boidOptions: {}
  });
  const sim0 = new BoidSimulation('BoidsCanvas0', 100, sim0Config);

  const sim1Config = new BoidSimulationConfig({
    mouseAsObject: true,
    fearEnabled: true,
    interval: 16.67,
    boidOptions: {}
  });
  const sim1 = new BoidSimulation('BoidsCanvas1', 100, sim1Config);

  const sim2Config = new BoidSimulationConfig({
    mouseAsObject: false,
    fearEnabled: true,
    interval: 16.67,
    boidOptions: {},
    amount_of_predators: 2,
    predatorOptions: {
      size: 5,
      color: "blue",
      isPredator: true,
      sight: 150,
      minV: 3,
      maxV: 6,
      centering: 0.005,
      avoidance: 0,
    }
  });
  const sim2 = new BoidSimulation('BoidsCanvas2', 100, sim2Config);
  simulations.push(sim0);
  simulations.push(sim1);
  simulations.push(sim2);
}

function startSim(index) {
  simulations[index].start();
}

function stopSim(index) {
  simulations[index].stop();
}

function resetSim(index) {
  simulations[index].reset();
}

window.onload = createSimulations;

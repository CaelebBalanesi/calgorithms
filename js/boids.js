// Create Boid Class
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
    ctx.lineTo(this.x + (this.vx * 5), this.y + (this.vy * 5));
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

  border_check() {
    if (this.x < 35) { // left side
      this.vx += this.turn;
    } else if (this.x > 765) { // right side
      this.vx -= this.turn;
    } else {
      this.ax = 0;
    }

    if (this.y < 35) { // top side
      this.vy += this.turn;
    } else if (this.y > 565) { // bottom side
      this.vy -= this.turn;
    } else {
      this.ay = 0;
    }
  }

  avoid_mouse() {
    let distance = Math.sqrt(Math.pow(this.x - mouse_x, 2) + Math.pow(this.y - mouse_y, 2));

    if(distance > this.sight) {
      return
    }
    
    let closeness_x = this.x - mouse_x;
    let closeness_y = this.y - mouse_y;

    let mouse_hatred = 0.0125;
    this.vx += closeness_x * mouse_hatred;
    this.vy += closeness_y * mouse_hatred;
  }

  check_other_boids(boids) {
    let closeness_x = 0;
    let closeness_y = 0;
    let average_y = 0;
    let average_x = 0;
    let neighbors = 0;
    let position_average_x = 0;
    let position_average_y = 0;
    
    for(let i = 0; i < amt_of_boids; i++) {
      if (this.index == i) {
        continue;
      }
      let dist = distance(this, boids[i]);
      if (dist < this.sight) { // Insight
        if (dist < this.space) { // In personal space
          closeness_x += this.x - boids[i].x;
          closeness_y += this.y - boids[i].y;
        } else { // Out of personal space
          average_x += boids[i].vx;
          average_y += boids[i].vy;
          position_average_x += boids[i].x;
          position_average_y += boids[i].y;
          neighbors++;
        }
      }
    }
    if (neighbors > 0) {
      average_x = average_x/neighbors;
      average_y = average_y/neighbors;
      position_average_x = position_average_x/neighbors;
      position_average_y = position_average_y/neighbors;
      this.vx += (average_x - this.vx) * this.matching;
      this.vx += (position_average_x - this.x) * this.centering;
      this.vy += (average_y - this.vy) * this.matching;
      this.vy += (position_average_y - this.y) * this.centering;
    }
    this.vx += closeness_x * this.avoidance;
    this.vy += closeness_y * this.avoidance;
  }
}

// Helper Functions
function new_random(i) {    
    let boid = new Boid(Math.random() * 530 + 35, Math.random() * 330 + 35, i);
    return boid;
}

function distance(boid1, boid2) {
  return Math.sqrt(Math.pow(boid1.x - boid2.x, 2) + Math.pow(boid1.y - boid2.y, 2));
}

function vector_length(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function getMousePos(evt) {
  var rect = canvas.getBoundingClientRect();
  mouse_x = evt.clientX - rect.left;
  mouse_y = evt.clientY - rect.top;
  console.log(`(${mouse_x}, ${mouse_y})`);
}

var canvas = document.getElementById("BoidsCanvas");
var ctx = canvas.getContext("2d");
let amt_of_boids = 100;
let boids = [];
let mouse_x = 0;
let mouse_y = 0;

for (let i = 0; i < amt_of_boids; i++) {
  let boid = new_random(i);
  boids.push(boid);
}

setInterval(function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < amt_of_boids; i++) {
    boids[i].border_check();
    boids[i].avoid_mouse();
    boids[i].check_other_boids(boids);
    boids[i].update();
    boids[i].draw(ctx);
  }
}, 16.67);

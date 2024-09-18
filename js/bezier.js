var drawLinesButton = document.getElementById("drawLinesButton");
var canvas = document.getElementById("BezierCanvas");
var ctx = canvas.getContext("2d");
var progress = document.getElementById("progress");
var progressNum = document.getElementById("progress-num");
var drawArcButton = document.getElementById("drawArcButton");
var nodes = document.getElementById("nodes");
var numOfNodesField = document.getElementById("numOfNodes");
var bezierContainer = document.getElementById("bezierContainer");
var generateNodesButton = document.getElementById("generateNodesButton");

// Colors
const BASE_LINE_COLOR = "red";
const BASE_LINE_OPACITY = 1;
const INTER_POINT_COLOR = "yellow";
const INTER_POINT_OPACITY = 1;
const INTER_LINE_COLOR = "blue";
const INTER_LINE_OPACITY = 0.25;
const BEZIER_CURVE_COLOR = "purple";
const BEZIER_CURVE_OPACITY = 1;
const FINAL_POINT_COLOR = "green";
const FINAL_POINT_OPACITY = 1;

// Variables for cursor and elements positions
var offsetX = 0;
var offsetY = 0;
var draggedElement; // Current dragged element
var positions = [];
var drawingArc = false;

// Add event listener for the "Draw Lines" button
drawLinesButton.addEventListener("click", drawLines);

// Add event listener for the "Draw Arc" button
drawArcButton.addEventListener("click", function() {
  drawingArc = !drawingArc;
});

// Add event listener for the "Generate" button
generateNodesButton.addEventListener("click", generateNodes);

// Function to start dragging
function dragStart(event) {
    draggedElement = this;
    var rect = draggedElement.getBoundingClientRect();
    var containerRect = bezierContainer.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
}

// Function for dragging
function drag(event) {
    event.preventDefault();
    var x = event.clientX - offsetX - bezierContainer.getBoundingClientRect().left;
    var y = event.clientY - offsetY - bezierContainer.getBoundingClientRect().top;
    x = Math.max(0, Math.min(x, canvas.width - draggedElement.offsetWidth));
    y = Math.max(0, Math.min(y, canvas.height - draggedElement.offsetHeight));
    draggedElement.style.left = x + "px";
    draggedElement.style.top = y + "px";
}

// Function to stop dragging
function dragEnd() {
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
}

// Function to draw lines
function drawLines(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    getDotPos();
    ctx.lineWidth = 3;
    ctx.strokeStyle = BASE_LINE_COLOR;
    ctx.globalAlpha = BASE_LINE_OPACITY;
    ctx.beginPath();
    if (positions.length > 0) {
        ctx.moveTo(positions[0].x, positions[0].y);
        for(let i = 1; i < positions.length; i++){
            ctx.lineTo(positions[i].x, positions[i].y);
        }
        ctx.stroke();
    }
}

function drawInterPoints(points) {
    if (points.length < 1) {
        return;
    }
    
    var interPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        var px = (1 - progress.value) * points[i].x + progress.value * points[i + 1].x;
        var py = (1 - progress.value) * points[i].y + progress.value * points[i + 1].y;
        ctx.globalAlpha = INTER_POINT_OPACITY;
        ctx.strokeStyle = INTER_POINT_COLOR;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, 2 * Math.PI, false);
        ctx.stroke();
        interPoints.push({ x: px, y: py });
    }
    
    drawInterPoints(interPoints);
}

function drawInterLines() {
    var numPoints = positions.length;
    if (numPoints < 2) {
        return;
    }
    
    ctx.lineWidth = 3;
    ctx.globalAlpha = INTER_LINE_OPACITY;
    ctx.strokeStyle = INTER_LINE_COLOR;
    
    var interPoints = [];
    for (let i = 0; i < numPoints - 1; i++) {
        var px1 = (1 - progress.value) * positions[i].x + progress.value * positions[i + 1].x;
        var py1 = (1 - progress.value) * positions[i].y + progress.value * positions[i + 1].y;
        
        interPoints.push({ x: px1, y: py1 });
        
        if(i < numPoints - 2) {
            var px2 = (1 - progress.value) * positions[i + 1].x + progress.value * positions[i + 2].x;
            var py2 = (1 - progress.value) * positions[i + 1].y + progress.value * positions[i + 2].y;
            
            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();
        }
    }
    
    drawInterLinesRecursive(interPoints);
}

function drawInterLinesRecursive(points) {
    var numPoints = points.length;
    if (numPoints < 2) {
        return;
    }
    
    var interPoints = [];
    for (let i = 0; i < numPoints - 1; i++) {
        var px1 = (1 - progress.value) * points[i].x + progress.value * points[i + 1].x;
        var py1 = (1 - progress.value) * points[i].y + progress.value * points[i + 1].y;
        interPoints.push({ x: px1, y: py1 });
        
        if(i < numPoints - 2) {
            var px2 = (1 - progress.value) * points[i + 1].x + progress.value * points[i + 2].x;
            var py2 = (1 - progress.value) * points[i + 1].y + progress.value * points[i + 2].y;
            
            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();
        }
    }
    
    // If we're down to the final midpoint, change the color.
    if (interPoints.length == 1) {
        ctx.globalAlpha = FINAL_POINT_OPACITY;
        ctx.strokeStyle = FINAL_POINT_COLOR; // or whatever color you want
        ctx.beginPath();
        ctx.arc(interPoints[0].x, interPoints[0].y, 5, 0, 2 * Math.PI, false);
        ctx.stroke();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "blue"; // set the color back for the next frame
    }
    
    if(interPoints.length > 1) {
        drawInterLinesRecursive(interPoints);
    }
}

function calculateBezierPoint(t, points) {
    if (points.length == 1) return points[0];
    var newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        let x = (1 - t) * points[i].x + t * points[i + 1].x;
        let y = (1 - t) * points[i].y + t * points[i + 1].y;
        newPoints.push({ x: x, y: y });
    }
    return calculateBezierPoint(t, newPoints);
}

// Function to draw resultant arc
function drawResultantArc() {
    if(!drawingArc) return;
    ctx.globalAlpha = BEZIER_CURVE_OPACITY;
    ctx.strokeStyle = BEZIER_CURVE_COLOR;
    ctx.beginPath();
    if (positions.length > 0) {
        for(let t = 0; t <= 1; t += 0.001){
            let point = calculateBezierPoint(t, positions);
            if (t === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }
}

// Function to get draggable elements position
function getDotPos(){
    var children = nodes.children;
    positions = []; // Clear previous positions
    for(var i = 0; i < children.length; i++){
        var child = children[i];
        positions[i] = {
            x: parseInt(child.style.left) + child.offsetWidth / 2,
            y: parseInt(child.style.top) + child.offsetHeight / 2
        };
    }
}

function generateNodes(){
    // Clear existing nodes
    nodes.innerHTML = '';
    positions = []; // Reset positions
    var numNodes = parseInt(numOfNodesField.value) || 0;
    for(let i = 0; i < numNodes; i++){
        var div = document.createElement("div");
        div.id = "draggableElement" + i;
        div.className = "draggable";
        div.innerHTML = i;
        div.style.position = "absolute"; // Ensure the position is absolute
        div.style.top = (100 * Math.floor(i / 8)) + "px";
        div.style.left = (100 * (i % 8)) + "px";
        div.addEventListener("mousedown", dragStart);
        nodes.append(div);
    }
}

// Update function for the loop
function update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLines();
    drawInterPoints(positions);
    drawInterLines();
    progressNum.innerHTML = `${Math.round(progress.value * 1000)/10}%`;
    if(drawingArc){
        drawResultantArc();
    }
}

// Init
setInterval(update, 16.66667);

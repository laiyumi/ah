// set up canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let currentLevel = 1;
let withinTargetTimer = null;
let brightness = 0;
let nextTargetCircleRadius = 100;

class Circle {
    constructor(x, y, radius, color, strokeColor, lineWidth) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.strokeColor = strokeColor;
        this.lineWidth = lineWidth;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth;
    }

    drawHollowCircle(color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = color; // Use the color argument here instead of this.strokeColor
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }

    updateRadius(newRadius) {
        // Smoothing factor, determines how quickly the radius adjusts towards the target (between 0 and 1)
        const smoothingFactor = 0.01;
        this.targetRadius = newRadius;
        this.radius += (this.targetRadius - this.radius) * smoothingFactor;
    }
}

class VolumeMeter {
    constructor() {
        this.threshold = 0.05; // Set a threshold level for gating
        // request access to the microphone
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);
            this.mic = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.scriptProcessor.connect(this.audioContext.destination);
            this.mic.connect(this.analyser);
            this.analyser.connect(this.scriptProcessor);

            // starts the volume meter
            this.scriptProcessor.onaudioprocess = e => {
                let array = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(array);
                let volume = Math.max(...array) / 255;
                this.volume = volume > this.threshold ? volume : 0; // Apply gating here
            };
        });
    }

    getVolume() {
        let scalingFactor = 0.7; // scale down the volume
        return this.volume * scalingFactor;
    }
}


// create a new volume meter and a circle
let volumeMeter = new VolumeMeter();
let circle = new Circle(canvas.width / 2, canvas.height / 2, 50, "black", null, null);
let targetCircle = new Circle(canvas.width / 2, canvas.height / 2, 100, null, "red", 5);

function animate() {
    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // get the volume and update the circle radius
    let volume = volumeMeter.getVolume();
    let newRadius = currentLevel === 1 ? Math.pow(volume, 2) * Math.max(canvas.width, canvas.height) : volume * 300;
    
    // draw the circle
    circle.draw();
    targetCircle.drawHollowCircle();
    circle.updateRadius(newRadius);

    if (currentLevel === 1) {
        circle.radius = 1.4 * Math.pow(volume, 2) * Math.max(canvas.width, canvas.height);
        targetCircle.radius = 0;
    }
    else {
        targetCircle.radius = nextTargetCircleRadius;
        let isWithinTarget = checkCollision(circle, targetCircle);
        let targetCircleColor = isWithinTarget ? 'green' : 'red';
        targetCircle.drawHollowCircle(targetCircleColor);
        if (isWithinTarget) {

            if (withinTargetTimer === null) {
                withinTargetTimer = setTimeout(() => {
                    document.body.style.backgroundColor = `hsl(0, 50%, ${255 - brightness}%)`;
                    console.log("you are within the target!");

                    // Generate a new radius for target circle between 100 and 200 when the user was within target for over 1 second
                    nextTargetCircleRadius = Math.floor(Math.random() * (200 - 100 + 1)) + 100;

                    withinTargetTimer = null;
                }, 1000);
            }
        } else {
            if (withinTargetTimer !== null) {
                clearTimeout(withinTargetTimer);
                withinTargetTimer = null;
            }
        }
        circle.radius = volume * 150;
    }

    // circle radius should not be below 5
    circle.radius = Math.max(circle.radius, 5);

    // change the background color
    changeBgColor(targetCircle, circle);

    // check if the level is completed
    if (checkLevelCompletion()) {
        currentLevel++;
    }

    // call the animate function again
    requestAnimationFrame(animate);
}


function checkCollision(currentCircle, targetCircle) {
    // set the threshold for collision
    let radiusdiff = currentCircle.radius - targetCircle.radius;

    if (Math.abs(radiusdiff) <= 20) {
        console.log("within target!");
        // console.log(radiusdiff);
        return true;
    } else {
        return false;
    }
}

// Notes: For level 1, you could interpret the "fill up the entire screen" as that the circle diameter 
// needs to be larger than or equal to the window's diagonal for the circle to appear to fill the screen.
function checkLevelCompletion() {
    switch (currentLevel) {
        case 1:
            let diag = Math.sqrt(canvas.width ** 2 +
                canvas.height ** 2);
            // return true if the circle's diameter is >= window's diagonal
            if (circle.radius >= diag / 2) {
                console.log("Level 1 completed!");
                return true;
            }
            break;

        // case 2:
        // add conditions for level 2 and so on...
        // default:
        // handle levels that you have not programmed yet
    }
    return false;
}

function changeBgColor(circle1, circle2) {
    // set the threshold for collision
    let radiusdiff = Math.abs(circle1.radius - circle2.radius);
   
    // map the radius difference to a value between 0 - 255
    brightness = Math.floor(radiusdiff * 2.55);
    // make sure the brightness is between 0 and 255
    brightness = Math.min(Math.max(brightness, 0), 255);
    
    // use HSL to set the background color
    document.body.style.backgroundColor = `hsl(0, 0%, ${brightness}%)`;
}



// call the volume meter after the page is loaded
window.onload = function () {
    animate();
}
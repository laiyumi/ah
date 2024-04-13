// set up canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Circle{
    constructor(x, y, radius, color, strokeColor, lineWidth){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.strokeColor = strokeColor;
        this.lineWidth = lineWidth;
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth;
    }

    drawHollowCircle(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }

}

class VolumeMeter {
    constructor() {
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
                this.volume = Math.max(...array) / 255;
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
let circle = new Circle(canvas.width/2, canvas.height/2, 50, "black", null, null);
let targetCircle = new Circle(canvas.width/2, canvas.height/2, 100, null, "red", 5);

function animate(){
    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw the circle
    circle.draw();
    targetCircle.drawHollowCircle();


    // get the volume and update the circle radius
    let volume = volumeMeter.getVolume();
    circle.radius = volume * 150;

    // call the animate function again
    requestAnimationFrame(animate);

    checkCollision(targetCircle, circle);

}

function checkCollision(circle1, circle2){
    // set the threshold for collision
    let radiusdiff = circle1.radius - circle2.radius;

    if(Math.abs(radiusdiff) < 10){
        console.log("you got it!!");
        console.log(radiusdiff);

        return true;
    } else {
        return false;
    }
}


// call the volume meter after the page is loaded
window.onload = function() {
    animate();
}
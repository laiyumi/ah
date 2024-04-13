// set up canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Circle{
    constructor(x, y, radius, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
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
let circle = new Circle(canvas.width/2, canvas.height/2, 50, "black");

function animate(){
    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw the circle
    circle.draw();

    // get the volume and update the circle radius
    let volume = volumeMeter.getVolume();
    circle.radius = volume * 100;

    // call the animate function again
    requestAnimationFrame(animate);
}


// call the volume meter after the page is loaded
window.onload = function() {
    animate();
}
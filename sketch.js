// Size and Dynamics
let baseDiameter = 50;
let maxDiameter = 500;

// Interaction state
let isDragging = false;
let dragOffsetX, dragOffsetY;

// Timer
let timeSettled = 0;
const shrinkDelay = 1000;
    
let allEyes = []; // An array to hold all our eye pair objects
let bgColor, pupilColor; // For the random colors
const colorChangeThreshold = 50; // PUPIL SPEED THRESHOLD FOR COLOR CHANGE


const pupilGravity = 5;
const pupilFriction = 0.98;
const jiggleAmount = 0.4;
const bounceFactor = -0.8; // Controls bounciness. -1 is a perfect bounce


function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight(4);
  resetSketch(); // Call our new function to start everything
}


function draw() {
  background(bgColor);

  // The main interactive eye is always the first one in the array
  let mainEye = allEyes[0];

  // --- INTERACTION LOGIC (This only affects the main eye) ---
  let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  if (isDragging) {
    mainEye.x = mouseX + dragOffsetX;
    mainEye.y = mouseY + dragOffsetY;
    if (mouseSpeed > 100) {

        // NEW: Calculate a dynamic target diameter based on speed.
        // A slow drag (speed 5) targets a small size. A fast drag (speed 60) targets the max size.
        let targetDiameter = map(mouseSpeed, 5, 60, mainEye.diameter, maxDiameter);


        mainEye.diameter = lerp(mainEye.diameter, maxDiameter, 0.05); // Smooth grow
        timeSettled = 0;
    } else {
        if (timeSettled === 0) timeSettled = millis();
        }
    } else {
        if (timeSettled === 0) timeSettled = millis();
        }
    if (timeSettled > 0 && millis() - timeSettled > shrinkDelay) {
        mainEye.diameter = lerp(mainEye.diameter, baseDiameter, 0.05);
    }
  mainEye.diameter = constrain(mainEye.diameter, baseDiameter, maxDiameter);

  // --- UPDATE AND DISPLAY ALL EYES (The new core loop) ---
  // We loop backwards so we can safely remove items from the array
  for (let i = allEyes.length - 1; i >= 0; i--) {
    let eye = allEyes[i];
    eye.update(); // Tell the eye to update its physics
    
    // Check if a hard bounce happened
    if (eye.checkBounce()) {
      // Change colors
      bgColor = color(random(150, 255), random(150, 255), random(150, 255));
      pupilColor = color(random(100));

      // GENERATIVE PART: If it was the main eye, add a new static eye pair
      if (i === 0) {
        let padding = mainEye.diameter / 2;
        
        let newX = random(padding, width - padding);
        let newY = random(padding, height - padding);

        allEyes.push(new EyePair(newX, newY, mainEye.diameter));
      }
    }
    
    // This is a bonus: make older, "stamped" eyes slowly shrink and disappear
    if (i > 0) { // This doesn't affect the main eye
      eye.diameter = lerp(eye.diameter, 0, 0.005);
      // If an eye is too small, remove it from our list so the sketch doesn't slow down
      if (eye.diameter < 1) {
        allEyes.splice(i, 1); 
      }
    }

    eye.display(); // Tell the eye to draw itself
  }
}


function mousePressed() {
  let mainEye = allEyes[0]; // Get the main eye from the array
  let currentOffset = map(mainEye.diameter, baseDiameter, maxDiameter, 30, 280);
  let leftEyeX = mainEye.x - currentOffset;
  let rightEyeX = mainEye.x + currentOffset;
  let eyeRadius = mainEye.diameter / 2;
  let distL = dist(mouseX, mouseY, leftEyeX, mainEye.y);
  let distR = dist(mouseX, mouseY, rightEyeX, mainEye.y);

  if (distL < eyeRadius || distR < eyeRadius) {
    isDragging = true;
    dragOffsetX = mainEye.x - mouseX;
    dragOffsetY = mainEye.y - mouseY;
    timeSettled = 0;
  }
}


function mouseReleased() {
  // Always stop dragging when the mouse is released
  isDragging = false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// NEW! Reset the sketch with a key press
function keyPressed() {
  resetSketch();
}

function resetSketch() {
    allEyes = []; // Empty the array of all eyes
    
    // Create the very first, interactive pair of eyes using our new class blueprint
    // and add it to the array.
    allEyes.push(new EyePair(width / 2, height / 2, baseDiameter));
    
    // Set the initial colors
    bgColor = color(242, 197, 61);
    pupilColor = color(0);
}


// =============================================================
//  THE EYE PAIR CLASS (Our Blueprint)
// =============================================================
class EyePair {
    constructor(x, y, diameter) {
        // --- Position and Size ---
        this.x = x;
        this.y = y;
        this.diameter = diameter;
        this.baseDiameter = diameter;

        // --- Physics State ---
        this.pupilLX = this.x; this.pupilLY = this.y;
        this.pupilLVX = 0; this.pupilLVY = 0;
        this.pupilRX = this.x; this.pupilRY = this.y;
        this.pupilRVX = 0; this.pupilRVY = 0;
        this.prevX = this.x; this.prevY = this.y;
    }

  // A function to update the physics and state of this specific eye pair
    update() {
        let eyeAccelX = this.x - this.prevX;
        let eyeAccelY = this.y - this.prevY;

        // Update pupil physics (same as before, but using 'this.')
        this.pupilLVX += -eyeAccelX * 0.5; this.pupilLVY += -eyeAccelY * 0.5;
        this.pupilLVY += pupilGravity;
        this.pupilLVX += random(-jiggleAmount, jiggleAmount); this.pupilLVY += random(-jiggleAmount, jiggleAmount);
        this.pupilLVX *= pupilFriction; this.pupilLVY *= pupilFriction;
        this.pupilLX += this.pupilLVX; this.pupilLY += this.pupilLVY;
        
        this.pupilRVX += -eyeAccelX * 0.5; this.pupilRVY += -eyeAccelY * 0.5;
        this.pupilRVY += pupilGravity;
        this.pupilRVX += random(-jiggleAmount, jiggleAmount); this.pupilRVY += random(-jiggleAmount, jiggleAmount);
        this.pupilRVX *= pupilFriction; this.pupilRVY *= pupilFriction;
        this.pupilRX += this.pupilRVX; this.pupilRY += this.pupilRVY;

        // Remember position for next frame
        this.prevX = this.x;
        this.prevY = this.y;
    }

    // A function to handle constraints and return 'true' if a hard bounce happened
    checkBounce() {
        let eyeOffset = map(this.diameter, baseDiameter, maxDiameter, 30, 280);
        let leftEyeX = this.x - eyeOffset;
        let rightEyeX = this.x + eyeOffset;
        let pupilDiameter = this.diameter / 2;
        let maxDist = (this.diameter / 2) - (pupilDiameter / 2);
        let bounceOccurred = false;

        // Left Pupil
        let distL = dist(this.pupilLX, this.pupilLY, leftEyeX, this.y);
        if (distL > maxDist) {
        // THRESHOLD CHECK: Calculate the speed of impact
        let impactSpeed = abs(this.pupilLVX) + abs(this.pupilLVY);
        if (impactSpeed > colorChangeThreshold) {
            bounceOccurred = true; // It was a hard bounce!
        }
        let angle = atan2(this.pupilLY - this.y, this.pupilLX - leftEyeX);
        this.pupilLX = leftEyeX + cos(angle) * maxDist;
        this.pupilLY = this.y + sin(angle) * maxDist;
        this.pupilLVX *= bounceFactor; this.pupilLVY *= bounceFactor;
        }

        // Right Pupil
        let distR = dist(this.pupilRX, this.pupilRY, rightEyeX, this.y);
        if (distR > maxDist) {
            // THRESHOLD CHECK
            let impactSpeed = abs(this.pupilRVX) + abs(this.pupilRVY);
            if (impactSpeed > colorChangeThreshold) {
                bounceOccurred = true; // It was a hard bounce!
            }
        let angle = atan2(this.pupilRY - this.y, this.pupilRX - rightEyeX);
        this.pupilRX = rightEyeX + cos(angle) * maxDist;
        this.pupilRY = this.y + sin(angle) * maxDist;
        this.pupilRVX *= bounceFactor; this.pupilRVY *= bounceFactor;
        }
        
        return bounceOccurred; // Tell the main sketch if a hard bounce happened
    }

    // A function to draw this specific eye pair
    display() {
        let eyeOffset = map(this.diameter, baseDiameter, maxDiameter, 30, 280);
        let leftEyeX = this.x - eyeOffset;
        let rightEyeX = this.x + eyeOffset;
        let pupilDiameter = this.diameter / 2;
        let eyeRadius = this.diameter / 2;

        if (this === allEyes[0]) {
            // --- NEW PROPORTIONAL STROKE LOGIC ---
            // Map the current diameter to a desired stroke weight range.
            // When the eye is small (baseDiameter), stroke is thin (2).
            // When the eye is big (maxDiameter), stroke is thick (15).
            let proportionalStrokeWeight = map(this.diameter, baseDiameter, maxDiameter, 3, 15);
            strokeWeight(proportionalStrokeWeight);

            let h_distL = dist(mouseX, mouseY, leftEyeX, this.y);
            let h_distR = dist(mouseX, mouseY, rightEyeX, this.y);
            if ((h_distL < eyeRadius || h_distR < eyeRadius) && !isDragging) {
                stroke(255, 200, 0); // Hover color
            } else {
                stroke(0); // Default color
            }
            } else {
            noStroke(); // "Stamped" eyes have no outline
            }

        fill(255);
        ellipse(leftEyeX, this.y, this.diameter, this.diameter);
        ellipse(rightEyeX, this.y, this.diameter, this.diameter);
        fill(pupilColor);
        ellipse(this.pupilLX, this.pupilLY, pupilDiameter, pupilDiameter);
        ellipse(this.pupilRX, this.pupilRY, pupilDiameter, pupilDiameter);
    }
}
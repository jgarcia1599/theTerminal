var readied = false;

var randomness = 0; //Performance mode: 0, Random mode:1

var video;
var playing = true; //video playing or not

var img;
var bg;
var song;
var images = [];
var index = Math.floor(Math.random() * 4); //Randomly select an image out of the images array
var seconds = 5; //Change this variable if you want to change the number of seconds your face changes

var poseNet;
var poses = [];
var noseX = 0;
var noseY = 0;
var eardist;

var boxWidth;
var stage = 0; //for the exit box, stage 0: stick figure, stage 1: transition animation, stage 2: real footage
//for the transition animation
var currentView;
var cnt = 1;
var maxCnt = 40;

var left, right; //left and right wrist

function preload() {
  soundFormats("mp3", "ogg");
  song = loadSound(
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2Fsong.mp3?v=1570150922596"
  );
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  img = createImg(
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2Fhead.png?v=1570155577606"
  );

  images[0] = createImg(
    //Beethoven
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2Fhead.png?v=1570155577606"
  );
  images[1] = createImg(
    //Meme Face
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2FTrollFace.jpg?v=1570205411060"
  );
  images[2] = createImg(
    //Trump
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2Ftrump-cohen-stormy.jpg?v=1570205384911"
  );
  images[3] = createImg(
    //doggo
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2FIMG_2057.jpg?v=1570205456516"
  );

  bg = createImg(
    //background
    "https://cdn.glitch.com/7c3144ad-af9c-4893-b315-7f033f617bbc%2Fbg.jpg?v=1570208099139"
  );

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function(results) {
    poses = results;
  });
}

function draw() {
  if (readied) {
    push();
    image(bg, 0, 0, width, height);
    pop();
    if (stage == 0) {
      push();
      translate(width, 0);
      scale(-width / 640, width / 640);
      if (poses.length > 0) {
        drawKeypoints();
        drawSkeleton();
      }

      //Get the position of the nose to attach the image on, update it every 5 frames to avoid too much noise movement
      if (frameCount % 5 == 0) {
        getNose();
        play_song();
      }
      var changetime = seconds * 60;
      if (frameCount % changetime == 0) {
        index = Math.floor(Math.random() * 4);
      }

      drawImages(); //draw images for all poses
      pop();
    } else if (stage == 1) {
      for (let i = 0; i <= cnt; i++) {
        for (let j = 0; j <= cnt; j++) {
          image(
            currentView,
            (i * width) / cnt,
            (j * height) / cnt,
            width / cnt,
            height / cnt
          );
        }
      }
      if (frameCount % 3 == 0) {
        cnt++;
      } //update every 3 frames
      if (cnt >= maxCnt) {
        stage = 2;
      }
    } else if (stage == 2) {
      if (cnt == maxCnt) {
        push();
        video.pause();
        currentView = video.get();
        pop();
      }

      if (cnt >= 1) {
        translate(width, 0);
        scale(-1.0, 1.0);
        for (let i = 0; i <= cnt; i++) {
          for (let j = 0; j <= cnt; j++) {
            image(
              currentView,
              (i * width) / cnt,
              (j * height) / cnt,
              width / cnt,
              height / cnt
            );
          }
        }
        if (frameCount % 3 == 0) {
          cnt--;
        } //update every 3 frames
      } else {
        video.loop();
        push();
        translate(width, 0);
        scale(-width / 640, width / 640);
        currentView = video.get();
        image(currentView, 0, 0, width / 2, height / 2);
        pop();
      }
    }
    showButton();
  }
}

function modelReady() {
  console.log("Model Ready");
  readied = true;
}

function drawKeypoints() {
  var maxI;
  if (randomness == 0) {
    maxI = 1;
  } else {
    maxI = poses.length;
  }
  for (let i = 0; i < maxI; i++) {
    let pose = poses[i].pose;
    for (let j = 5; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder) (start from 5 to omit facial points)
      let keypoint = pose.keypoints[j];
      // Only draw a dot if the pose probability is bigger than 0.15
      if (keypoint.score > 0.15) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}
function drawImages() {
  var nosex,nosey,pose,earL,earR,earDistance,angle;
  for (let i = 0; i < poses.length; i++) {
     nosex = poses[i].pose.keypoints[0].position.x;
     nosey = poses[i].pose.keypoints[0].position.y;

     pose = poses[i].pose;
    // Actual left ear point position
     earL = pose["leftEar"];
    // Actual right ear point position
     earR = pose["rightEar"];

     earDistance = sqrt((earL.x - earR.x) ** 2 + (earL.y - earR.y) ** 2);
     angle = atan((earL.y - earR.y) / (earL.x - earR.x));

    if (poses[i].pose.keypoints[0].score > 0.8) {
      //optimize image placement with a confidence of 80% based on the nose

      if (randomness == 0) {
        push();
        translate(noseX, noseY);
        rotate(angle);
        image(
          img,
          0 - (earDistance * 1.5) / 2,
          0 - (earDistance * 1.5) / 2,
          earDistance * 1.5,
          earDistance * 1.5
        );
        pop();
      } else {
        push();
        translate(noseX, noseY);
        console.log(earDistance);
        rotate(angle);
        image(
          images[index],
          0 - (earDistance * 1.5) / 2,
          0 - (earDistance * 1.5) / 2,
          earDistance * 1.5,
          earDistance * 1.5
        );
        pop();
        break;
      }
    }
  }
}

function drawSkeleton() {
  var maxI;
  if (randomness == 0) {
    maxI = 1;
  } else {
    maxI = poses.length;
  }
  for (let i = 0; i < maxI; i++) {
    let skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 100, 100);
      strokeWeight(2);
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y
      );
    }
  }
}

function calc_ear_distance() {
  if (poses.length > 0) {
    let pose = poses[0].pose;
    // Actual left ear point position
    var earL = pose["leftEar"];
    // Actual right ear point position
    var earR = pose["rightEar"];

    return (earDistance = sqrt(
      (earL.x - earR.x) ** 2 + (earL.y - earR.y) ** 2
    ));
  }
}

//Get the position of the nose
function getNose() {
  if (poses.length > 0) {
    //Make sure there is at least one pose
    noseX = poses[0].pose.keypoints[0].position.x;
    noseY = poses[0].pose.keypoints[0].position.y;
  }
}

function keyPressed() {
  if (keyCode === 32) {
    if (playing) {
      video.pause();
      playing = false;
    } else {
      video.loop();
      playing = true;
    }
  }
}

//Show the exit button
function showButton() {
  if (!playing) {
    boxWidth = textWidth("Exit The Terminal") + 40;
    if (mouseHover()) {
      fill(255, 0, 0);
    } else {
      noFill();
    }
    stroke(255);
    strokeWeight(2);
    rect(width - 220, height - 80, boxWidth, 50);
    textSize(20);
    textAlign(LEFT);
    fill(0);
    strokeWeight(1);
    fill(255);
    text("Exit The Terminal", width - 200, height - 50);
  }
}

function play_song() {
  if (poses.length > 0) {
    if (playing == false) {
      poses[0].pose["leftWrist"].y = height;
      poses[0].pose["rightWrist"].y = height;
    }
    let pose = poses[0].pose;
    left = pose["leftWrist"];
    right = pose["rightWrist"];
  
    if (left.y < height / 4 && right.y < height / 4) {
      if (!song.isPlaying()) {
        if (song.currentTime() >= song.duration()) {
          song.stop();
        }
        song.play();
      }
    } else {
      if (song.isPlaying()) {
        song.pause();
      }
    }
  }
}

//Check if mouse is hovered above the exit box
function mouseHover() {
  if (
    mouseX > width - 220 &&
    mouseX < width - 220 + boxWidth &&
    mouseY > height - 80 &&
    mouseY < height - 30
  )
    return true;
}

//Check if the user click on the exit box
function mouseClicked() {
  if (
    mouseX > width - 220 &&
    mouseX < width - 220 + boxWidth &&
    mouseY > height - 80 &&
    mouseY < height - 30
  ) {
    stage = 1;
    currentView = get();
    playing = true;
  }
}

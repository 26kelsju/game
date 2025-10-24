// Game variables
let score = 0;
let targetSize = 1;
let targetSpeed = 2000;
let gameActive = true;
let timeLeft = 30;
let gameTimer;
let spawnInterval;
let targetShape = 'cylinder';
let shapeIndex = 0;
const shapes = ['cylinder', 'box', 'sphere', 'cone'];
const shapeColors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];

// Movement variables
let rig;
let camera;
let leftController;
let rightController;
let moveSpeed = 0.05;
let rotateSpeed = 1;

// Current thumbstick states
let leftThumbstick = {x: 0, y: 0};
let rightThumbstick = {x: 0, y: 0};
let movementInterval;

// Wait for A-frame scene to load
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('a-scene').addEventListener('loaded', function() {
        console.log('Scene loaded, starting game...');
        rig = document.querySelector('#rig');
        camera = document.querySelector('#camera');
        leftController = document.querySelector('#leftController');
        rightController = document.querySelector('#rightController');
        
        setupVRControllers();
        setupKeyboardControls();
        startMovementLoop();
        startGame();
    });
});

function setupVRControllers() {
    console.log('Setting up VR controllers...');
    
    if (rightController) {
        rightController.addEventListener('triggerdown', handleControllerClick);
        rightController.addEventListener('gripdown', handleControllerClick);
        
        // Right thumbstick events
        rightController.addEventListener('thumbstickmoved', function(event) {
            rightThumbstick.x = event.detail.x;
            rightThumbstick.y = event.detail.y;
            console.log('Right thumbstick:', rightThumbstick);
        });
        
        rightController.addEventListener('thumbstickdown', function() {
            console.log('Right thumbstick pressed');
        });
    }
    
    if (leftController) {
        leftController.addEventListener('triggerdown', handleControllerClick);
        leftController.addEventListener('gripdown', handleControllerClick);
        
        // Left thumbstick events
        leftController.addEventListener('thumbstickmoved', function(event) {
            leftThumbstick.x = event.detail.x;
            leftThumbstick.y = event.detail.y;
            console.log('Left thumbstick:', leftThumbstick);
        });
        
        leftController.addEventListener('thumbstickdown', function() {
            console.log('Left thumbstick pressed');
        });
    }
    
    console.log('VR controllers setup complete');
}

function setupKeyboardControls() {
    // Desktop keyboard controls
    document.addEventListener('keydown', function(event) {
        if (!gameActive) return;
        
        const currentPos = rig.getAttribute('position');
        const currentRot = rig.getAttribute('rotation');
        let newPos = {x: currentPos.x, y: currentPos.y, z: currentPos.z};
        let newRot = {x: currentRot.x, y: currentRot.y, z: currentRot.z};
        
        switch(event.code) {
            case 'KeyW': // Forward
                newPos.z -= moveSpeed * 10;
                break;
            case 'KeyS': // Backward
                newPos.z += moveSpeed * 10;
                break;
            case 'KeyA': // Left
                newPos.x -= moveSpeed * 10;
                break;
            case 'KeyD': // Right
                newPos.x += moveSpeed * 10;
                break;
            case 'KeyQ': // Up
                newPos.y += moveSpeed * 10;
                break;
            case 'KeyE': // Down
                newPos.y -= moveSpeed * 10;
                break;
            case 'ArrowLeft':
                newRot.y -= 5;
                break;
            case 'ArrowRight':
                newRot.y += 5;
                break;
        }
        
        rig.setAttribute('position', newPos);
        rig.setAttribute('rotation', newRot);
    });
}

function startMovementLoop() {
    // Movement loop that runs continuously
    movementInterval = setInterval(function() {
        if (!gameActive) return;
        
        const currentPos = rig.getAttribute('position');
        const currentRot = rig.getAttribute('rotation');
        let newPos = {x: currentPos.x, y: currentPos.y, z: currentPos.z};
        let newRot = {x: currentRot.x, y: currentRot.y, z: currentRot.z};
        let moved = false;
        
        // Left thumbstick movement (with deadzone)
        if (Math.abs(leftThumbstick.x) > 0.2 || Math.abs(leftThumbstick.y) > 0.2) {
            // Calculate movement based on camera rotation
            const radians = (currentRot.y * Math.PI) / 180;
            
            // Forward/backward movement
            if (Math.abs(leftThumbstick.y) > 0.2) {
                newPos.x += Math.sin(radians) * leftThumbstick.y * moveSpeed;
                newPos.z += Math.cos(radians) * leftThumbstick.y * moveSpeed;
                moved = true;
            }
            
            // Left/right strafe
            if (Math.abs(leftThumbstick.x) > 0.2) {
                newPos.x += Math.cos(radians) * leftThumbstick.x * moveSpeed;
                newPos.z -= Math.sin(radians) * leftThumbstick.x * moveSpeed;
                moved = true;
            }
        }
        
        // Right thumbstick rotation (with deadzone)
        if (Math.abs(rightThumbstick.x) > 0.2) {
            newRot.y += rightThumbstick.x * rotateSpeed;
            moved = true;
        }
        
        // Right thumbstick vertical movement (up/down)
        if (Math.abs(rightThumbstick.y) > 0.2) {
            newPos.y -= rightThumbstick.y * moveSpeed;
            moved = true;
        }
        
        // Apply movement if any occurred
        if (moved) {
            // Keep within bounds
            newPos.x = Math.max(-18, Math.min(18, newPos.x));
            newPos.y = Math.max(0.5, Math.min(10, newPos.y));
            newPos.z = Math.max(-18, Math.min(18, newPos.z));
            
            rig.setAttribute('position', newPos);
            rig.setAttribute('rotation', newRot);
        }
    }, 16); // ~60 FPS
}

function handleControllerClick(event) {
    // Get the intersected element from the raycaster
    const raycaster = event.target.components.raycaster;
    if (raycaster && raycaster.intersectedEls.length > 0) {
        const intersectedEl = raycaster.intersectedEls[0];
        
        // Trigger click event on the intersected element
        intersectedEl.emit('click');
    }
}

function startGame() {
    console.log('Starting game...');
    // Reset game state
    score = 0;
    timeLeft = 30;
    gameActive = true;
    
    // Reset player position
    rig.setAttribute('position', '0 0 3');
    rig.setAttribute('rotation', '0 0 0');
    
    // Update displays
    updateScore();
    updateTimer();
    
    // Hide game over screen
    document.querySelector('#gameOverScreen').setAttribute('visible', 'false');
    
    // Clear any existing intervals
    if (gameTimer) clearInterval(gameTimer);
    if (spawnInterval) clearInterval(spawnInterval);
    
    // Start game timer (counts down every second)
    gameTimer = setInterval(function() {
        timeLeft--;
        console.log('Time left:', timeLeft);
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Start spawning targets
    setTimeout(() => {
        spawnTarget();
        spawnInterval = setInterval(spawnTarget, 3000);
    }, 1000);
    
    // Setup controls
    setupControls();
}

function updateTimer() {
    const timerText = document.querySelector('#timerText');
    timerText.setAttribute('value', `Time: ${timeLeft}`);
    
    // Change color as time runs out
    if (timeLeft <= 10) {
        timerText.setAttribute('color', 'red');
    } else if (timeLeft <= 20) {
        timerText.setAttribute('color', 'orange');
    } else {
        timerText.setAttribute('color', 'green');
    }
}

function updateScore() {
    document.querySelector('#scoreText').setAttribute('value', `Score: ${score}`);
}

function endGame() {
    console.log('Game ended!');
    gameActive = false;
    
    // Stop timers
    clearInterval(gameTimer);
    clearInterval(spawnInterval);
    if (movementInterval) clearInterval(movementInterval);
    
    // Remove all remaining targets
    const targets = document.querySelectorAll('.target');
    targets.forEach(target => {
        if (target.parentNode) {
            target.parentNode.removeChild(target);
        }
    });
    
    // Show game over screen
    const gameOverScreen = document.querySelector('#gameOverScreen');
    const finalScoreText = document.querySelector('#finalScoreText');
    
    finalScoreText.setAttribute('value', `Final Score: ${score}`);
    gameOverScreen.setAttribute('visible', 'true');
    
    // Add restart functionality
    gameOverScreen.addEventListener('click', function() {
        startMovementLoop(); // Restart movement loop
        startGame();
    });
}

function spawnTarget() {
    if (!gameActive) return;
    
    const scene = document.querySelector('a-scene');
    let target;
    
    // Random position across larger area
    const x = (Math.random() - 0.5) * 16;
    const startY = -2;
    const z = (Math.random() - 0.5) * 16;
    
    // Create different shapes based on current setting
    switch(targetShape) {
        case 'cylinder':
            target = document.createElement('a-cylinder');
            target.setAttribute('radius', targetSize);
            target.setAttribute('height', '0.2');
            break;
        case 'box':
            target = document.createElement('a-box');
            target.setAttribute('width', targetSize);
            target.setAttribute('height', targetSize);
            target.setAttribute('depth', targetSize);
            break;
        case 'sphere':
            target = document.createElement('a-sphere');
            target.setAttribute('radius', targetSize * 0.7);
            break;
        case 'cone':
            target = document.createElement('a-cone');
            target.setAttribute('radius-bottom', targetSize);
            target.setAttribute('radius-top', '0');
            target.setAttribute('height', targetSize * 1.5);
            break;
    }
    
    // Set common properties
    target.setAttribute('position', `${x} ${startY} ${z}`);
    target.setAttribute('color', shapeColors[shapeIndex]);
    target.setAttribute('class', 'target');
    
    //

// Game Variables
let score = 0;
let timeLeft = 30;
let gameActive = false;
let targetSize = 1;
let targetSpeed = 2000;
let targetShape = 'cylinder';
let shapeIndex = 0;

// Constants
const SHAPES = ['cylinder', 'box', 'sphere', 'cone'];
const SHAPE_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
const SPAWN_INTERVAL = 3000;
const GAME_DURATION = 30;

// Game Elements
let scene, playerRig, leftHand, rightHand;

// Timers
let gameTimer, spawnTimer, movementTimer;

// Movement
let moveSpeed = 0.1;
let rotateSpeed = 2;
let leftStick = { x: 0, y: 0 };
let rightStick = { x: 0, y: 0 };

// Initialize Game
document.addEventListener('DOMContentLoaded', function() {
    scene = document.querySelector('a-scene');
    scene.addEventListener('loaded', function() {
        initializeGame();
    });
});

function initializeGame() {
    console.log('Initializing game...');
    
    // Get game elements
    playerRig = document.querySelector('#playerRig');
    leftHand = document.querySelector('#leftHand');
    rightHand = document.querySelector('#rightHand');
    
    setupControls();
    setupMovement();
    startGame();
}

function setupControls() {
    // VR Controller Events
    if (leftHand) {
        leftHand.addEventListener('triggerdown', handleShoot);
        leftHand.addEventListener('gripdown', handleShoot);
        leftHand.addEventListener('thumbstickmoved', function(event) {
            leftStick.x = event.detail.x;
            leftStick.y = event.detail.y;
        });
    }
    
    if (rightHand) {
        rightHand.addEventListener('triggerdown', handleShoot);
        rightHand.addEventListener('gripdown', handleShoot);
        rightHand.addEventListener('thumbstickmoved', function(event) {
            rightStick.x = event.detail.x;
            rightStick.y = event.detail.y;
        });
    }
    
    // Control Panel Events
    document.querySelector('#sizeBtn').addEventListener('click', changeSize);
    document.querySelector('#speedBtn').addEventListener('click', changeSpeed);
    document.querySelector('#shapeBtn').addEventListener('click', changeShape);
    document.querySelector('#gameOverScreen').addEventListener('click', restartGame);
    
    // Keyboard Controls
    document.addEventListener('keydown', handleKeyboard);
    
    console.log('Controls setup complete');
}

function setupMovement() {
    movementTimer = setInterval(function() {
        if (!gameActive) return;
        updateMovement();
    }, 16); // 60 FPS
}

function updateMovement() {
    const currentPos = playerRig.getAttribute('position');
    const currentRot = playerRig.getAttribute('rotation');
    
    let newPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
    let newRot = { x: currentRot.x, y: currentRot.y, z: currentRot.z };
    let moved = false;
    
    // Left stick movement with deadzone
    if (Math.abs(leftStick.x) > 0.15 || Math.abs(leftStick.y) > 0.15) {
        const radians = (currentRot.y * Math.PI) / 180;
        
        // Forward/backward movement
        if (Math.abs(leftStick.y) > 0.15) {
            newPos.x += Math.sin(radians) * leftStick.y * moveSpeed;
            newPos.z += Math.cos(radians) * leftStick.y * moveSpeed;
            moved = true;
        }
        
        // Strafe left/right
        if (Math.abs(leftStick.x) > 0.15) {
            newPos.x += Math.cos(radians) * leftStick.x * moveSpeed;
            newPos.z -= Math.sin(radians) * leftStick.x * moveSpeed;
            moved = true;
        }
    }
    
    // Right stick rotation and vertical movement
    if (Math.abs(rightStick.x) > 0.15) {
        newRot.y += rightStick.x * rotateSpeed;
        moved = true;
    }
    
    if (Math.abs(rightStick.y) > 0.15) {
        newPos.y -= rightStick.y * moveSpeed;
        moved = true;
    }
    
    if (moved) {
        // Apply boundaries
        newPos.x = Math.max(-20, Math.min(20, newPos.x));
        newPos.y = Math.max(0.5, Math.min(15, newPos.y));
        newPos.z = Math.max(-20, Math.min(20, newPos.z));
        
        playerRig.setAttribute('position', newPos);
        playerRig.setAttribute('rotation', newRot);
    }
}

function handleKeyboard(event) {
    if (!gameActive) return;
    
    const currentPos = playerRig.getAttribute('position');
    const currentRot = playerRig.getAttribute('rotation');
    let newPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };
    let newRot = { x: currentRot.x, y: currentRot.y, z: currentRot.z };
    
    const moveAmount = 0.5;
    const rotateAmount = 5;
    
    switch(event.code) {
        case 'KeyW': newPos.z -= moveAmount; break;
        case 'KeyS': newPos.z += moveAmount; break;
        case 'KeyA': newPos.x -= moveAmount; break;
        case 'KeyD': newPos.x += moveAmount; break;
        case 'KeyQ': newPos.y += moveAmount; break;
        case 'KeyE': newPos.y -= moveAmount; break;
        case 'ArrowLeft': newRot.y -= rotateAmount; break;
        case 'ArrowRight': newRot.y += rotateAmount; break;
    }
    
    // Apply boundaries
    newPos.x = Math.max(-20, Math.min(20, newPos.x));
    newPos.y = Math.max(0.5, Math.min(15, newPos.y));
    newPos.z = Math.max(-20, Math.min(20, newPos.z));
    
    playerRig.setAttribute('position', newPos);
    playerRig.setAttribute('rotation', newRot);
}

function handleShoot(event) {
    if (!gameActive) return;
    
    const raycaster = event.target.components.raycaster;
    if (raycaster && raycaster.intersectedEls.length > 0) {
        const target = raycaster.intersectedEls[0];
        
        if (target.classList.contains('target')) {
            destroyTarget(target);
        } else if (target.classList.contains('control')) {
            target.emit('click');
        }
    }
}

function startGame() {
    console.log('Starting new game...');
    
    // Reset game state
    score = 0;
    timeLeft = GAME_DURATION;
    gameActive = true;
    
    // Reset player position
    playerRig.setAttribute('position', '0 1.6 5');
    playerRig.setAttribute('rotation', '0 0 0');
    
    // Update UI
    updateScore();
    updateTimer();
    hideGameOver();
    
    // Clear existing timers
    clearGameTimers();
    
    // Start game timer
    gameTimer = setInterval(function() {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Start spawning targets
    spawnTarget();
    spawnTimer = setInterval(spawnTarget, SPAWN_INTERVAL);
}

function endGame() {
    console.log('Game ended');
    gameActive = false;
    clearGameTimers();
    removeAllTargets();
    showGameOver();
}

function restartGame() {
    hideGameOver();
    startGame();
}

function clearGameTimers() {
    if (gameTimer) clearInterval(gameTimer);
    if (spawnTimer) clearInterval(spawnTimer);
}

function spawnTarget() {
    if (!gameActive) return;
    
    const target = createTarget();
    const position = getRandomPosition();
    
    target.setAttribute('position', `${position.x} ${position.startY} ${position.z}`);
    target.setAttribute('color', SHAPE_COLORS[shapeIndex]);
    target.setAttribute('class', 'target clickable');
    
    // Add click event for non-VR interaction
    target.addEventListener('click', function() {
        if (gameActive) {
            destroyTarget(target);
        }
    });
    
    scene.appendChild(target);
    animateTarget(target, position);
}

function createTarget() {
    let target;
    
    switch(targetShape) {
        case 'cylinder':
            target = document.createElement('a-cylinder');
            target.setAttribute('radius', targetSize);
            target.setAttribute('height', 0.3);
            break;
        case 'box':
            target = document.createElement('a-box');
            target.setAttribute('width', targetSize);
            target.setAttribute('height', targetSize);
            target.setAttribute('depth', targetSize);
            break;
        case 'sphere':
            target = document.createElement('a-sphere');
            target.setAttribute('radius', targetSize * 0.8);
            break;
        case 'cone':
            target = document.createElement('a-cone');
            target.setAttribute('radius-bottom', targetSize);
            target.setAttribute('radius-top', 0);
            target.setAttribute('height', targetSize * 1.5);
            break;
    }
    
    return target;
}

function getRandomPosition() {
    return {
        x: (Math.random() - 0.5) * 20,
        startY: -1,
        z: (Math.random() - 0.5) * 20
    };
}

function animateTarget(target, position) {
    const peakY = 5;
    
    // Rise animation
    target.setAttribute('animation__up', {
        property: 'position',
        to: `${position.x} ${peakY} ${position.z}`,
        dur: targetSpeed,
        easing: 'easeOutQuad'
    });
    
    // Fall animation after reaching peak
    setTimeout(function() {
        if (target.parentNode && gameActive) {
            target.setAttribute('animation__down', {
                property: 'position',
                to: `${position.x} ${position.startY} ${position.z}`,
                dur: targetSpeed,
                easing: 'easeInQuad'
            });
            
            // Remove target after falling
            setTimeout(function() {
                if (target.parentNode) {
                    target.parentNode.removeChild(target);
                }
            }, targetSpeed);
        }
    }, targetSpeed);
}

function destroyTarget(target) {
    if (!gameActive || !target.parentNode) return;
    
    // Increase score
    score += 10;
    updateScore();
    
    // Destruction animation
    target.setAttribute('animation__destroy', {
        property: 'scale',
        to: '0 0 0',
        dur: 200,
        easing: 'easeInQuad'
    });
    
    // Remove target
    setTimeout(function() {
        if (target.parentNode) {
            target.parentNode.removeChild(target);
        }
    }, 200);
}

function removeAllTargets() {
    const targets = document.querySelectorAll('.target');
    targets.forEach(function(target) {
        if (target.parentNode) {
            target.parentNode.removeChild(target);
        }
    });
}

function changeSize() {
    if (!gameActive) return;
    
    targetSize = targetSize >= 1.5 ? 0.5 : targetSize + 0.25;
    
    const button = document.querySelector('#sizeBtn');
    button.setAttribute('color', targetSize > 1 ? '#cc2222' : '#ff4444');
    
    console.log('Target size changed to:', targetSize);
}

function changeSpeed() {
    if (!gameActive) return;
    
    if (targetSpeed > 1000) {
        targetSpeed -= 500;
    } else {
        targetSpeed = 2500;
    }
    
    const button = document.querySelector('#speedBtn');
    button.setAttribute('color', targetSpeed < 2000 ? '#22cc22' : '#44ff44');
    
    console.log('Target speed changed to:', targetSpeed);
}

function changeShape() {
    if (!gameActive) return;
    
    shapeIndex = (shapeIndex + 1) % SHAPES.length;
    targetShape = SHAPES[shapeIndex];
    
    const button = document.querySelector('#shapeBtn');
    button.setAttribute('color', SHAPE_COLORS[shapeIndex]);
    
    const buttonText = button.querySelector('a-text');
    buttonText.setAttribute('value', targetShape.toUpperCase());
    
    console.log('Target shape changed to:', targetShape);
}

function updateScore() {
    document.querySelector('#scoreDisplay').setAttribute('value', `Score: ${score}`);
}

function updateTimer() {
    const timerDisplay = document.querySelector('#timerDisplay');
    timerDisplay.setAttribute('value', `Time: ${timeLeft}`);
    
    // Change color based on time remaining
    if (timeLeft <= 10) {
        timerDisplay.setAttribute('color', 'red');
    } else if (timeLeft <= 20) {
        timerDisplay.setAttribute('color', 'orange');
    } else {
        timerDisplay.setAttribute('color', 'green');
    }
}

function showGameOver() {
    const gameOverScreen = document.querySelector('#gameOverScreen');
    const finalScore = document.querySelector('#finalScore');
    
    finalScore.setAttribute('value', `Final Score: ${score}`);
    gameOverScreen.setAttribute('visible', 'true');
}

function hideGameOver() {
    document.querySelector('#gameOverScreen').setAttribute('visible', 'false');
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    clearGameTimers();
    if (movementTimer) clearInterval(movementTimer);
});

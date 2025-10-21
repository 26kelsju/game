// Game variables
let score = 0;
let targetSize = 1;
let targetSpeed = 2000;
let gameActive = true;
let timeLeft = 30; // 30 seconds
let gameTimer;
let spawnInterval;

// Initialize game when scene loads
document.addEventListener('DOMContentLoaded', function() {
    startGame();
});

function startGame() {
    // Reset game state
    score = 0;
    timeLeft = 30;
    gameActive = true;
    
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
        updateTimer();
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Start spawning targets
    spawnTarget();
    spawnInterval = setInterval(spawnTarget, 3000);
    
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
    gameActive = false;
    
    // Stop timers
    clearInterval(gameTimer);
    clearInterval(spawnInterval);
    
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
        startGame();
    });
}

function spawnTarget() {
    if (!gameActive) return;
    
    const scene = document.querySelector('a-scene');
    const target = document.createElement('a-cylinder');
    
    // Random position
    const x = (Math.random() - 0.5) * 8;
    const startY = -2;
    const z = (Math.random() - 0.5) * 4 - 3;
    
    // Set target properties
    target.setAttribute('position', `${x} ${startY} ${z}`);
    target.setAttribute('radius', targetSize);
    target.setAttribute('height', '0.2');
    target.setAttribute('color', '#ff4444');
    target.setAttribute('class', 'target');
    
    // Add click event for destruction
    target.addEventListener('click', function() {
        if (gameActive) {
            destroyTarget(target);
        }
    });
    
    scene.appendChild(target);
    
    // Animate target up and down
    animateTarget(target, x, z);
}

function animateTarget(target, x, z) {
    // Rise up
    target.setAttribute('animation__up', {
        property: 'position',
        to: `${x} 3 ${z}`,
        dur: targetSpeed,
        easing: 'easeOutQuad'
    });
    
    // Fall down after reaching top
    setTimeout(() => {
        if (target.parentNode && gameActive) {
            target.setAttribute('animation__down', {
                property: 'position',
                to: `${x} -2 ${z}`,
                dur: targetSpeed,
                easing: 'easeInQuad'
            });
            
            // Remove target after falling
            setTimeout(() => {
                if (target.parentNode) {
                    target.parentNode.removeChild(target);
                }
            }, targetSpeed);
        }
    }, targetSpeed);
}

function destroyTarget(target) {
    if (!gameActive) return;
    
    // Increase score
    score += 10;
    updateScore();
    
    // Visual destruction effect
    target.setAttribute('animation__destroy', {
        property: 'scale',
        to: '0 0 0',
        dur: 200
    });
    
    // Remove from scene
    setTimeout(() => {
        if (target.parentNode) {
            target.parentNode.removeChild(target);
        }
    }, 200);
}

function setupControls() {
    // Size control
    document.querySelector('#sizeControl').addEventListener('click', function() {
        if (!gameActive) return;
        targetSize = targetSize >= 1.5 ? 0.5 : targetSize + 0.25;
        this.setAttribute('color', targetSize > 1 ? 'darkred' : 'red');
    });
    
    // Speed control
    document.querySelector('#speedControl').addEventListener('click', function() {
        if (!gameActive) return;
        if (targetSpeed > 1000) {
            targetSpeed -= 500;
            this.setAttribute('color', 'darkblue');
        } else {
            targetSpeed = 2500;
            this.setAttribute('color', 'blue');
        }
    });
}

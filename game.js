// Game variables
let score = 0;
let targetSize = 1;
let targetSpeed = 2000; // milliseconds for animation
let gameActive = true;

// Initialize game when scene loads
document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    
    // Start spawning targets
    spawnTarget();
    setInterval(spawnTarget, 3000); // New target every 3 seconds
    
    // Control panel interactions
    setupControls();
});

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
        destroyTarget(target);
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
        if (target.parentNode) {
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
    // Increase score
    score += 10;
    document.querySelector('#scoreText').setAttribute('value', `Score: ${score}`);
    
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
        targetSize = targetSize >= 1.5 ? 0.5 : targetSize + 0.25;
        this.setAttribute('color', targetSize > 1 ? 'darkred' : 'red');
    });
    
    // Speed control
    document.querySelector('#speedControl').addEventListener('click', function() {
        if (targetSpeed > 1000) {
            targetSpeed -= 500;
            this.setAttribute('color', 'darkblue');
        } else {
            targetSpeed = 2500;
            this.setAttribute('color', 'blue');
        }
    });
}
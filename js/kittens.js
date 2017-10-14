// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var COIN_WIDTH = 75;
var COIN_HEIGHT = 63;
var MAX_COINS = 2;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_catsAndCoins = 4;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var R_ARROW_CODE = 82;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Preload game images
var images = {};
['enemy.png', 'enemySkull.png', 'stars.png', 'player.png', 'coin.png', "playerDead.png", "10000.png", "ouch.png"].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});



var sounds = {};
['coin.mp3', 'fireDarer.mp3', 'gameOver.mp3', 'hit.mp3'].forEach(fileName => {
    var audio = document.createElement('audio');
    audio.src = `sounds/${fileName}`;
    //  audio.setAttribute("preload", "auto");
    //  document.body.appendChild(audio);

    audio.setAttribute("controls", "none");
    audio.style.display = "none";

    sounds[fileName] = audio;
})


//  function sound(src) {
//      this.soundFile = document.createElement("audio");
//      this.soundFile.src = src;
//      this.soundFile.setAttribute("preload", "auto");
//      this.soundFile.setAttribute("controls", "none");
//      this.soundFile.style.display = "none";
//      document.body.appendChild(this.soundFile);
//      this.play = function(){
//          this.soundFile.play();
//      }
//      this.stop = function(){
//          this.soundFile.pause();
//      }
//  }





// This section is where you will be doing most of your coding
class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}
class popUp extends Entity {
    constructor(xPos, yPos, type) {
        super();
        this.x = xPos;
        this.y = yPos;
        this.sprite = images[`${type}.png`];
        this.duration = 0;
    }

}
class scoreFlash extends popUp {
    constructor(xPos, yPos, amount) {
        super(xPos, yPos, amount);
        this.speed = 0.2;
        this.maxDuration = 10;

    }
    update(timeDiff) {
        this.duration++;
        this.x += timeDiff * this.speed
        this.y -= timeDiff * this.speed


    }
}
class impactPopUp extends popUp {
    constructor(xPos, yPos, type) {
        super(xPos, yPos, type);
        this.speed = 0.1;
        this.maxDuration = 6;

    }
    update(timeDiff) {
        this.duration++;
        this.x += timeDiff * this.speed
        this.y -= timeDiff * this.speed
    }

}
class Coin extends Entity {
    constructor(xPos) {
        super();
        this.name = "Coin"
        this.x = xPos
        this.y = -COIN_HEIGHT;
        this.height = COIN_HEIGHT;
        this.sprite = images['coin.png']
        this.frameIndex = 0;
        this.tickCounter = 0;
        this.speed = 0.5;
    }
    render(ctx) {
        ctx.drawImage(this.sprite, this.frameIndex * 75, 0, 75, 63, this.x, this.y, 75, 63)
    }

    update(timeDiff, frameRate) {
        this.y = this.y + timeDiff * this.speed;
        this.tickCounter += 1;
        if (this.tickCounter > frameRate) {
            this.tickCounter = 0;

            this.frameIndex += 1;
            if (this.frameIndex > 5) {
                this.frameIndex = 0;
            }
        }



    }
}
class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.name = "Enemy";
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.frameIndex = 0;
        this.tickCounter = 0;
        this.height = ENEMY_HEIGHT;
        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
        if (this.speed < 0.5) {
            this.sprite = images['enemy.png'];
        } else {
            this.sprite = images['enemySkull.png']
        }

        this.ticksPerFrame = 5 / (this.speed * 1.5);
    }

    render(ctx) {
        ctx.drawImage(this.sprite, this.frameIndex * 75, 0, 75, 156, this.x, this.y, 75, 156)
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
        this.tickCounter += 1;
        if (this.tickCounter > this.ticksPerFrame) {
            this.tickCounter = 0;

            this.frameIndex += 1;
            if (this.frameIndex > 3) {
                this.frameIndex = 0;
            }
        }
    }

}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.height = PLAYER_HEIGHT;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        } else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }


}





/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player

        // Setup catsAndCoins and popUps, making sure there are always four
        this.setupThings();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            } else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            } else if (e.keyCode === R_ARROW_CODE) {
                this.gameIsOver = true;
                //this is a debug button to test the gameover screen quickly
            }
        })
        this.ctx = canvas.getContext('2d');
        var gameIsOver = false;

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where a cat or coin can be present.
     At any point in time there can be at most ${MAX} things 
     This sets up the catsAndCoins array, as well as the popUps array.*/

    setupThings() {
        if (!this.catsAndCoins) {
            this.catsAndCoins = [];
        }
        if (!this.popUps) {
            this.popUps = [];
        }

        while (this.catsAndCoins.filter(e => !!e).length < MAX_catsAndCoins) {
            this.addSomething();
        }
    }

    // This method finds a random spot where there is no thing, and puts a coin or a cat in there
    addSomething() {
        var lanes = GAME_WIDTH / ENEMY_WIDTH; //5

        var lane;
        // Keep looping until we find a free enemy spot at random. If lane doesn't exist (at beginning of game)
        //or if the catsAndCoins array has something at the current lane index, make a new lane number
        //between 1 and 5 (?)
        while (lane === undefined || this.catsAndCoins[lane]) {

            lane = Math.floor(Math.random() * lanes);
        }
        var foo = Math.random();
        foo > 0.2 ?
            (this.catsAndCoins[lane] = new Enemy(lane * ENEMY_WIDTH)) :
            (this.catsAndCoins[lane] = new Coin(lane * ENEMY_WIDTH))


    }
    // This method kicks off the game
    start() {
        this.player = new Player();

        this.score = 0;
        this.lives = 3;
        sounds["fireDarer.mp3"].currentTime = 0;
        sounds["fireDarer.mp3"].play();
        this.lastFrame = Date.now();
        // Listen for keyboard left/right and update the player


        this.gameLoop();
    }
    gameOver() {
        // If they are dead, then it's game over!
        //clears screen, redraws background, redraws everything else at lower alpha, pauses music
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        this.ctx.globalAlpha = 0.8

        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg

        this.ctx.globalAlpha = 0.5
        this.catsAndCoins.forEach(thing => thing.render(this.ctx)); // draw the catsAndCoins          
        this.player.sprite = images["playerDead.png"]
        this.player.render(this.ctx)
        sounds["fireDarer.mp3"].pause();


        //after a timeout, shows the Game Over text at full alpha 
        //,plays Game Over song and shows restart button
        this.ctx.globalAlpha = 1.0

        this.ctx.font = 'bold 40px Impact';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = "center";
        setTimeout(() => {
            this.ctx.fillText(this.score + " GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2);
            sounds["gameOver.mp3"].play();
            setTimeout(() => {
                //makes the restart button visible
                document.getElementById('restartButton').style.display = "inline-block";
            }, 1500)
        }, 1000)

        console.log(restartButton)
    }

    restart() {
        //turns off my quick-gameover debug button's variable
        this.gameIsOver = false;
        console.log("player restarted!")
        //hides the button
        document.getElementById('restartButton').style.display = "none";
        //empties all the entity arrays
        // [this.catsAndCoins, this.popUps].forEach (
        //     (entityArray) => {entityArray=[];}
        // )
        this.catsAndCoins = [];
        this.popUps = [];
        //clears the screen
        // this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        this.start();

    }
    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all catsAndCoins and popUps
        this.catsAndCoins.forEach(thing => thing.update(timeDiff, 10));
        this.popUps.forEach(thing => thing.update(timeDiff, 10));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.catsAndCoins.forEach(thing => thing.render(this.ctx)); // draw the catsAndCoins
        this.popUps.forEach(thing => thing.render(this.ctx)); // draw the popUps
        this.player.render(this.ctx); // draw the player

        // Check if any catsAndCoins should be erased
        this.catsAndCoins.forEach((thing, thingIdx) => {
            if (thing.y > GAME_HEIGHT) {
                delete this.catsAndCoins[thingIdx];

            }
        });
        //check if any popups should be destroyed
        this.popUps.forEach((thing, thingIdx) => {
            if (thing.duration > thing.maxDuration) {
                delete this.popUps[thingIdx];

            }
        });

        this.setupThings();
        // populates the lanes with coins and cats 

        // Check if player is dead
        if (this.isPlayerDead() || this.gameIsOver) {
            this.gameOver();
        } else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = "start";
            this.ctx.fillText(this.score, 5, 30);
            this.ctx.fillText("Lives: " + this.lives, 275, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        return this.catsAndCoins.some(
            (thing, thingIdx) => {
                //if some thing hit the player
                if (
                    thing.x === this.player.x &&
                    thing.y + thing.height >= this.player.y &&
                    thing.y + thing.height - 25 <= this.player.y + this.player.height
                ) {

                    //if it's an enemy
                    if (thing.name === "Enemy") {
                        console.log("an enemy hit the player")
                        // sounds["hit.mp3"].pause();
                        sounds["hit.mp3"].currentTime = 0;
                        sounds["hit.mp3"].play();
                        if (this.lives > 0) {
                            delete this.catsAndCoins[thingIdx]
                            this.popUps[thingIdx] = new impactPopUp(thing.x, thing.y + ENEMY_HEIGHT - 50, "ouch")
                            this.lives--;
                        } else {
                            return true;
                        }
                        //if it's a coin
                    } else if (thing.name === "Coin") {
                        console.log("a coin hit the player")
                        this.score += 10000
                        sounds["coin.mp3"].currentTime = 0;
                        sounds["coin.mp3"].play();

                        delete this.catsAndCoins[thingIdx]
                        this.popUps[thingIdx] = new scoreFlash(thing.x, thing.y, "10000")

                    }

                }
            })



    }
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();
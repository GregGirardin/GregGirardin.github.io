import { c } from './Constants.js';
import { Ship } from './Ship.js';
import { Vector } from './Vector.js';
import { newTanker } from './Tanker.js';
import { newBigAlien, newSmallAlien } from './Aliens.js';
import { spawnList, CollisionObject, gameEvents } from './Utils.js';
import { newAsteroid, newBlackhole } from './Asteroid.js';
import { Instructions } from './Instructions.js';

export let gManager; // a single global instance. Everything uses this.
window.onload = gameInit;
/* min time until next, max time, number of events, count to first spawn, constructor */
let spawnParams = [ [ 5000,12000, -1, 2000, newBlackhole ], // -1 means can spawn forever but don't affect level complete
                    [ 1000, 2000, -1, 1200, newTanker ],
                    [  100,  300,  0,  100, newAsteroid ],
                    [  400,  800,  0,  500, newBigAlien ],
                    [  200, 1200,  0, 1000, newSmallAlien ] ];

class gameManager
{
  constructor()
  {
    this.canvas = document.getElementById( "myCanvas" );
    this.ctx = this.canvas.getContext( "2d" );

    this.canvas.width = c.SCREEN_WIDTH; // widen to check that we're not drawing far off screen
    this.canvas.height = c.SCREEN_HEIGHT;

    this.highScore = 0;
    this.events = new gameEvents();
    this.gameOn = false;
    this.instructions = new Instructions();
    this.displayInstructions = true;

    this.newGame();
  }

  newGame()
  {
    this.objects = [];
    this.numShips = c.NUM_SHIPS;
    this.score = 0;
    this.respawn = true;
    this.gameOn = true;
    this.newWave( 1 );
  }

  newWave( wave )
  {
    this.wave = wave;
    this.waveComplete = false

    spawnParams[ 2 ][ 2 ] = wave * 15; // Asteroids
    spawnParams[ 3 ][ 2 ] = wave * 5; // big aliens
    spawnParams[ 4 ][ 2 ] = wave * 5; // small aliens

    this.spawnList = new spawnList( spawnParams );
  }

  gameOver()
  {
    if( this.score > this.highScore )
      this.highScore = this.score;
    this.newGame();
    this.ship = undefined;
  }

  addObj( obj )
  {
    // a little hack to put the ship at the head of the list since we search for it often
    if( obj.type == c.OBJECT_TYPE_SHIP )
      this.objects.unshift( obj );
    else
      this.objects.push( obj );
  }

  keyDownHandler( param )
  {
    switch( param.key )
    {
      case "ArrowLeft":
        if( this.ship )
          if( this.ship.spin < 0 )
            this.ship.spin = 0;
          else if( this.ship.spin < c.MAX_SPIN )
            this.ship.spin += c.SPIN_DELTA;
        break;

      case "ArrowRight":
        if( this.ship )
          if( this.ship.spin > 0 )
            this.ship.spin = 0;
          else if( this.ship.spin > -1 * c.MAX_SPIN )
            this.ship.spin -= c.SPIN_DELTA;
        break;

      case "ArrowUp":
        if( this.ship )
          this.ship.accel += .03;
        break;

      case "ArrowDown":
        if( this.ship )
        {
          this.ship.accel = 0;
          this.ship.v.magnitude *= .75;
        }
        break;

      case " ":
        if( this.displayInstructions )
          this.displayInstructions = false;
        let shipPresent = false;
        for( let obj of this.objects )
          if( obj.type == c.OBJECT_TYPE_SHIP )
          {
            shipPresent = true;
            break;
          }
        if( shipPresent == false && this.numShips >= 0 )
          this.respawn = true;
        else
          this.ship.fireCannon = true;

       break;

      case "f":
        if( this.ship )
          this.ship.fireTorpedo = true;
        break;

      case "?":
        this.displayInstructions = this.displayInstructions ? false : true;
        break;

      case "N":
        this.newGame();
        break;
    }
  }

  keyUpHandler( param )
  {
    switch( param.key )
    {
      case " ":
        this.ship.fireCannon = false;
        break;
    }
  }

  update ( deltaMs )
  {
    var obj;
    // collision detection
    for( let i = 0;i < this.objects.length - 1;i++ )
      for( let j = i + 1;j < this.objects.length;j++ )
      {
        let obj1 = this.objects[ i ];
        let obj2 = this.objects[ j ];

        if( obj1.type != c.OBJECT_TYPE_NONE && obj2.type != c.OBJECT_TYPE_NONE )
        {
          let colDist = obj1.colRadius + obj2.colRadius;
          let actDist = obj1.p.distanceTo( obj2.p );
          if( actDist < colDist )
          {
            let adjJust = colDist - actDist;
            let dir = obj2.p.directionTo( obj1.p );
            let spd = obj2.v.dot( dir ) + obj1.v.dot( dir + c.PI ); // velocity towards each other.
            if( spd > 0 )  // make sure they're moving toward each other
            {
              let co = new CollisionObject( obj2, new Vector( spd * obj2.mass / 100, dir ), adjJust );
              obj1.colList.push( co );
              co = new CollisionObject( obj1, new Vector( spd * obj1.mass / 100, dir - c.PI ), adjJust );
              obj2.colList.push( co );
            }
          }
        }
      }

    // update objects
    for( let i = 0;i < this.objects.length;i++ )
      if( this.objects[ i ].update( ) == false )
        this.objects.splice( i, 1 );
      
    // spawn
    if( this.gameOn )
      if( this.spawnList.update() == true )
      {
        var checkComplete = true;
        for( obj of this.objects )
        {
          if( obj.type == c.OBJECT_TYPE_ALIEN || obj.type == c.OBJECT_TYPE_ASTEROID )
          {
            checkComplete = false;
            break;
          }
        }

        if( checkComplete == true )
        {
          this.waveComplete = true;
          this.score += c.WAVE_COMP_POINTS * this.wave;
          if( this.wave == c.NUM_WAVES )
          {
            this.events.newEvent( "Congration. Your winner", c.EVENT_DISPLAY_COUNT * 2, gameOver );
            this.gameOn = false;
          }
          else
          {
            this.events.newEvent( "Wave complete bonus.", c.EVENT_DISPLAY_COUNT / 2, undefined );
            this.wave++;
            let t = "Wave " + this.wave;
            this.events.newEvent( t, c.EVENT_DISPLAY_COUNT, this.newWave( this.wave ) );
          }
        }
      }
    // events
    this.events.update();
  }

  draw()
  {
    var obj;

    this.ctx.clearRect( 0, 0, c.SCREEN_WIDTH, c.SCREEN_HEIGHT );

    // draw
    for( obj of this.objects )
      obj.draw( this.ctx );

    // display the remaining ships
    this.ctx.strokeStyle = 'black';

    for( var x = 0;x < this.numShips;x++ )
    {
      this.ctx.beginPath();
      this.ctx.moveTo( 10 + 20 * x, 20 );
      this.ctx.lineTo( 15 + 20 * x, 5 );
      this.ctx.lineTo( 20 + 20 * x, 20 );
      this.ctx.stroke();
    }

    // high score
    this.ctx.font = "20px Arial";
    this.ctx.fillText( "Score:" + this.score,     c.SCREEN_WIDTH *  .6, 15 );
    this.ctx.fillText(  "High:" + this.highScore, c.SCREEN_WIDTH *  .7, 15 );
    this.ctx.fillText(  "Wave:" + this.wave,      c.SCREEN_WIDTH * .25, 15 );

    this.events.draw( );
  }

  loop( deltaMs ) // The game loop
  {
    if( this.displayInstructions )
      this.instructions.draw();
    else
    {
      if( this.respawn == true )
      {
        this.respawn = false;
        this.ship = new Ship();
        this.addObj( this.ship );
      }

      this.update( deltaMs );
      this.draw();
    }
  }
}

let lastTimestamp = 0;
function gameLoop( timeStamp )
{ 
  var delta = timeStamp - lastTimestamp;
  lastTimestamp = timeStamp;
  gManager.loop( delta );
  sleep( 10 ).then(() => { window.requestAnimationFrame( gameLoop ); } );
}

function keyDownHandler( e ) { gManager.keyDownHandler( e ); }
function keyUpHandler( e ) { gManager.keyUpHandler( e ); }

function gameInit()
{
  gManager = new gameManager();

  document.addEventListener( "keydown", keyDownHandler, false );
  document.addEventListener( "keyup", keyUpHandler, false );

  window.requestAnimationFrame( gameLoop );
}

function sleep( ms ) { return new Promise( resolve => setTimeout( resolve, ms ) ); }
export function gameOver() { gManager.gameOver(); }
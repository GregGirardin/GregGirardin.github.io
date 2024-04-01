import { c } from './constants.js';
import { WorldObject } from './Utils.js';
import { Line, Shape } from './Shape.js';
import { randInt, randFloat } from './Utils.js';
import { Point, Vector } from './Vector.js';
import { SmokeParticle, CannonParticle, Torpedo } from './Particles.js';
import { gManager, gameOver } from './main.js';

export class Ship extends WorldObject
{
  constructor()
  {
    super( c.OBJECT_TYPE_SHIP, new Point( c.SCREEN_WIDTH * .75, c.SCREEN_HEIGHT * .5 ), c.PI, new Vector( 0, 0 ), 7, c.SHIP_MASS, false );

    const shipShape = [ [ -5, 5, 10, 0, 0 ],
                        [ -5,-5, 10, 0, 0 ],
                        [ -5,-5, -5, 5, 0 ] ];
    this.shape = new Shape( shipShape );
    this.fireCannon = false;
    this.fireTorpedo = false;
    this.rounds = c.SHIP_MAX_ROUNDS;
    this.torpedos = c.SHIP_MAX_TORPEDOS;
    this.fuel = c.SHIP_MAX_FUEL;
    this.torpedoDelay = 0;
  }

  update()
  {
    super.update();
  
    if( this.accel > 0 )
    {
      if( this.accel > c.THRUST_MAX )
        this.accel = c.THRUST_MAX;
      if( this.fuel < 0 )
      {
        this.fuel = 0;
        if( this.accel > 0)
          this.accel = c.THRUST_LOW
      }
      this.fuel -= this.accel * 2;
    }

    // bounce off walls
    if( this.p.x < 0 && this.v.dx() < 0 || this.p.x > c.SCREEN_WIDTH && this.v.dx() > 0 )
    {
      this.v.flipx();
      this.v.magnitude *= .9;
    }

    if( this.p.y < 0 && this.v.dy() < 0 || this.p.y > c.SCREEN_HEIGHT && this.v.dy() > 0 )
    {
      this.v.flipy();
      this.v.magnitude *= .9;
    }

    if( this.accel > 0 )
    {
      let p = new SmokeParticle( new Point( this.p.x, this.p.y ).move( new Vector( 3, this.a + c.PI ) ),
                                 new Vector( 3, this.a + c.PI + randFloat( -.3, .3 ) ), randInt( 5, 12 ), this.accel * randInt( 15, 30 ) );
      gManager.addObj( p );
    }

    if( this.fireCannon == true && this.rounds > 0 )
    {
      let p = new CannonParticle( new Point( this.p.x + 10 * Math.cos( this.a ), this.p.y - 10 * Math.sin( this.a ) ),
                                  new Vector( 7, this.a ).add( this.v, true ), 120 );
      gManager.addObj( p );
      this.fireCannon = false;
      this.rounds -= .5;
      if( gManager.score > c.CANNON_COST )
      gManager.score -= c.CANNON_COST;
    }

    if( this.torpedoDelay > 0 )
    {
      this.torpedoDelay -= 1;
      this.fireTorpedo = false;
    }

    if( this.fireTorpedo == true )
    {
      if( this.torpedos > 0 )
      {
        let p = new Torpedo( new Point( this.p.x + 20 * Math.cos( this.a ), this.p.y - 20 * Math.sin( this.a ) ),
                             new Vector( 7, this.a ).add( this.v ), 150 );
        gManager.addObj( p );
        this.torpedos -= 10;
        this.torpedoDelay = c.TORPEDO_DELAY;
        if( gManager.score > c.TORPEDO_COST )
        gManager.score -= c.TORPEDO_COST;
      }
      this.fireTorpedo = false;
    }

    while( this.colList.length )
    {
      let colObj = this.colList.shift();
      if( colObj.o.type == c.OBJECT_TYPE_TANKER )
      {
        let t = colObj.o;
        if( t.fuel > 0 && this.fuel < c.SHIP_MAX_FUEL )
        {
          this.fuel += 1;
          t.fuel -= 1;
        }
        else
          t.transferComplete |= c.TX_RESOURCE_FUEL;

        if( t.rounds > 0 && this.rounds < c.SHIP_MAX_ROUNDS )
        {
          this.rounds += 1;
          t.rounds -= 1;
        }
        else
          t.transferComplete |= c.TX_RESOURCE_ROUNDS;

        if( t.torpedos > 0 && this.torpedos < c.SHIP_MAX_TORPEDOS )
        {
          this.torpedos += 1;
          t.torpedos -= 1;
        }
        else
          t.transferComplete |= c.TX_RESOURCE_TORPEDOS;
      }
      else if( colObj.i.magnitude < c.SMALL_IMPULSE && colObj.o.weapon == false )
      {
        this.v.add( colObj.i, true /*???*/ );
        if( this.v.magnitude > c.SPEED_HI )
          this.v.magnitude = c.SPEED_HI;
      }
      else
      {
        gManager.numShips -= 1;
        if( gManager.numShips < 0 )
          gManager.events.newEvent( "Game Over Man!", c.EVENT_DISPLAY_COUNT * 2, gameOver );
        for( var ix = 0;ix < randInt( 30, 40 );ix++ )
        {
          let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                     new Vector( randFloat( 0, 2 ), c.TAU * randFloat( 0, 1 ) ).add( this.v ),
                                     randInt( 20, 50 ), randFloat( 3, 3.5 ) );
          gManager.addObj( p );
        }
        return false;
      }
      return true;
    }
  }

  draw()
  {
    this.shape.draw( this.p, this.a );
    let g = gManager.ctx;
  
    g.strokeStyle = "black";
    g.beginPath();
    g.rect( 50, 5, 100, 10 );
    g.stroke();

    g.strokeStyle = ( this.fuel < 20 ) ? "red" : "black";
    g.beginPath();
    g.rect( 50, 5, this.fuel, 2 );
    g.stroke();
  
    g.strokeStyle = ( this.rounds < 20 ) ? "red" : "black";
    g.beginPath();
    g.rect( 50, 10, this.rounds, 2 );
    g.stroke();
  
    g.strokeStyle = ( this.torpedos < 20 ) ? "red" : "black";
    g.beginPath();
    g.rect( 50, 15, this.torpedos, 2 );
    g.stroke();
  }
}
import { c } from './Constants.js';
import { WorldObject, randInt, randFloat } from './Utils.js';
import { Shape } from './Shape.js';
import { Vector, Point } from './Vector.js';
import { SmokeParticle } from './Particles.js';
import { gManager } from './main.js';

export class Asteroid extends( WorldObject )
{
  constructor( radius, iron = false )
  {
    let radii = 6 + randInt( 0, 5 );
    let r = [];

    for( let count = 0;count < radii;count++ )
      r.push( radius + randFloat( 0, 5 ) );
    r.push( r[ 0 ] );

    let s = [];
    let theta = 0;
    let delTheta = 2 * c.PI / ( r.length - 1 );

    for( let i = 0;i < r.length - 1;i++ )
    { 
      s.push( [ r[ i     ] * Math.cos( theta ),
                r[ i     ] * Math.sin( theta ),
                r[ i + 1 ] * Math.cos( theta + delTheta ),
                r[ i + 1 ] * Math.sin( theta + delTheta ),
                "black" ] );
      theta += delTheta;
    }

    let v, initY;
    if( Math.random() < .5 )
    {
      v = new Vector( randFloat( .05, .3 ), randFloat( c.PI + c.PI * .2, c.PI + c.PI * .8 ) );
      initY = -c.SCREEN_BUFFER + 1;
    }
    else
    {
      v = new Vector( randFloat( .05, .3 ), randFloat( c.PI * .2, c.PI * .8 ) );
      initY = c.SCREEN_HEIGHT + c.SCREEN_BUFFER - 1;
    }

    let m;
    if( iron == true )
       m = c.IRON_ASTEROID_MASS * radius;
    else
       m = c.ASTEROID_MASS * radius;

    super( c.OBJECT_TYPE_ASTEROID,
           new Point( randInt( c.SCREEN_WIDTH * .1, c.SCREEN_WIDTH * .8 ), initY ),
           0, v, radius, m, false );
  
    this.shape = new Shape( s );
    this.collision = c.OBJECT_TYPE_NONE;
    this.spin = randFloat( -.05, .05 );
    this.iron = iron; // can't destroy, but can move when shooting them.
  }

  update()
  {
    if( this.offScreen() )
      return false;

    super.update();

    while( this.colList.length )
    {
      let colObj = this.colList.shift();

      if( colObj.o.type == c.OBJECT_TYPE_NONE )
        continue;
  
      if( ( this.iron == true || 
          ( colObj.i.magnitude < c.SMALL_IMPULSE && colObj.o.weapon == false ) ) && colObj.o.type != c.OBJECT_TYPE_BH ) 
      {
        this.v.add( colObj.i, true );
        if( this.v.magnitide > c.SPEED_HI )
          this.v.magnitide = c.SPEED_HI;
      }
      else
      {
        let count = randInt( 6, 12 );
        for( let v = 1;v < count;v++ )
        {
          let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                     new Vector( randFloat( 0, 2 ), randFloat( 0, c.TAU ) ),
                                     randInt( 10, 20 ),
                                     randInt( 3, 10 ));
          gManager.addObj( p );
        }

        if( this.colRadius > c.MIN_ASTEROID_RADIUS * 2 )
        {
          let vector = randFloat( 0, c.TAU );
          let r = this.colRadius / 2;
          for( let ix = 0;ix < 2;ix++ )
          {
            const v = [ 0, c.PI ];
            let a = new Asteroid( r );
            a.p.x = this.p.x + r * Math.cos( vector + v[ ix ] );
            a.p.y = this.p.y + r * Math.sin( vector + v[ ix ] );
            a.velocity = new Vector( this.v.magnitide * 1.5, this.v.direction + v[ ix ] );
            gManager.addObj( a );
          }
        }
        let t = colObj.o.type;
        if( t == c.OBJECT_TYPE_CANNON || t == c.OBJECT_TYPE_T_CANNON || t == c.OBJECT_TYPE_TORPEDO )
          gManager.score += c.ASTEROID_POINTS
        return false
       }
     }
     return true;
   }

  draw()
  {
    this.shape.draw( this.p, this.a, ( this.iron == true ) ? 3 : 1 );
  }
}

export function newAsteroid()
{
  return( new Asteroid( randInt( 10, 50 ), ( Math.random() < .2 ) ? true : false ) );
}

export class Blackhole extends WorldObject
{
  constructor( radius )
  {
    if (!radius) 
      radius = randInt( 20, 50 );
    super( c.OBJECT_TYPE_BH,
           new Point( -5, randInt( c.SCREEN_HEIGHT * .2, c.SCREEN_HEIGHT * .8 ) ),
           0,
           new Vector( randFloat( 1.4, 3), randFloat( -.5, .5 ) ),
           radius,
           c.BH_MASS * radius,
           true );

    this.collision = c.OBJECT_TYPE_NONE;
  }

  update()
  {
    if( this.offScreen() )
      return false;

    super.update();

    while( this.colList.length )
      this.colList.shift(); // BH doesn't care, just clear the list.

    for( let obj of gManager.objects )
      if( obj != this )
      {
        let dis = obj.p.distanceTo( this.p );
        if( dis < this.colRadius )
          dis = this.colRadius;
        let dir = obj.p.directionTo( this.p );
        let mag = this.mass / ( dis ** 2 );
        obj.v.add( new Vector( mag, dir ) ); // debug
        if( obj.v.magnitide > c.SPEED_HI )
          obj.v.magnitide = c.SPEED_HI;
      }
    return true;
  }

  draw( )
  {
    gManager.ctx.beginPath();
    gManager.ctx.arc ( this.p.x, this.p.y, this.colRadius, 0, 2 * Math.PI, "black" ) ;
    gManager.ctx.fill();
  }
}

export function newBlackhole()
{
  return( new Blackhole() );
}
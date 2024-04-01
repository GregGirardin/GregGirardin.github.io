import { c } from './constants.js';
import { WorldObject, randInt, randFloat } from './Utils.js';
import { Shape } from './Shape.js';
import { Point, Vector } from './Vector.js';
import { gManager } from './main.js';

export class SmokeParticle extends WorldObject
{
  constructor( p, v, ttl, size )
  {
    super( c.OBJECT_TYPE_NONE, p, 0, v, false );
    this.ttl = ttl;
    let s = [ [ -size, -size, size, size, "black" ],
              [ -size,  size, size,-size, "black" ] ];
  
    this.shape = new Shape( s );
    if( Math.random() < .5 )
      this.spin = 5;
    else
      this.spin = -5;
  }

  update()
  {
    super.update();
    if( this.ttl > 0 )
    {
      this.ttl--;
      return true;
    }
    else
      return false;
  }

  draw()
  {
    this.shape.draw( this.p, this.a );
  }
}

export class CannonParticle extends WorldObject
{
  constructor( p, v, ttl, type=c.OBJECT_TYPE_CANNON )
  {
    super( type, p, 0, v, 4, c.CANNON_MASS, true );
    this.ttl = ttl;
  }

  update( e )
  {
    super.update();
    this.ttl--;
    if( this.ttl <= 0 )
      return false;

    if( this.colList.length > 0 )
    {
      let colObj = this.colList.shift();
      let t = colObj.o.type;

      let count = randInt( 6, 10 );
      for( let v = 1;v < count;v++ )
      {
        let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                   new Vector( randFloat( 0, 2 ), randFloat( 0, c.TAU ) ),
                                   randInt( 10, 20 ),
                                   randInt( 3, 10 ));
        gManager.addObj( p );
      }
      return false;
    }
    return true;
  }
  
  draw( )
  {
    gManager.ctx.beginPath();
    /* Note that the drawn radius is smaller than the collision radius */
    gManager.ctx.arc ( this.p.x, this.p.y, 1, 0, 2 * Math.PI ) ;
    gManager.ctx.stroke();
  }
}

export class Torpedo extends WorldObject
{
  constructor( p, v, ttl, radius = 5 )
  {
    super( c.OBJECT_TYPE_TORPEDO, p, 0, v, radius, c.TORPEDO_MASS, true );
    this.ttl = ttl;
    this.radius = radius;
    this.age = 0;
  }

  update()
  {
    super.update();
    this.age += 1;
    if( this.age > 20 )
    {
      let p = new CannonParticle( new Point ( this.p.x, this.p.y ),
                                  new Vector( randFloat( 1, 3 ), randFloat( 0, c.TAU ) ).add( this.v ),
                                  randInt( 20, 30 ),
                                  c.OBJECT_TYPE_T_CANNON );
      gManager.addObj( p );
    }

    if( this.ttl < 0 )
      return false;

    this.ttl--;

    let alive = true;

    while( this.colList.length )
    {
      var colObj = this.colList.shift();

      if( colObj.o.type == c.OBJECT_TYPE_ASTEROID && colObj.o.iron == true )
      {
        this.p.move( new Vector( colObj.d / 2, colObj.i.direction ) ); // push the iron asteroid a bit

        let count = randInt( 6, 12 );
        for( let v = 1;v < count;v++ )
        {
          let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                     new Vector( randFloat( 0, 2 ), randFloat( 0, c.TAU ) ),
                                     randInt( 10, 20 ),
                                     randInt( 3, 10 ));
          gManager.addObj( p );
        }

        alive = false;
      }
    }
    return alive;
  }

  draw( )
  {
    let r = this.radius + randFloat( -2, 1 );
    gManager.ctx.beginPath();
    gManager.ctx.arc ( this.p.x, this.p.y, r, 0, 2 * Math.PI );
    gManager.ctx.stroke();
  }
}
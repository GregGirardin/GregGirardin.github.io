import { c } from './Constants.js';
import { Point, Vector } from './Vector.js';
import { Heuristic, HeuristicFace, HeuristicGo, HeuristicStop, HeuristicWait, HeuristicGoto } from './Pilot.js';
import { WorldObject, angleTo, randInt, randFloat } from './Utils.js';
import { Shape } from './Shape.js';
import { Pilot } from './Pilot.js';
import { SmokeParticle } from './Particles.js';
import { gManager } from './main.js';

export class Tanker extends WorldObject
{
  constructor()
  {
    const s = [ [ -10,-10, 0,-10, ],
                [ -10, 10, 0, 10, ],
                [   0,-10, 10, 0, ],
                [   0, 10, 10, 0, ],
                [ -10,-10 ,-5, 0, ],
                [ -10, 10 ,-5, 0, ] ];

    // start from the right side, going left.
    let p = new Point( c.SCREEN_WIDTH + c.SCREEN_BUFFER - 1,
                       randFloat( c.SCREEN_HEIGHT * .1, c.SCREEN_HEIGHT * .9 ) );

    super( c.OBJECT_TYPE_TANKER, p, 0, new Vector( 0, 0 ), 12, c.TANKER_MASS );

    this.shape = new Shape( s );

    // resources available if ship contacts
    this.fuel = randFloat( 30.0, 70.0 );
    this.rounds = randFloat( 30.0, 70.0 );
    this.torpedos = randFloat( 20.0, 50.0 );

    this.refuelComplete = false;
    this.transferComplete = 0;
    this.tPoint = undefined; // Tractor point

    let hList = [ new Heuristic( "f",  "g",  new HeuristicFace( c.PI ) ),
                  new Heuristic( "g",  "s",  new HeuristicGo( c.SPEED_MED, 100 ) ),
                  new Heuristic( "s",  "w",  new HeuristicStop()),
                  new Heuristic( "w",  "f2", new HeuristicWait( 500 ) ),
                  new Heuristic( "f2", "d",  new HeuristicFace( 0 ) ),
                  new Heuristic( "d",  undefined, new HeuristicGo( c.SPEED_HI, 1000 ) ) ];

    this.pilot = new Pilot( this, hList );
    }

  update()
  {
    this.pilot.pilot();
    super.update();

    if( this.offScreen() )
      return false;

    this.tPoint = undefined;
    if( this.refuelComplete == false )
    {
      // check for tractor.
      for( let obj of gManager.objects )
      {
        if( obj.type == c.OBJECT_TYPE_SHIP )
        {
          let d = this.p.distanceTo( obj.p );
          if( d < c.OBJECT_DIST_NEAR )
          {
            let at = angleTo( obj.a, this.a );
            obj.a += at / 10; // line it up

            // ideal velocity vector is matching the tanker + towards the tanker.
            let vIdeal = this.v.add( new Vector( d / 10, obj.p.directionTo( this.p ) ), false );
            obj.v.adjust( vIdeal, .05 );
            this.tPoint = obj.p;
          }
          break;
        }
      }
    }

    if( this.accel > 0 )
    {
      let p = new SmokeParticle( new Point( this.p.x, this.p.y ).move( new Vector( 3, this.a + c.PI ) ),
                                  new Vector( 2, this.a + c.PI + randFloat( -.25, .25 ) ),
                                  randFloat( 5, 10 ),
                                  this.accel * randFloat( 15, 30 ) );
      gManager.addObj( p );
    }

    if( ( this.transferComplete & c.TX_RESOURCE_ALL == c.TX_RESOURCE_ALL ) && ( this.refuelComplete == false ) )
    {
      this.refuelComplete = true;
      gManager.events.newEvent( "Refuel Complete", c.EVENT_DISPLAY_COUNT / 2 );
      let hList = [ new Heuristic( "Depart", undefined,
                                   new HeuristicGoto( new Point( c.SCREEN_WIDTH * 1.1, randFloat( 0, c.SCREEN_HEIGHT ), c.OBJECT_DIST_NEAR ) ) ) ];
      this.pilot.setHlist( hList );
    }

    while( this.colList.length )
    {
      let colObj = this.colList.shift();
      let t = colObj.o.type;
      if( t != c.OBJECT_TYPE_SHIP )
      {
        if( colObj.i.magnitude < c.SMALL_IMPULSE && colObj.o.weapon == false )
        {
          this.v.add( colObj.i, true );
          if( this.v.magnitude > c.SPEED_HI )
            this.v.magnitude = c.SPEED_HI;
        }
        else if( colObj.o.type != c.OBJECT_TYPE_NONE )
        {
          let count = randInt( 20, 30 );
          for( let index = 1;index < count;index++ )
          {
            let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                       new Vector( randFloat( 0, 1 ), randFloat( 0, c.TAU ) ).add( this.v ),
                                       randFloat( 30, 50 ),
                                       randFloat( 3, 3.5 ) );
            gManager.addObj( p );
          }

          if( t == c.OBJECT_TYPE_CANNON || t == c.OBJECT_TYPE_TORPEDO || t == c.OBJECT_TYPE_T_CANNON )
            gManager.events.newEvent( "You destroyed the SS Vinoski! LOL", c.EVENT_DISPLAY_COUNT );
          else
            gManager.events.newEvent( "Tanker destroyed", c.EVENT_DISPLAY_COUNT / 2 );

          if( gManager.score > c.TANKER_DESTROYED_COST )
            gManager.score -= c.TANKER_DESTROYED_COST;
          else
            gManager.score = 0;

          return false;
        }
      }
    }

    return true;
  }

  draw()
  {
    this.shape.draw( this.p, this.a );

    if( this.tPoint )
    {
      gManager.ctx.beginPath();
      gManager.ctx.strokeStyle = 'green';
      gManager.ctx.moveTo( this.p.x, this.p.y );
      gManager.ctx.lineTo( this.tPoint.x + randFloat( -2, 2 ), this.tPoint.y + randFloat( -2, 2 ) );
      gManager.ctx.stroke();
    }
  }
}

export function newTanker()
{
  return new Tanker();
}
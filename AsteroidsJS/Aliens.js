import { c } from './constants.js';
import { WorldObject, randInt, randFloat } from "./Utils.js";
import { Pilot, Heuristic, HeuristicGotoRandom, HeuristicStop, HeuristicGo, HeuristicAttack, HeuristicGoto } from "./Pilot.js";
import { Point, Vector } from './Vector.js';
import { Shape } from './Shape.js';
import { SmokeParticle, CannonParticle } from './Particles.js';
import { gManager } from './main.js';

export class SmallAlien extends WorldObject
{
  constructor()
  {
    const s = [ [ -4,  5, 10, 0, "black" ],
                [ -4, -5, 10, 0, "black" ],
                [ -4, -5, -4, 5, "black" ] ];

    let p = new Point( -c.SCREEN_BUFFER + 1, randFloat( 0, c.SCREEN_HEIGHT ) );
    super( c.OBJECT_TYPE_ALIEN, p, randFloat( -.1, .1 ), new Vector( 0, 0 ), 7, c.SMALL_ALIEN_MASS );

    this.shape = new Shape( s );
    this.cannon = false;

    const hLists =
    [
      [
        new Heuristic( "1", "2", new HeuristicGoto( new Point( c.SCREEN_WIDTH * randFloat( .3, .7 ), c.SCREEN_HEIGHT * randFloat( .3, .7 ) ), c.OBJECT_DIST_MED ) ),
        new Heuristic( "2", "3", new HeuristicStop( c.SPEED_SLOW ) ),
        new Heuristic( "3", "4", new HeuristicAttack( 100 ) ),
        new Heuristic( "4", "2", new HeuristicGotoRandom( c.OBJECT_DIST_MED ) ),
      ]
    ];
  
    this.pilot = new Pilot( this, hLists[ 0 ] );
  }

  update()
  {
    super.update();
    this.pilot.pilot();
    if( this.offScreen() )
      return false;

    if( this.accel > c.THRUST_LOW )
    {
      let p = new SmokeParticle( new Point( this.p.x, this.p.y ).move( new Vector( 3, this.a + c.PI ) ),
                                 new Vector( 3, this.a + c.PI + randFloat( -.3, .3 ) ),
                                 randInt( 5, 12 ),
                                 this.accel * randInt( 15, 30 ) );
      gManager.addObj( p );
    }

    if( this.cannon == true )
    {
      this.cannon = false;
      let p = new CannonParticle( new Point( this.p.x + 10 * Math.cos( this.a ),
                                             this.p.y - 10 * Math.sin( this.a ) ),
                                  new Vector( 7, this.a ), 120, c.OBJECT_TYPE_AL_CANNON );
      gManager.addObj( p );
    }
  
    while( this.colList.length )
    {
      let colObj = this.colList.shift();
      if( colObj.i.magnitude < c.SMALL_IMPULSE && colObj.o.weapon == false )
      {
        if( this.v.magnitude > c.SPEED_HI )
          this.v.magnitude = c.SPEED_HI;
        this.p.move( new Vector( colObj.d / 2, colObj.i.direction ) );
      }
      else if( colObj.o.type != c.OBJECT_TYPE_NONE )
      {
        const total = randInt( 10, 20 );
        for( let count = 1;count < total;count++ )
        {
          let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                     new Vector( randFloat( 0, 1 ), randFloat( 0, c.TAU ) ).add( this.v ),
                                     20 + randFloat( 0, 20 ), randFloat( 2, 2.5 ) );
          gManager.addObj( p );
        }
        let t = colObj.o.type;
        if( t == c.OBJECT_TYPE_CANNON || t == c.OBJECT_TYPE_TORPEDO || t == c.OBJECT_TYPE_T_CANNON )
          gManager.score += c.SMALL_ALIEN_POINTS;
        return false;
      }
      if( this.accel > 0 )
      {
        let p = new SmokeParticle( new Point( this.p.x, this.p.y ).move( new Vector( 3, this.a + c.PI ) ),
                                   new Vector( 2, this.a + c.PI + randFloat( -.25, .25 ) ),
                                   randFloat( 5, 10 ),
                                   this.accel * randFloat( 15, 30 ) )

        gManager.addObj( p );
      }
    }
  }

  draw( )
  {
    this.pilot.draw(); // debug
    this.shape.draw( this.p, this.a, 2 );
  }
}

export class BigAlien extends WorldObject
{
  constructor()
  {
    const s = [ [ -10, 8, 15, 0, "black" ],
                [ -10,-8, 15, 0, "black" ],
                [ -10,-8,-10, 8, "black" ] ];

    let p = new Point( -c.SCREEN_BUFFER + 1, randFloat( 0, c.SCREEN_HEIGHT ) );
    super( c.OBJECT_TYPE_ALIEN, p, randFloat( -.1, .1 ), new Vector( 0, 0 ), 12, c.BIG_ALIEN_MASS, c.SPEED_MED );

    this.shape = new Shape( s );

    const hLists = [
      [
        new Heuristic(  "1",  "2", new HeuristicGoto( new Point( c.SCREEN_WIDTH * randFloat( .2, .8 ), c.SCREEN_HEIGHT * randFloat( .2, .8 ) ), c.OBJECT_DIST_MED ) ),
        new Heuristic(  "2",  "3", new HeuristicStop( c.SPEED_SLOW ) ),
        new Heuristic(  "3", "3b", new HeuristicAttack( 250 ) ),
        new Heuristic( "3b", "3c", new HeuristicAttack( 50 ) ),
        new Heuristic( "3c",  "4", new HeuristicAttack( 50 ) ),
        new Heuristic(  "4",  "2", new HeuristicGotoRandom( c.SCREEN_WIDTH / 4 ) ),
      ]
    ];

    this.pilot = new Pilot( this, hLists[ 0 ] );
  }

  update()
  {
    this.pilot.pilot();
    super.update();
    if( this.offScreen() )
      return false;
   
    if( this.accel > c.THRUST_LOW )
    {
      let p = new SmokeParticle( new Point( this.p.x, this.p.y ).move( new Vector( 8, this.a + c.PI ) ),
                                 new Vector( 3, this.a + c.PI + randFloat( -.3, .3 ) ), randInt( 5, 12 ), this.accel * randInt( 15, 30 ) );
      gManager.addObj( p );
    }

    if( this.cannon )
    {
      this.cannon = false;
      let p = new CannonParticle( new Point( this.p.x + 10 * Math.cos( this.a ), this.p.y - 10 * Math.sin( this.a ) ),
                                  new Vector( 7, this.a ), 120, c.OBJECT_TYPE_AL_CANNON );
      gManager.addObj( p );
    }

    while( this.colList.length )
    {
      let colObj = this.colList.shift();

      if( colObj.i.magnitude < c.SMALL_IMPULSE && colObj.o.weapon == false )
      {
        if( this.v.magnitude > c.SPEED_HI )
          this.v.magnitude = c.SPEED_HI;
        this.p.move( new Vector( colObj.d / 2, colObj.i.direction ) );
      }
      else if( colObj.o.type != c.OBJECT_TYPE_NONE )
      {
        const total = randInt( 30, 40 );
        for( let count = 1;count < total;count++ )
        {
          let p = new SmokeParticle( new Point( this.p.x, this.p.y ),
                                     new Vector( randFloat( 0, 1 ), randFloat( 0, c.TAU ) ).add( this.v ),
                                     20 + randFloat( 0, 20 ), randFloat( 2, 2.5 ) );
          gManager.addObj( p );
        }
        let t = colObj.o.type;
        if( t == c.OBJECT_TYPE_CANNON || t == c.OBJECT_TYPE_TORPEDO || t == c.OBJECT_TYPE_T_CANNON )
          gManager.score += c.BIG_ALIEN_POINTS;
        return false;
      }

      if( this.accel > 0 )
      {
        let p = new SmokeParticle(  new Point( this.p.x, this.p.y ).move( new Vector( 7, this.a + c.PI ) ),
                                    new Vector( 2, this.a + c.PI + randFloat( -.25, .25 ) ),
                                    randFloat( 5, 10 ), this.accel * randFloat( 15, 30 ) )
        gManager.addObj( p );
      }
    }
  }

  draw( )
  {
     this.pilot.draw(); // debug
     this.shape.draw( this.p, this.a );
  }
}

export function newSmallAlien() { return new SmallAlien(); }
export function newBigAlien() { return new BigAlien(); }
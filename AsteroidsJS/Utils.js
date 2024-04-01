import { c } from './constants.js';
import { Point, Vector } from './vector.js';
import { gManager } from './main.js';

export class WorldObject
{
  constructor( type, p, a, v, colRadius, mass, weapon, maxspeed=c.SPEED_VHI )
  {
    this.v = v;
    this.spin = 0;
    this.p = p; // position
    this.a = a; // angle
    this.type = type;
    this.accel = 0.0;
    this.weapon = weapon;
    this.colRadius = colRadius;
    this.colList = []; // list (array) of CollisionObject
    this.mass = mass;
    this.maxspeed = maxspeed;
  }

  offScreen()
  {
    if( this.p.x < -c.SCREEN_BUFFER || this.p.x > c.SCREEN_WIDTH + c.SCREEN_BUFFER ||
        this.p.y < -c.SCREEN_BUFFER || this.p.y > c.SCREEN_HEIGHT + c.SCREEN_BUFFER )
      return true;
    else
      return false;
  }

  update()
  {
    this.a += this.spin;
    if( this.a < 0 )
      this.a += c.TAU;
    else if( this.a > c.TAU )
      this.a -= c.TAU;

    this.p.move( this.v );
    this.v.add( new Vector( this.accel, this.a ) );
    if( this.v.magnitude > this.maxspeed )
      this.v.magnitude = this.maxspeed;
  }
}

export class CollisionObject
{
  constructor( o, i, d )
  {
    this.o = o; // the object
    this.i = i; // impulse
    this.d = d; // distance
  }
}

export class Event
{
  constructor( msg, dur, action )
  {
    this.msg = msg;
    this.dur = dur;
    this.action = action; // callback
  }
}

export class gameEvents
{
  constructor()
  {
    this.eventList = []; // array of events.
  }

  newEvent( msg, dur, action )
  {
    let ev = new Event( msg, dur, action );
    this.eventList.push( ev );
  }

  update( )
  {
    if( this.eventList.length > 0 )
    {
      let e = this.eventList[ 0 ];
      e.dur--;
      if( e.dur < 0 )
      {
        if( e.action )
          e.action();
        this.eventList.shift();
      }
    }
    return true;
  }

  draw( e )
  {
    if( this.eventList.length > 0 )
    {
      let ev = this.eventList[ 0 ];
      if( ev.msg )
        gManager.ctx.fillText( ev.msg, c.SCREEN_WIDTH / 2 - ev.msg.length * 5, c.SCREEN_HEIGHT / 2 );
    }
  }
}

export class spawnAble
{
  constructor( initparams )
  {
    this.min = initparams[ 0 ]; // min time until next spawn
    this.max = initparams[ 1 ]; // max time
    this.num = initparams[ 2 ]; // how many spawning events in this level
    this.count = initparams[ 3 ]; // count until first spawning
    this.newFunc = initparams[ 4 ]; // function to spawn the thing.
  }

  update()
  {
    if( this.num > 0 || this.num == -1 )
    {
      this.count--;
      if( this.count <= 0 )
      {
        this.count = randInt( this.min, this.max );
        let s = this.newFunc();
        gManager.addObj( s );
        if( this.num > 0 )
          this.num--;
      }
    }
  }
}

export class spawnList
{
  // an array of spawnables init params.
  constructor( l )
  {
    this.spawnAbles = [];
    for( let o of l )
      this.spawnAbles.push( new spawnAble( o ) );
  }

  update( e )
  {
    let s;
    let done = true; // Are we done spawning?

    for( s of this.spawnAbles )
    {
      s.update( e );
      if( s.num > 0 )
        done = false; // not done 
    }
    return done;
  }
}

export function angleTo( dir, goalDir )
{
  let dif = goalDir - dir;

  if( dif > c.PI )
    dif -= c.TAU;
  else if( dif < -c.PI )
    dif += c.TAU;

  return dif;
}

export function angleNorm( dir )
{
  if( dir > c.PI )
    dir -= c.TAU;
  else if( dir < -c.PI )
    dir += c.TAU;

  return dir;
}

export function randInt( min, max ) { return Math.floor( Math.random() * ( max - min + 1 ) ) + min; }
export function randFloat( min, max ) { return Math.random() * ( max - min ) + min; }
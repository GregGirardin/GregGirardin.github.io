import { c } from './constants.js';
import { angleTo, angleNorm, randInt, randFloat } from './Utils.js';
import { Point, Vector, dir, vectorDiff } from './Vector.js';
import { gManager } from './main.js';

export class Heuristic
{
  constructor( id, next, heuristic )
  {
    this.id = id;
    this.next = next;
    this.heuristic = heuristic;
  }
}

export class HeuristicGo
{
  constructor( velocity, duration )
  {
    this.hVelocity = velocity;
    this.hDuration = duration;
  }

  update( s )
  {
    if( this.hDuration > 0 )
    {
      this.hDuration--;
      if( s.v.magnitude < this.hVelocity )
        s.accel = c.THRUST_MED;
      else
        s.accel = 0;
      return false;
    }
    return true;
  }
}

export class HeuristicFace
{
  constructor( angle )
  {
    this.hAngle = angle;
  }

  update( s )
  {
    let dirTo = angleTo( s.a, this.hAngle );
    if( Math.abs( dirTo ) > .05 )
    {
      s.spin = dirTo / 20;
      return false;
    }
    else
    {
      s.spin = 0;
      return true;
    }
  }
}

export class HeuristicStop
{
  constructor( speed = c.SPEED_SLOW / 20 )
  {
    this.targetSpeed = speed;
  }

  update( s )
  {
    if( s.v.magnitude > this.targetSpeed )
    {
      // turn around
      let targetDir = angleNorm( s.v.direction + c.PI );
      let dirTo = angleTo( s.a, targetDir );
      if( Math.abs( dirTo ) > .05 )
      {
        s.accel = 0;
        s.spin = dirTo / 20;
      }
      else
      {
        s.accel = c.THRUST_MAX;
        s.spin = 0;
      }
      return false;
    }

    s.accel = 0;
    s.spin = 0;
    return true;
  }
}

export class HeuristicGoto
{
  // where to go and how close we have to get for success
  constructor( target, nearness )
  {
    this.target = target;
    this.nearness = nearness;
  }

  update( s )
  {
    let distToTarget = s.p.distanceTo( this.target );

    s.accel = 0;
    s.spin = 0;

    if( ( ( distToTarget < c.OBJECT_DIST_FAR && this.nearness == c.OBJECT_DIST_FAR ) ||
           ( distToTarget < c.OBJECT_DIST_MED && this.nearness == c.OBJECT_DIST_MED ) ||
            distToTarget < c.OBJECT_DIST_NEAR ) )
      return true; // we're there

    let dirToTarget = s.p.directionTo( this.target );
    let targetVector = new Vector( c.SPEED_HI, dirToTarget ); // Long vector for more subtle correctionVec
    let correctionVec = vectorDiff( s.v, targetVector ); // vector to make our velocity approach targetVector
    let da = angleTo( s.a, correctionVec.direction );

    s.spin = da / 10;
    let dp = s.v.dot( correctionVec.direction ) / c.SPEED_HI; // What fraction of velocity component is towards targert?
    if( dp < .5 )                                             // as fraction of max velocity
      s.accel = c.THRUST_HI;
    else if( dp < .9 )
      s.accel = c.THRUST_LOW;

    return false;
  }
}

// goto a random point 'distance' away from current point.
export class HeuristicGotoRandom
{
  constructor( distance = c.SCREEN_WIDTH, nearness = c.OBJECT_DIST_NEAR )
  {
    this.distance = distance;
    this.nearness = nearness;
    this.target = new Point( 0, 0 );
    this.gotoHeuristic = undefined;
  }

  update( s )
  {
    if( this.gotoHeuristic == undefined )
    {
      this.target.x = s.p.x;
      this.target.y = s.p.y;

      this.target.move( new Vector( randFloat( -this.distance, this.distance ), randFloat( 0, c.TAU ) ) );
      // constrain the random point to stay on screen
      if( this.target.x < c.swl ) this.target.x =  c.swl;
      if( this.target.x > c.swh ) this.target.x = c.swh;
      if( this.target.y < c.shl ) this.target.y = c.shl;
      if( this.target.y > c.shh ) this.target.y = c.shh;

      this.gotoHeuristic = new HeuristicGoto( this.target, this.nearness );
    }

    let status = this.gotoHeuristic.update( s );
    if( status )
      this.gotoHeuristic = undefined;

    return status;
  }
}


export class HeuristicWait
{
  constructor( duration )
  {
    this.hDuration = duration;
  }

  update( s )
  {
    s.accel = 0;
    s.spin = 0;

    this.hDuration--;
    if( this.hDuration < 0 )
      return true;

   return false;
  }
}

export class HeuristicAttack
{
  constructor( duration = 50 )
  {
    this.duration = duration;
    this.durationCounter = duration;
    this.attackState = c.ATTACK_INIT;
    this.aangleOffset = 0;
    this.ttNextAttack = 1;
  }

  update( s )
  {
    this.durationCounter--;
    if( this.durationCounter <= 0 )
    {
      this.durationCounter = this.duration;
      this.attackState = c.ATTACK_INIT;
      this.ttNextAttack = 1;
      return true;
    }
    if( this.attackState == c.ATTACK_INIT )
    {
      if( this.ttNextAttack == 0 )
      {
        this.attackState = c.ATTACK_ALIGN;
        this.aangleOffset = randFloat( -.2, .2 ); // shoot a bit randomly
      }
      else
        this.ttNextAttack--;
    }

    if( this.attackState == c.ATTACK_ALIGN )
    {
      let sh = false;
      for( let obj of gManager.objects )
      {
        if( obj.type == c.OBJECT_TYPE_SHIP )
        {
          sh = obj;
          break;
        }
      }
      if( sh == false )
        return true;

      let goalDir = dir( sh.p.x - s.p.x, sh.p.y - s.p.y ) + this.aangleOffset;
      let aToGoal = angleTo( s.a, goalDir );

      if( Math.abs( aToGoal ) < .1 )
      {
        s.cannon = 1; //  cannon handled in update
        this.attackState = c.ATTACK_INIT;
        this.ttNextAttack = randFloat( 20, 70 );
      }
      else
        s.spin = aToGoal / 50;
      }
    return false;
  }
}

// pilot the ship using the heuristic list
export class Pilot 
{
  constructor( parent, hList )
  {
    this.parent = parent; // the ship this is piloting. A WorldObject
    this.hList = hList;

    if( this.hList )
      this.currentH = hList[ 0 ];
    else
      this.currentH = undefined;
  }

  setHlist( hList )
  {
    this.hList = hList;
    this.currentH = hList[ 0 ];
  }

  pilot()
  {
    // Adjust, thrust, direction, and cannon based on heuristics.
    if( this.hList == undefined || this.currentH == undefined )
      return;

    let s = this.currentH.heuristic.update( this.parent );

    if( s == true )
      for( let h of this.hList )
        if( h.id == this.currentH.next )
        {
          this.currentH = h;
          break;
        }
  }

  draw()
  {
    return; // this is only for debug
    if( this.currentH.heuristic.target )
    {
        // this is a goto heuristic, draw a line to the target
        let t = this.currentH.heuristic.target;
        gManager.ctx.beginPath();
        /* Note that the drawn radius is smaller than the collision radius */
        gManager.ctx.fillStyle = "orange";
        gManager.ctx.moveTo( this.parent.p.x, this.parent.p.y );
        gManager.ctx.lineTo( t.x, t.y );
        gManager.ctx.stroke();
        gManager.ctx.fillStyle = "black";
    }
  }
}
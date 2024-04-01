import { c } from './constants.js';

export class Point
{
  constructor( x, y )
  {
    this.x = x;
    this.y = y;
  }

  distanceTo( p )
  {
    return Math.sqrt( ( this.x - p.x ) ** 2 + ( this.y - p.y ) ** 2 );
  }

  directionTo( p )
  {
    let direction = 0;

    let cx = p.x - this.x;
    let cy = p.y - this.y;

    let mag = Math.sqrt( cx ** 2 + cy ** 2 );

    if( mag > c.EFFECTIVE_ZERO )
    {
      if( Math.abs( cx ) < c.EFFECTIVE_ZERO )
      {
        if( cy > 0 )
          direction = -c.PI / 2;
        else
          direction = c.PI / 2;
      }
      else if( cx > 0 )
        direction = Math.atan( -cy / cx );
      else
        direction = c.PI + Math.atan( -cy / cx );
    }
    return direction;
  }

  move( v )
  {
    this.x += v.magnitude * Math.cos( v.direction );
    this.y -= v.magnitude * Math.sin( v.direction );
    return( this );
  }

  translate( p, theta )
  {
    let xr =  this.x * Math.cos( theta ) - this.y * Math.sin( theta ) + p.x;
    let yr = -this.y * Math.cos( theta ) - this.x * Math.sin( theta ) + p.y;
    return new Point( xr, yr );
  }
}

// 0 is right, PI/2 is up, PI is left, -PI/2 is down
export class Vector
{
  constructor( m, d )
  {
    this.magnitude = m;
    this.direction = d;
  }

  add( v, mod=true, factor=1.0 )
  {
    let cx = this.dx() + v.magnitude * Math.cos( v.direction ) * factor;
    let cy = this.dy() - v.magnitude * Math.sin( v.direction ) * factor;

    let mag = Math.sqrt( cx ** 2 + cy ** 2 );

    let direct = dir( cx, cy );
    if( mod )
    {
      this.magnitude = mag;
      this.direction = direct;
    }

    return new Vector( mag, direct );
  }

  adjust( aVec, weight ) // aVec is the "goal" vector we want to adjust this vector towards.
  {
    var adx = ( aVec.dx() - this.dx() ) * weight;
    var ady = ( aVec.dy() - this.dy() ) * weight;

    var cx = this.dx() + adx;
    var cy = this.dy() + ady;

    this.magnitude = Math.sqrt( cx ** 2 + cy ** 2 );
    this.direction = dir( cx, cy );
  }

  dx() { return( this.magnitude * Math.cos( this.direction ) ); }
  dy() { return( -1 * this.magnitude * Math.sin( this.direction ) ); }
  flipx() { this.direction = dir( -this.dx(), this.dy() ); }
  flipy() { this.direction = dir( this.dx(), -this.dy() ); }
  dot( angle )
  {
    var theta = Math.abs( this.direction - angle );
    return( this.magnitude * Math.cos( theta ) );
  }
}

export function dir( dx, dy )
{
  let direction = 0;
  let mag = Math.sqrt( dx ** 2 + dy ** 2 );

  if( mag > c.EFFECTIVE_ZERO )
  {
    if( Math.abs( dx ) < c.EFFECTIVE_ZERO )
    {
      if( dy > 0 )
        direction = -c.PI / 2;
      else
        direction = c.PI / 2;
    }
    else if( dx > 0 )
      direction = Math.atan( -dy / dx );
    else
      direction = c.PI + Math.atan( -dy / dx );
  }
  return direction;
}

export function vectorDiff( f, t )
{
  let dx = t.dx() - f.dx();
  let dy = t.dy() - f.dy();

  let m = Math.sqrt( dx ** 2 + dy ** 2 );
  let d = dir( dx, dy );

  return new Vector( m, d );
}
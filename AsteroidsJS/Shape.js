import { c } from './constants.js';
import { Point, Vector } from './vector.js';
import { gManager } from './main.js';

// a line is two verticies and a color
export class Line
{
  constructor( p1, p2, color="black" )
  {
    this.p1 = p1;
    this.p2 = p2;
    this.color = color;
  }

  translate( p, theta )
  {
    let p1r = this.p1.translate( p, theta );
    let p2r = this.p2.translate( p, theta );
    return new Line( p1r, p2r, this.color );
  }
}

//  a shape is an array of lines, a line is an array of [x,y position, and a rotational angle
export class Shape
{
  constructor( s )
  {
    this.lines = []; // array of lines
    for( let line of s )
    {
      let v1 = new Point( line[ 0 ], line[ 1 ] );
      let v2 = new Point( line[ 2 ], line[ 3 ] );
      let l = new Line( v1, v2, line [ 4 ] );
      this.lines.push( l );
    }
  }

  // return a list of translated lines
  translate( p, a )
  {
    var tlines = [];
    for( var line of this.lines )
      tlines.push( line.translate( p, a ) );

    return tlines;
  }

  draw( p, a, width=1, color="black" )
  {
    let tlines = this.translate( p, a );
    gManager.ctx.strokeStyle = color;
    gManager.ctx.lineWidth = width;
    for( let line of tlines )
    {
      gManager.ctx.beginPath();
      gManager.ctx.moveTo( line.p1.x, line.p1.y );
      gManager.ctx.lineTo( line.p2.x, line.p2.y );
      gManager.ctx.stroke();
    }
    gManager.ctx.strokeStyle = 'black';
    gManager.ctx.lineWidth = 1;
  }

  move( v )
  {
    this.p.x += v.magnitude * Math.cos( v.direction );
    this.p.y -= v.magnitude * Math.sin( v.direction );
  }
}
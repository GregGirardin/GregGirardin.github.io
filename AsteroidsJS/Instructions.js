import { c } from './constants.js';
import { Ship } from './Ship.js';
import { Tanker } from './Tanker.js';
import { BigAlien, SmallAlien } from './Aliens.js';
import { Asteroid, Blackhole } from './Asteroid.js';
import { gManager } from './main.js';

export class Instructions
{
  constructor()
  {
    this.displayObjects = 
    [
      new Ship(),
      new Tanker(),
      new SmallAlien(),
      new BigAlien(),
      new Asteroid( 15, false ),
      new Asteroid( 15, true ),
      new Blackhole( 15 )
    ];

    this.instructionStrings =
    [
      "In the three waves, destroy as many",
      "asteroids and aliens as you can.",
      "Avoid black holes.",
      "",
      "Thrust: Up Arrow",
      "Stop: Down Arrow",
      "Turn: Left/Right Arrows",
      "Gun: Space",
      "Torpedo: f",
      "Help: ?",
      "New Game: N",
    ]

    this.displayString = 
    [
      "Your ship.",
      "Refueling tanker. Fly to it.",
      "Small alien.",
      "Big alien.",
      "Asteroid.",
      "Iron Asteroid, can't destroy.",
      "Black hole."
    ];

    for( let index = 0;index < this.displayObjects.length;index++ )
    {
      this.displayObjects[ index ].p.x = c.SCREEN_WIDTH * .6;
      this.displayObjects[ index ].p.y = c.SCREEN_HEIGHT * .25 + index * 40;
    }
   }

   draw()
   {
     gManager.ctx.font = "20px Arial";

     for( let obj of this.displayObjects )
       obj.a += .05; // spin anything that spins.

     gManager.ctx.clearRect( 0, 0, c.SCREEN_WIDTH, c.SCREEN_HEIGHT );

     for( let index = 0;index < this.instructionStrings.length;index++ )
       gManager.ctx.fillText( this.instructionStrings[ index ], c.SCREEN_WIDTH * .2, c.SCREEN_HEIGHT * .25 + index * 30 );

     for( let obj of this.displayObjects )
       obj.draw();
     for( let index = 0;index < this.displayString.length;index++ )
       gManager.ctx.fillText( this.displayString[ index ], c.SCREEN_WIDTH * .63, c.SCREEN_HEIGHT * .26 + index * 40 );
   }
}

//constructor for Drone
function Drone()
{
    //set the radius to the default radius
    this.radius = Drone.DEFAULT_RADIUS;

    //set fill color
    this.fillColor = Graphics.getRGB(255, 255, 0);

    //set stroke color
    this.strokeColor = Graphics.getRGB(0, 0, 0, .75);

    //draw ourselves
    this.$draw();
}

//extends EaselJS Shape
Drone.prototype = new Shape();

//How fast the drone moves
Drone.prototype.speed = 5;

//temp object we use to pass around point data
//so we can reuse and dont have to keep reinstantiating
Drone.prototype.p2 = new Point(0, 0);

//direction the radius tween is moving in
Drone.prototype.reverse = false;

//current radius
Drone.prototype.radius = 5;

//hero state
Drone.prototype.state = 1;

Drone.prototype.reverse = false;
Drone.prototype.frameCount = 0;
Drone.prototype.rotation = 0;
//default radius
Drone.DEFAULT_RADIUS = 20;

//max radius


//graphics fill color
Drone.prototype.fillColor = null;

//graphics stroke color
Drone.prototype.strokeColor = null;

//draw function
Drone.prototype.$draw = function()
{


    //create a new Graphics to draw our shape
    var g = new Graphics();

    g.setStrokeStyle(1);
// set angle for open mouth
    if (this.state == 1) {
        /*var startAngle = 20 * Math.PI / 180;
        var endAngle = -20 * Math.PI / 180;*/
        var startAngle = this.rotation+20 * Math.PI / 180;
        var endAngle = this.rotation-20 * Math.PI / 180;
    } else {
        var startAngle = this.rotation +7 * Math.PI / 180;
        var endAngle = this.rotation -7 * Math.PI / 180;
    }
//set color
    g.beginFill(this.fillColor);
    g.beginStroke(this.strokeColor);
    g.moveTo(0, 0)
    //draw the hero
    g.arc(0, 0, this.radius, startAngle, endAngle);
    g.endFill();
    this.graphics = g;
}

//called automatically since we subclass Shape.
//called at each time interval
Drone.prototype.tick = function()
{

    this.update();
}

Drone.prototype.update = function()
{
    //
    //Update frame count until it reaches 6 frames then change state
    this.frameCount++;
    if (this.frameCount / 6 == 1) {
        this.reverse = !this.reverse;
        this.state = (this.reverse) ? -1 : 1;
        this.frameCount = 0;
    }

    //copy our coordinates into the Point instance
    this.p2.x = this.x;
    this.p2.y = this.y;

    //get angle from enemy to target / ship
    var radians = MathUtil.getAngleBetweenPoints(Mouse, this.p2);
    this.rotation =  radians;
    //determine velocity on x and y axis
    
    var vx = Math.cos(radians) * this.speed;
    var vy = Math.sin(radians) * this.speed;

    //update position
    this.x += vx;
    this.y += vy;

    //redraw
    this.$draw();
}
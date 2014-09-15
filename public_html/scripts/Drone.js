
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
Drone.prototype.score=1;

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

    var startAngle, endAngle;

// set angle for open mouth
    if (this.state == 1) {
        /*var startAngle = 20 * Math.PI / 180;
         var endAngle = -20 * Math.PI / 180;*/
        startAngle = this.rotation + 20 * Math.PI / 180;
        endAngle = this.rotation - 20 * Math.PI / 180;
    } else {
        startAngle = this.rotation + 7 * Math.PI / 180;
        endAngle = this.rotation - 7 * Math.PI / 180;
    }
//set color
    g.beginFill(this.fillColor);
    g.beginStroke(this.strokeColor);
    g.moveTo(0, 0);
    //draw the hero
    g.arc(0, 0, this.radius, startAngle, endAngle);
    g.endFill();
    this.graphics = g;
};

//called automatically since we subclass Shape.
//called at each time interval
Drone.prototype.tick = function()
{

    this.update();
};

Drone.prototype.update = function()
{
    //
    //Update frame count until it reaches 6 frames then change state
    this.frameCount++;
    if (this.frameCount % 6 == 0) {
        this.reverse = !this.reverse;
        this.state = (this.reverse) ? -1 : 1;

    }
    if (this.frameCount % 24 == 0) {
        this.speed++;
        this.score++;
        $("#score").html(this.score);
    }

    //copy our coordinates into the Point instance
    this.p2.x = this.x;
    this.p2.y = this.y;

    //get angle from enemy to target / ship
    var radians = MathUtil.getAngleBetweenPoints(Mouse, this.p2);
    var distance = MathUtil.distanceBetweenPoints(Mouse, this.p2);
    var foodDistance = MathUtil.distanceBetweenPoints(FoodLocation, this.p2);
    this.rotation = radians;
    //determine velocity on x and y axis

    var vx = Math.cos(radians) * this.speed;
    var vy = Math.sin(radians) * this.speed;

    if (distance < 20) {
        this.kill();
    }

    if(foodDistance < 350){
        this.eat();
    }
    else {
        //update position
        this.x += vx;
        this.y += vy;

        //redraw
        this.$draw();
    }
};

Drone.prototype.kill = function()
{

    //pause game
    var e = jQuery.Event("click");
    jQuery("#overlayCanvas").trigger(e);

    //enter game over screen then refresh page
    $("#gameOver").fadeIn("slow");
    setTimeout(function() {
        $("#gameOver").fadeOut("slow");
        location.reload();
    }, 3000);


};

Drone.prototype.eat = function(){
    this.speed = this.speed - 2;
    var newX = MathUtil.generateRandomNumber($('#mainCanvas').width());
    var newY = MathUtil.generateRandomNumber($('#mainCanvas').height());
    FoodLocation.x = newX;
    FoodLocation.y = newY;
    food.setX(newX);
    food.setY(newY);
};

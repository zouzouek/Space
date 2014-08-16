

function Target(color)
{
	this.color = color;
	this.$draw();
}

Target.prototype = new Shape();
Target.prototype.color = Graphics.getRGB(255, 255, 255);
Target.RADIUS = 10;

Target.prototype.$draw = function()
{
	var radius = Target.RADIUS;
	var g = new Graphics();
		g.setStrokeStyle(1);
		g.beginFill(this.color);
		g.beginStroke(this.color);
		
		//make sure circle is drawn within the Shapes bounds
		g.drawCircle(0, 0, radius);
		
	this.graphics = g;
	
	//since the graphic wont change any, cache it so it wont
	//have to be redrawn each time the canvas is rendered.
	this.cache(-radius, -radius, radius * 2, radius * 2);
}

Target.prototype.tick = function()
{
	this.x = Mouse.x;
	this.y = Mouse.y;
}
'use strict';

function Food() {
    this.RADIUS = 20;
    this.$draw();
    this.initialDraw = true;
}

Food.prototype = new Shape();

Food.prototype.$draw = function () {
    var g = new Graphics();
    g.setStrokeStyle(1);

    this.color = Graphics.getRGB(41, 221, 27);

    g.beginFill(this.color);
    g.beginStroke(this.color);

    this.x = FoodLocation.x = (this.initialDraw) ? 10 : MathUtil.generateRandomNumber($('#mainCanvas').width());
    this.y = FoodLocation.y = (this.initialDraw) ? 10 : MathUtil.generateRandomNumber($('#mainCanvas').height());

    g.drawCircle(this.x, this.y, this.RADIUS);

    this.graphics = g;
};


Food.prototype.tick = function () {
    if (this.initialDraw) {
        this.$draw();
        this.initialDraw = false;
    } else {
        var rand = MathUtil.generateRandomNumber(100);
        //5% chance to redraw
        if (rand < 5) {
            this.$draw();
        }
    }
};

Food.prototype.getX = function () {
    return this.x;
};

Food.prototype.getY = function () {
    return this.y;
};

Food.prototype.setX = function (x) {
    this.x = x;
};

Food.prototype.setY = function (y) {
    this.y = y;
};

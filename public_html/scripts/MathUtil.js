

MathUtil = {};


//returns the angle in radians between two points
MathUtil.getAngleBetweenPoints = function(p1, p2)
{
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    var radians = Math.atan2(dy, dx);
    return radians;
}

//returns the distance between two points
MathUtil.distanceBetweenPoints = function(p1, p2)
{
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    return dist;
}
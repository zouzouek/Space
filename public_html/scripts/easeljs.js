(function(window) {
    function UID() {
        throw"UID cannot be instantiated";
    }
    UID._nextID = 0;
    UID.get = function() {
        return UID._nextID++
    };
    window.UID = UID
})(window);
(function(window) {
    function Tick() {
        throw"Tick cannot be instantiated.";
    }
    Tick._listeners = null;
    Tick._pauseable = null;
    Tick._paused = false;
    Tick._inited = false;
    Tick._startTime = 0;
    Tick._pausedTime = 0;
    Tick._ticks = 0;
    Tick._pausedTicks = 0;
    Tick._interval = 50;
    Tick._intervalID = null;
    Tick._lastTime = 0;
    Tick.addListener = function(o, pauseable) {
        if (!Tick._inited) {
            Tick._inited = true;
            Tick.removeAllListeners();
            Tick.setInterval(Tick._interval)
        }
        var index = Tick._listeners.indexOf(o);
        if (index != -1) {
            Tick._pauseable[index] = pauseable;
            return
        }
        Tick._pauseable[Tick._listeners.length] =
                pauseable;
        Tick._listeners.push(o)
    };
    Tick.removeListener = function(o) {
        if (Tick._listeners == null)
            return;
        var index = Tick._listeners.indexOf(o);
        if (index != -1) {
            Tick._listeners.splice(index, 1);
            Tick._pauseable.splice(index, 1)
        }
    };
    Tick.removeAllListeners = function() {
        Tick._listeners = [];
        Tick._pauseable = []
    };
    Tick.setInterval = function(interval) {
        if (Tick._intervalID != null)
            clearInterval(Tick._intervalID);
        Tick._lastTime = Tick._getTime();
        Tick._interval = interval;
        Tick._intervalID = setInterval(Tick._tick, interval)
    };
    Tick.getInterval =
            function() {
                return Tick._interval
            };
    Tick.getFPS = function() {
        return 1E3 / Tick._interval
    };
    Tick.setPaused = function(value) {
        Tick._paused = value
    };
    Tick.getPaused = function() {
        return Tick._paused
    };
    Tick.getTime = function(pauseable) {
        return Tick._getTime() - Tick._startTime - (pauseable ? Tick._pausedTime : 0)
    };
    Tick.getTicks = function(pauseable) {
        return Tick._ticks - (pauseable ? Tick._pausedTicks : 0)
    };
    Tick._tick = function() {
        Tick._ticks++;
        var time = Tick.getTime(false);
        var elapsedTime = time - Tick._lastTime;
        var paused = Tick._paused;
        if (paused) {
            Tick._pausedTicks++;
            Tick._pausedTime += elapsedTime
        }
        Tick._lastTime = time;
        var pauseable = Tick._pauseable;
        var listeners = Tick._listeners;
        var l = listeners ? listeners.length : 0;
        for (var i = 0; i < l; i++) {
            var p = pauseable[i];
            var listener = listeners[i];
            if (listener == null || paused && p || listener.tick == null)
                continue;
            listener.tick(elapsedTime)
        }
    };
    Tick._getTime = function() {
        return(new Date).getTime()
    };
    Tick._startTime = Tick._getTime();
    window.Tick = Tick
})(window);
(function(window) {
    function DisplayObject() {
        this.init()
    }
    var p = DisplayObject.prototype;
    p.alpha = 1;
    p.cacheCanvas = null;
    p.id = -1;
    p.mouseEnabled = false;
    p.name = null;
    p.parent = null;
    p.regX = 0;
    p.regY = 0;
    p.rotation = 0;
    p.scaleX = 1;
    p.scaleY = 1;
    p.shadow = null;
    p.visible = true;
    p.x = 0;
    p.y = 0;
    p._cacheOffsetX = 0;
    p._cacheOffsetY = 0;
    p._cacheDraw = false;
    p._activeContext = null;
    p._restoreContext = false;
    p._revertShadow = false;
    p._revertX = 0;
    p._revertY = 0;
    p._revertAlpha = 1;
    p.init = function() {
        this.id = UID.get();
        this.children = []
    };
    p.updateContext = function(ctx,
            ignoreShadows) {
        if (this.visible != true || ctx == null || this.alpha <= 0)
            return false;
        this._activeContext = ctx;
        if (this._restoreContext = this.rotation % 360 || this.scaleX != 1 || this.scaleY != 1) {
            ctx.save();
            if (this.x || this.y)
                ctx.translate(this.x, this.y);
            if (this.rotation % 360)
                ctx.rotate(this.rotation % 360 / 180 * Math.PI);
            if (this.scaleX != 1 || this.scaleY != 1)
                ctx.scale(this.scaleX == 0 ? 1.0E-8 : this.scaleX, this.scaleY == 0 ? 1.0E-8 : this.scaleY);
            if (this.regX || this.regY)
                ctx.translate(-this.regX, -this.regY)
        } else
            ctx.translate(-(this._restoreX =
                    -this.x + this.regX), -(this._restoreY = -this.y + this.regY));
        this._revertAlpha = ctx.globalAlpha;
        ctx.globalAlpha *= this.alpha;
        if (this._revertShadow = this.shadow && !ignoreShadows)
            this.applyShadow(ctx, this.shadow)
    };
    p.draw = function(ctx, ignoreCache) {
        if (this.visible != true || ctx == null || this.alpha <= 0)
            return false;
        if (this.cacheCanvas && !ignoreCache) {
            ctx.translate(this._cacheOffsetX, this._cacheOffsetY);
            ctx.drawImage(this.cacheCanvas, 0, 0);
            ctx.translate(-this._cacheOffsetX, -this._cacheOffsetY);
            return false
        }
        return true
    };
    p.revertContext = function() {
        if (this._activeContext == null)
            return;
        this._activeContext.globalAlpha = this._revertAlpha;
        if (this._revertShadow)
            this.applyShadow(this._activeContext, Shadow.identity);
        if (this._restoreContext)
            this._activeContext.restore();
        else
            this._activeContext.translate(this._restoreX, this._restoreY);
        this._activeContext = null
    };
    p.cache = function(x, y, w, h) {
        var ctx;
        if (this.cacheCanvas == null) {
            this.cacheCanvas = document.createElement("canvas");
            ctx = this.cacheCanvas.getContext("2d")
        } else
            ctx = this.cacheCanvas.getContext("2d");
        this.cacheCanvas.width = w;
        this.cacheCanvas.height = h;
        ctx.translate(-x, -y);
        this.draw(ctx, true);
        this._cacheOffsetX = x;
        this._cacheOffsetY = y
    };
    p.uncache = function() {
        this.cacheCanvas = null;
        this.cacheOffsetX = this.cacheOffsetY = 0
    };
    p.getStage = function() {
        var o = this;
        while (o.parent)
            o = o.parent;
        if (o instanceof Stage)
            return o;
        return null
    };
    p.clone = function() {
        var o = new DisplayObject;
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[DisplayObject (name=" + this.name + ")]"
    };
    p.cloneProps = function(o) {
        o.alpha = this.alpha;
        o.name = this.name;
        o.regX = this.regX;
        o.regY = this.regY;
        o.rotation = this.rotation;
        o.scaleX = this.scaleX;
        o.scaleY = this.scaleY;
        o.shadow = this.shadow;
        o.visible = this.visible;
        o.x = this.x;
        o.y = this.y;
        o.mouseEnabled = this.mouseEnabled
    };
    p.applyShadow = function(ctx, shadow) {
        ctx.shadowColor = shadow.color;
        ctx.shadowOffsetX = shadow.offsetX;
        ctx.shadowOffsetY = shadow.offsetY;
        ctx.shadowBlur = shadow.blur
    };
    window.DisplayObject = DisplayObject
})(window);
(function(window) {
    function Container() {
        this.init()
    }
    var p = Container.prototype = new DisplayObject;
    p.children = null;
    p.mouseChildren = false;
    p._init = p.init;
    p.init = function() {
        this._init();
        this.children = []
    };
    p._draw = p.draw;
    p.draw = function(ctx, ignoreCache) {
        if (this.children.length == 0)
            return false;
        if (!this._draw(ctx, ignoreCache))
            return false;
        var l = this.children.length;
        var list = this.children.slice(0);
        for (var i = 0; i < l; i++) {
            var child = list[i];
            if (child == null)
                continue;
            if (child.tick)
                child.tick();
            child.updateContext(ctx);
            child.draw(ctx);
            child.revertContext()
        }
    };
    p.addChild = function(child) {
        var l = arguments.length;
        if (l > 1) {
            for (var i = 0; i < l; i++)
                this.addChild(arguments[i]);
            return arguments[l - 1]
        }
        if (child.parent)
            child.parent.removeChild(child);
        child.parent = this;
        this.children.push(child);
        return child
    };
    p.addChildAt = function(child, index) {
        var l = arguments.length;
        if (l > 2) {
            index = arguments[i - 1];
            for (var i = 0; i < l - 1; i++)
                this.addChildAt(arguments[i], index + i);
            return arguments[l - 2]
        }
        if (child.parent)
            child.parent.removeChild(child);
        child.parent =
                this;
        this.children.splice(index, 0, child);
        return child
    };
    p.removeChild = function(child) {
        var l = arguments.length;
        if (l > 1) {
            var good = true;
            for (var i = 0; i < l; i++)
                good = good && this.removeChild(arguments[i]);
            return good
        }
        return this.removeChildAt(this.children.indexOf(child))
    };
    p.removeChildAt = function(index) {
        var l = arguments.length;
        if (l > 1) {
            var a = [];
            for (var i = 0; i < l; i++)
                a[i] = arguments[i];
            a.sort(function(a, b) {
                return b - a
            });
            var good = true;
            for (var i = 0; i < l; i++)
                good = good && this.removeChildAt(a[i]);
            return good
        }
        if (index < 0 || index >
                this.children.length - 1)
            return false;
        var child = this.children[index];
        if (child != null)
            child.parent = null;
        this.children.splice(index, 1);
        return true
    };
    p.removeAllChildren = function() {
        while (this.children.length)
            this.removeChildAt(0)
    };
    p.getChildAt = function(index) {
        return this.children[index]
    };
    p.sortChildren = function(sortFunction) {
        this.children.sort(sortFunction)
    };
    p.getChildIndex = function(child) {
        return this.children.indexOf(child)
    };
    p.getNumChildren = function() {
        return this.children.length
    };
    p.clone = function() {
        var o =
                new Container;
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[Container (name=" + this.name + ")]"
    };
    p._getObjectsUnderPoint = function(x, y, ctx, arr) {
        if (visible = false || ctx == null || !(this.mouseChildren || this.mouseEnabled) || this.children.length == 0)
            return null;
        var canvas = ctx.canvas;
        var w = canvas.width;
        if (this.cacheCanvas) {
            this._draw(ctx);
            if (this._testHit(x, y, ctx)) {
                canvas.width = 0;
                canvas.width = w;
                if (this.mouseEnabled) {
                    if (arr)
                        arr.push(this);
                    return this
                }
            } else
                return null
        }
        var a = ctx.globalAlpha;
        var l = this.children.length;
        for (var i = l - 1; i >= 0; i--) {
            var child = this.children[i];
            if (child == null || !(child.mouseEnabled || this.mouseEnabled || child.mouseChildren))
                continue;
            child.updateContext(ctx, true);
            if (child instanceof Container) {
                var result = child._getObjectsUnderPoint(x, y, ctx, this.mouseEnabled ? null : arr);
                child.revertContext();
                if (this.mouseEnabled) {
                    result = child;
                    if (arr)
                        arr.push(result)
                }
                if (result != null && arr == null)
                    return result;
                continue
            }
            child.draw(ctx);
            child.revertContext();
            if (!this._testHit(x, y, ctx))
                continue;
            canvas.width = 0;
            canvas.width =
                    w;
            if (this.mouseEnabled) {
                if (arr)
                    arr.push(this);
                return this
            } else if (arr)
                arr.push(child);
            else
                return child
        }
        return null
    };
    p._testHit = function(x, y, ctx) {
        try {
            var hit = ctx.getImageData(x, y, 1, 1).data[3] > 1
        } catch (e) {
            throw"An error has occured. This is likely due to security restrictions on using getObjectsUnderPoint on a canvas with local or cross-domain images.";
        }
        return hit
    };
    p._cloneProps = p.cloneProps;
    p.cloneProps = function(o) {
        this._cloneProps(o);
        o.mouseChildren = this.mouseChildren
    };
    window.Container = Container
})(window);
(function(window) {
    function Bitmap(image) {
        this.init(image)
    }
    var p = Bitmap.prototype = new DisplayObject;
    p.image = null;
    p._init = p.init;
    p.init = function(image) {
        this._init();
        this.image = image
    };
    p._draw = p.draw;
    p.draw = function(ctx, ignoreCache) {
        if (this.image == null || !(this.image.complete || this.image.getContext))
            return false;
        if (!this._draw(ctx, ignoreCache))
            return false;
        ctx.drawImage(this.image, 0, 0)
    };
    p.cache = function() {
    };
    p.uncache = function() {
    };
    p.clone = function() {
        var o = new Bitmap(this.image);
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[Bitmap (name=" + this.name + ")]"
    };
    window.Bitmap = Bitmap
})(window);
(function(window) {
    function BitmapSequence(spriteSheet) {
        this.init(spriteSheet)
    }
    var p = BitmapSequence.prototype = new DisplayObject;
    p.callback = null;
    p.currentFrame = -1;
    p.currentSequence = null;
    p.currentEndFrame = null;
    p.currentStartFrame = null;
    p.nextSequence = null;
    p.paused = false;
    p.spriteSheet = null;
    p._init = p.init;
    p.init = function(spriteSheet) {
        this._init();
        this.spriteSheet = spriteSheet
    };
    p._draw = p.draw;
    p.draw = function(ctx, ignoreCache) {
        var image = this.spriteSheet.image;
        var frameWidth = this.spriteSheet.frameWidth;
        var frameHeight =
                this.spriteSheet.frameHeight;
        if (image == null || !(image.complete || image.getContext) || this.currentFrame < 0)
            return false;
        if (!this._draw(ctx, ignoreCache))
            return false;
        var cols = image.width / frameWidth | 0;
        var rows = image.height / frameHeight | 0;
        if (this.currentEndFrame != null) {
            if (this.currentFrame > this.currentEndFrame) {
                if (this.nextSequence)
                    this._goto(this.nextSequence);
                else {
                    this.paused = true;
                    this.currentFrame = this.currentEndFrame
                }
                if (this.callback)
                    this.callback(this)
            }
        } else if (this.spriteSheet.frameData)
            this.paused =
                    true;
        else {
            var ttlFrames = this.spriteSheet.totalFrames || cols * rows;
            if (this.currentFrame >= ttlFrames) {
                if (this.spriteSheet.loop)
                    this.currentFrame = 0;
                else {
                    this.currentFrame = ttllFrames;
                    this.paused = true
                }
                if (this.callback)
                    this.callback(this)
            }
        }
        if (this.currentFrame >= 0) {
            var col = this.currentFrame % cols;
            var row = this.currentFrame / cols | 0;
            ctx.drawImage(image, frameWidth * col, frameHeight * row, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight)
        }
    };
    p.tick = function() {
        if (this.paused)
            return;
        this.currentFrame++
    };
    p.cache = function() {
    };
    p.uncache = function() {
    };
    p.gotoAndPlay = function(frameOrSequence) {
        this.paused = false;
        this._goto(frameOrSequence)
    };
    p.gotoAndStop = function(frameOrSequence) {
        this.paused = true;
        this._goto(frameOrSequence)
    };
    p.clone = function() {
        var o = new BitmapSequence(this.spriteSheet);
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[BitmapSequence (name=" + this.name + ")]"
    };
    p._cloneProps = p.cloneProps;
    p.cloneProps = function(o) {
        this._cloneProps(o);
        o.callback = this.callback;
        o.currentFrame = this.currentFrame;
        o.currentStartFrame =
                this.currentStartFrame;
        o.currentEndFrame = this.currentEndFrame;
        o.currentSequence = this.currentSequence;
        o.nextSequence = this.nextSequence;
        o.paused = this.paused;
        o.frameData = this.frameData
    };
    p._goto = function(frameOrSequence) {
        if (isNaN(frameOrSequence)) {
            if (frameOrSequence == this.currentSequence) {
                this.currentFrame = this.currentStartFrame;
                return
            }
            var data = this.spriteSheet.frameData[frameOrSequence];
            if (data instanceof Array) {
                this.currentFrame = this.currentStartFrame = data[0];
                this.currentSequence = frameOrSequence;
                this.currentEndFrame =
                        data[1];
                if (this.currentEndFrame == null)
                    this.currentEndFrame = this.currentStartFrame;
                if (this.currentEndFrame == null)
                    this.currentEndFrame = this.currentFrame;
                this.nextSequence = data[2];
                if (this.nextSequence == null)
                    this.nextSequence = this.currentSequence;
                else if (this.nextSequence == false)
                    this.nextSequence = null
            } else {
                this.currentSequence = this.nextSequence = null;
                this.currentEndFrame = this.currentFrame = this.currentStartFrame = data
            }
        } else {
            this.currentSequence = this.nextSequence = this.currentEndFrame = null;
            this.currentStartFrame =
                    0;
            this.currentFrame = frameOrSequence
        }
    };
    window.BitmapSequence = BitmapSequence
})(window);
(function(window) {
    function Command(f, params) {
        this.f = f;
        this.params = params
    }
    Command.prototype.exec = function(scope) {
        this.f.apply(scope, this.params)
    };
    function Graphics(instructions) {
        this.init(instructions)
    }
    var p = Graphics.prototype;
    Graphics.getRGB = function(r, g, b, alpha) {
        if (alpha == null)
            return"rgb(" + r + "," + g + "," + b + ")";
        else
            return"rgba(" + r + "," + g + "," + b + "," + alpha + ")"
    };
    Graphics.getHSL = function(hue, saturation, lightness, alpha) {
        if (alpha == null)
            return"hsl(" + hue % 360 + "," + saturation + "%," + lightness + "%)";
        else
            return"hsla(" +
                    hue % 360 + "," + saturation + "%," + lightness + "%," + alpha + ")"
    };
    Graphics._canvas = document.createElement("canvas");
    Graphics._ctx = Graphics._canvas.getContext("2d");
    Graphics.beginCmd = new Command(Graphics._ctx.beginPath, []);
    Graphics.fillCmd = new Command(Graphics._ctx.fill, []);
    Graphics.strokeCmd = new Command(Graphics._ctx.stroke, []);
    p._strokeInstructions = null;
    p._strokeStyleInstructions = null;
    p._fillInstructions = null;
    p._instructions = null;
    p._oldInstructions = null;
    p._activeInstructions = null;
    p._active = false;
    p._dirty = false;
    p.init = function(instructions) {
        this.clear();
        this._ctx = Graphics._ctx;
        eval(instructions)
    };
    p.draw = function(ctx) {
        if (this._dirty)
            this._updateInstructions();
        var instr = this._instructions;
        for (var i = 0, l = instr.length; i < l; i++)
            instr[i].exec(ctx)
    };
    p.moveTo = function(x, y) {
        this._activeInstructions.push(new Command(this._ctx.moveTo, [x, y]));
        return this
    };
    p.lineTo = function(x, y) {
        this._dirty = this._active = true;
        this._activeInstructions.push(new Command(this._ctx.lineTo, [x, y]));
        return this
    };
    p.arcTo = function(x1, y1, x2, y2, radius) {
        this._dirty =
                this._active = true;
        this._activeInstructions.push(new Command(this._ctx.arcTo, [x1, y1, x2, y2, radius]));
        return this
    };
    p.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
        this._dirty = this._active = true;
        if (anticlockwise == null)
            anticlockwise = false;
        this._activeInstructions.push(new Command(this._ctx.arc, [x, y, radius, startAngle, endAngle, anticlockwise]));
        return this
    };
    p.quadraticCurveTo = function(cpx, cpy, x, y) {
        this._dirty = this._active = true;
        this._activeInstructions.push(new Command(this._ctx.quadraticCurveTo,
                [cpx, cpy, x, y]));
        return this
    };
    p.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
        this._dirty = this._active = true;
        this._activeInstructions.push(new Command(this._ctx.bezierCurveTo, [cp1x, cp1y, cp2x, cp2y, x, y]));
        return this
    };
    p.rect = function(x, y, w, h) {
        this._dirty = this._active = true;
        this._activeInstructions.push(new Command(this._ctx.rect, [x, y, w - 1, h]));
        return this
    };
    p.closePath = function() {
        if (this._active) {
            this._dirty = true;
            this._activeInstructions.push(new Command(this._ctx.closePath, []))
        }
        return this
    };
    p.clear = function() {
        this._instructions =
                [];
        this._oldInstructions = [];
        this._activeInstructions = [];
        this._strokeStyleInstructions = null;
        this._strokeInstructions = this._fillInstructions = null;
        this._active = this._dirty = false;
        return this
    };
    p.beginFill = function(color) {
        if (this._active)
            this._newPath();
        this._fillInstructions = color ? [new Command(this._setProp, ["fillStyle", color])] : null;
        return this
    };
    p.beginLinearGradientFill = function(colors, ratios, x0, y0, x1, y1) {
        if (this._active)
            this._newPath();
        var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l =
                colors.length; i < l; i++)
            o.addColorStop(ratios[i], colors[i]);
        this._fillInstructions = [new Command(this._setProp, ["fillStyle", o])];
        return this
    };
    p.beginRadialGradientFill = function(colors, ratios, x0, y0, r0, x1, y1, r1) {
        if (this._active)
            this._newPath();
        var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colors.length; i < l; i++)
            o.addColorStop(ratios[i], colors[i]);
        this._fillInstructions = [new Command(this._setProp, ["fillStyle", o])];
        return this
    };
    p.beginBitmapFill = function(image, repetition) {
        if (this._active)
            this._newPath();
        repetition = repetition || "";
        var o = this._ctx.createPattern(image, repetition);
        this._fillInstructions = [new Command(this._setProp, ["fillStyle", o])];
        return this
    };
    p.endFill = function() {
        this.beginFill(null);
        return this
    };
    p.setStrokeStyle = function(thickness, caps, joints, miterLimit) {
        if (this._active)
            this._newPath();
        this._strokeStyleInstructions = [new Command(this._setProp, ["lineWidth", thickness != null ? thickness : "1"]), new Command(this._setProp, ["lineCap", caps ? caps : "butt"]), new Command(this._setProp, ["lineJoin", joints ?
                        joints : "miter"]), new Command(this._setProp, ["miterLimit", miterLimit ? miterLimit : "10"])];
        return this
    };
    p.beginStroke = function(color) {
        if (this._active)
            this._newPath();
        this._strokeInstructions = color ? [new Command(this._setProp, ["strokeStyle", color])] : null;
        return this
    };
    p.beginLinearGradientStroke = function(colors, ratios, x0, y0, x1, y1) {
        if (this._active)
            this._newPath();
        var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l = colors.length; i < l; i++)
            o.addColorStop(ratios[i], colors[i]);
        this._strokeInstructions =
                [new Command(this._setProp, ["strokeStyle", o])];
        return this
    };
    p.beginRadialGradientStroke = function(colors, ratios, x0, y0, r0, x1, y1, r1) {
        if (this._active)
            this._newPath();
        var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colors.length; i < l; i++)
            o.addColorStop(ratios[i], colors[i]);
        this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o])];
        return this
    };
    p.beginBitmapStroke = function(image, repetition) {
        if (this._active)
            this._newPath();
        repetition = repetition || "";
        var o = this._ctx.createPattern(image,
                repetition);
        this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o])];
        return this
    };
    p.endStroke = function() {
        this.beginStroke(null);
        return this
    };
    p.curveTo = p.quadraticCurveTo;
    p.drawRect = p.rect;
    p.drawRoundRect = function(x, y, w, h, radius) {
        this.drawRoundRectComplex(x, y, w, h, radius, radius, radius, radius);
        return this
    };
    p.drawRoundRectComplex = function(x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL) {
        this._dirty = this._active = true;
        this._activeInstructions.push(new Command(this._ctx.moveTo, [x + radiusTL, y]),
                new Command(this._ctx.lineTo, [x + w - radiusTR, y]), new Command(this._ctx.arc, [x + w - radiusTR, y + radiusTR, radiusTR, -Math.PI / 2, 0, false]), new Command(this._ctx.lineTo, [x + w, y + h - radiusBR]), new Command(this._ctx.arc, [x + w - radiusBR, y + h - radiusBR, radiusBR, 0, Math.PI / 2, false]), new Command(this._ctx.lineTo, [x + radiusBL, y + h]), new Command(this._ctx.arc, [x + radiusBL, y + h - radiusBL, radiusBL, Math.PI / 2, Math.PI, false]), new Command(this._ctx.lineTo, [x, y + radiusTL]), new Command(this._ctx.arc, [x + radiusTL, y + radiusTL, radiusTL, Math.PI,
            Math.PI * 3 / 2, false]));
        return this
    };
    p.drawCircle = function(x, y, radius) {
        this.arc(x, y, radius, 0, Math.PI * 2);
        return this
    };
    p.drawEllipse = function(x, y, w, h) {
        this._dirty = this._active = true;
        var k = 0.5522848;
        var ox = w / 2 * k;
        var oy = h / 2 * k;
        var xe = x + w;
        var ye = y + h;
        var xm = x + w / 2;
        var ym = y + h / 2;
        this._activeInstructions.push(new Command(this._ctx.moveTo, [x, ym]), new Command(this._ctx.bezierCurveTo, [x, ym - oy, xm - ox, y, xm, y]), new Command(this._ctx.bezierCurveTo, [xm + ox, y, xe, ym - oy, xe, ym]), new Command(this._ctx.bezierCurveTo, [xe, ym + oy,
            xm + ox, ye, xm, ye]), new Command(this._ctx.bezierCurveTo, [xm - ox, ye, x, ym + oy, x, ym]));
        return this
    };
    p.drawPolyStar = function(x, y, radius, sides, pointSize, angle) {
        this._dirty = this._active = true;
        if (pointSize == null)
            pointSize = 0;
        pointSize = 1 - pointSize;
        if (angle == null)
            angle = 0;
        else
            angle /= 180 / Math.PI;
        var a = Math.PI / sides;
        this._activeInstructions.push(new Command(this._ctx.moveTo, [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]));
        for (i = 0; i < sides; i++) {
            angle += a;
            if (pointSize != 1)
                this._activeInstructions.push(new Command(this._ctx.lineTo,
                        [x + Math.cos(angle) * radius * pointSize, y + Math.sin(angle) * radius * pointSize]));
            angle += a;
            this._activeInstructions.push(new Command(this._ctx.lineTo, [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]))
        }
        return this
    };
    p.clone = function() {
        var o = new Graphics(this._instructions);
        o._activeIntructions = this._activeInstructions;
        o._oldInstructions = this._oldInstructions;
        o._fillInstructions = this._fillInstructions;
        o._strokeInstructions = this._strokeInstructions;
        o._strokeStyleInstructions = this._strokeStyleInstructions;
        o._active = this._active;
        o._dirty = this._dirty;
        o._assets = this._assets;
        return o
    };
    p.toString = function() {
        return"[Graphics]"
    };
    p._updateInstructions = function() {
        this._instructions = this._oldInstructions.slice();
        this._instructions.push(Graphics.beginCmd);
        if (this._fillInstructions)
            this._instructions.push.apply(this._instructions, this._fillInstructions);
        if (this._strokeInstructions) {
            this._instructions.push.apply(this._instructions, this._strokeInstructions);
            if (this._strokeStyleInstructions)
                this._instructions.push.apply(this._instructions,
                        this._strokeStyleInstructions)
        }
        this._instructions.push.apply(this._instructions, this._activeInstructions);
        if (this._fillInstructions)
            this._instructions.push(Graphics.fillCmd);
        if (this._strokeInstructions)
            this._instructions.push(Graphics.strokeCmd)
    };
    p._newPath = function() {
        if (this._dirty)
            this._updateInstructions();
        this._oldInstructions = this._instructions;
        this._activeInstructions = [];
        this._active = this._dirty = false
    };
    p._setProp = function(name, value) {
        this[name] = value
    };
    window.Graphics = Graphics
})(window);
(function(window) {
    function Shape(graphics) {
        this.init(graphics)
    }
    var p = Shape.prototype = new DisplayObject;
    p.graphics = null;
    p._init = p.init;
    p.init = function(graphics) {
        this._init();
        this.graphics = graphics ? graphics : new Graphics
    };
    p._draw = p.draw;
    p.draw = function(ctx, ignoreCache) {
        if (this.cacheCanvas == null && this.graphics == null)
            return false;
        if (!this._draw(ctx, ignoreCache))
            return false;
        this.graphics.draw(ctx)
    };
    p.clone = function() {
        var o = new Shape(this.graphics);
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[Shape (name=" +
                this.name + ")]"
    };
    window.Shape = Shape
})(window);
(function(window) {
    function SpriteSheet(image, frameWidth, frameHeight, frameData) {
        this.init(image, frameWidth, frameHeight, frameData)
    }
    var p = SpriteSheet.prototype;
    p.image = null;
    p.frameWidth = 0;
    p.frameHeight = 0;
    p.frameData = null;
    p.loop = true;
    p.totalFrames = 0;
    p.init = function(image, frameWidth, frameHeight, frameData) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameData = frameData
    };
    p.toString = function() {
        return"[SpriteSheet]"
    };
    p.clone = function() {
        var o = new SpriteSheet(this.image, this.frameWidth,
                this.frameHeight, this.frameData);
        o.loop = this.loop;
        o.totalFrames = this.totalFrames;
        return o
    };
    window.SpriteSheet = SpriteSheet
})(window);
(function(window) {
    function Stage(canvas) {
        this.init(canvas)
    }
    var p = Stage.prototype = new Container;
    p.autoClear = true;
    p.canvas = null;
    p.mouseX = null;
    p.mouseY = null;
    p._tmpCanvas = null;
    p.__init = p.init;
    p.init = function(canvas) {
        this.__init();
        this.canvas = canvas;
        this.mouseChildren = true;
        var o = this;
        if (window.addEventListener)
            window.addEventListener("mousemove", function(e) {
                o._handleMouseMove(e)
            }, false);
        else if (document.addEventListener)
            document.addEventListener("mousemove", function(e) {
                o._handleMouseMove(e)
            }, false);
        else if (window.attachEvent)
            window.attachEvent("mousemove",
                    function(e) {
                        o._handleMouseMove(e)
                    })
    };
    p.tick = function() {
        if (this.canvas == null)
            return;
        var ctx = this.canvas.getContext("2d");
        if (this.autoClear)
            this.clear();
        this.updateContext(ctx);
        this.draw(ctx);
        this.revertContext()
    };
    p.clear = function() {
        if (this.canvas == null)
            return;
        this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height)
    };
    p.getObjectsUnderPoint = function(x, y) {
        var arr = [];
        this._getObjectsUnderPoint(x, y, arr);
        return arr
    };
    p.getObjectUnderPoint = function(x, y) {
        return this._getObjectsUnderPoint(x,
                y)
    };
    p.clone = function() {
        var o = new Stage(null);
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[Stage (name=" + this.name + ")]"
    };
    p.__getObjectsUnderPoint = p._getObjectsUnderPoint;
    p._getObjectsUnderPoint = function(x, y, arr) {
        if (this._tmpCanvas == null)
            this._tmpCanvas = document.createElement("canvas");
        this._tmpCanvas.width = this.canvas.width;
        this._tmpCanvas.height = this.canvas.height;
        var ctx = this._tmpCanvas.getContext("2d");
        this.updateContext(ctx, true);
        var results = this.__getObjectsUnderPoint(x, y, ctx, arr);
        this.revertContext();
        return results
    };
    p._handleMouseMove = function(e) {
        if (!this.canvas) {
            this.mouseX = this.mouseY = null;
            return
        }
        this.mouseX = e.pageX - this.canvas.offsetLeft;
        this.mouseY = e.pageY - this.canvas.offsetTop
    };
    window.Stage = Stage
})(window);
(function(window) {
    function Shadow(color, offsetX, offsetY, blur) {
        this.init(color, offsetX, offsetY, blur)
    }
    var p = Shadow.prototype;
    Shadow.identity = null;
    p.blur = 0;
    p.color = 0;
    p.offsetX = 0;
    p.offsetY = 0;
    p.init = function(color, offsetX, offsetY, blur) {
        this.color = color;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.blur = blur
    };
    p.toString = function() {
        return"[Shadow]"
    };
    p.clone = function() {
        return new Shadow(this.color, this.offsetX, this.offsetY, this.blur)
    };
    Shadow.identity = new Shadow(0, 0, 0, 0);
    window.Shadow = Shadow
})(window);
(function(window) {
    function Text(text, font, color) {
        this.init(text, font, color)
    }
    var p = Text.prototype = new DisplayObject;
    var canvas = document.createElement("canvas");
    Text._workingContext = canvas.getContext("2d");
    p.text = "";
    p.font = null;
    p.color = null;
    p.textAlign = null;
    p.textBaseline = null;
    p.maxWidth = null;
    p.outline = false;
    p._init = p.init;
    p.init = function(text, font, color) {
        this._init();
        this.text = text;
        this.font = font;
        this.color = color ? color : "#000"
    };
    p._draw = p.draw;
    p.draw = function(ctx, ignoreCache) {
        if (!this._draw(ctx, ignoreCache) ||
                this.text == null || this.text.length == 0)
            return false;
        if (this.outline)
            ctx.strokeStyle = this.color;
        else
            ctx.fillStyle = this.color;
        ctx.font = this.font;
        ctx.textAlign = this.textAlign ? this.textAlign : "start";
        ctx.textBaseline = this.textBaseline ? this.textBaseline : "alphabetic";
        if (this.outline)
            ctx.strokeText(this.text, 0, 0, this.maxWidth);
        else
            ctx.fillText(this.text, 0, 0, this.maxWidth)
    };
    p.getMeasuredWidth = function() {
        var ctx = Text._workingContext;
        ctx.font = this.font;
        ctx.textAlign = this.textAlign ? this.textAlign : "start";
        ctx.textBaseline =
                this.textBaseline ? this.textBaseline : "alphabetic";
        return ctx.measureText(this.text).width
    };
    p.clone = function() {
        var o = new Text(this.text, this.font, this.color);
        this.cloneProps(o);
        return o
    };
    p.toString = function() {
        return"[Text (text=" + (this.text.length > 20 ? this.text.substr(0, 17) + "..." : this.text) + ")]"
    };
    p._cloneProps = p.cloneProps;
    p.cloneProps = function(o) {
        this._cloneProps(o);
        o.textAlign = this.textAlign;
        o.textBaseline = this.textBaseline;
        o.maxWidth = this.maxWidth;
        o.outline = this.outline
    };
    window.Text = Text
})(window);
(function(window) {
    function Matrix2D(a, b, c, d, tx, ty) {
        this.init(a, b, c, d, tx, ty)
    }
    var p = Matrix2D.prototype;
    Matrix2D.identity = null;
    p.a = 1;
    p.b = 0;
    p.c = 0;
    p.d = 1;
    p.tx = 0;
    p.ty = 0;
    p.init = function(a, b, c, d, tx, ty) {
        if (a != null)
            this.a = a;
        if (b != null)
            this.b = b;
        if (c != null)
            this.c = c;
        if (d != null)
            this.d = d;
        if (tx != null)
            this.tx = tx;
        if (ty != null)
            this.ty = ty
    };
    p.concat = function(a, b, c, d, tx, ty) {
        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;
        this.a = a1 * a + this.b * c;
        this.b = a1 * b + this.b * d;
        this.c = c1 * a + this.d * c;
        this.d = c1 * b + this.d * d;
        this.tx = tx1 * a + this.ty *
                c + tx;
        this.ty = tx1 * b + this.ty * d + ty
    };
    p.concatMatrix = function(matrix) {
        return this.concat(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty)
    };
    p.concatTransform = function(x, y, scaleX, scaleY, rotation, regX, regY) {
        if (rotation % 360) {
            var r = rotation * Math.PI / 180;
            var cos = Math.cos(r);
            var sin = Math.sin(r)
        } else {
            cos = 1;
            sin = 0
        }
        if (regX || regY) {
            this.tx -= regX;
            this.ty -= regY
        }
        this.concat(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y)
    };
    p.rotate = function(angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;
        this.a = a1 * cos - this.b * sin;
        this.b = a1 * sin + this.b * cos;
        this.c = c1 * cos - this.d * sin;
        this.d = c1 * sin + this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos
    };
    p.scale = function(x, y) {
        this.a *= x;
        this.d *= y;
        this.tx *= x;
        this.ty *= y
    };
    p.translate = function(x, y) {
        this.tx += x;
        this.ty += y
    };
    p.identity = function() {
        this.a = this.d = 1;
        this.b = this.c = this.tx = this.ty = 0
    };
    p.invert = function() {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        var tx1 = this.tx;
        var n = a1 * d1 - b1 * c1;
        this.a = d1 / n;
        this.b =
                -b1 / n;
        this.c = -c1 / n;
        this.d = a1 / n;
        this.tx = (c1 * this.ty - d1 * tx1) / n;
        this.ty = -(a1 * this.ty - b1 * tx1) / n
    };
    p.clone = function() {
        return new Matrix2D(this.a, this.b, this.c, this.d, this.tx, this.ty)
    };
    p.toString = function() {
        return"[Matrix2D (a=" + this.a + " b=" + this.b + " c=" + this.c + " d=" + this.d + " tx=" + this.tx + " ty=" + this.ty + ")]"
    };
    Matrix2D.identity = new Matrix2D(1, 0, 0, 1, 0, 0);
    window.Matrix2D = Matrix2D
})(window);
(function(window) {
    function Point(x, y) {
        this.init(x, y)
    }
    var p = Point.prototype;
    p.x = 0;
    p.y = 0;
    p.init = function(x, y) {
        this.x = x == null ? 0 : x;
        this.y = y == null ? 0 : y
    };
    p.clone = function() {
        return new Point(this.x, this.y)
    };
    p.toString = function() {
        return"[Point (x=" + this.x + " y=" + this.y + ")]"
    };
    window.Point = Point
})(window);
(function(window) {
    function Rectangle(x, y, w, h) {
        this.init(x, y, w, h)
    }
    var p = Rectangle.prototype;
    p.x = 0;
    p.y = 0;
    p.w = 0;
    p.h = 0;
    p.init = function(x, y, w, h) {
        this.x = x == null ? 0 : x;
        this.y = y == null ? 0 : y;
        this.w = w == null ? 0 : w;
        this.h = h == null ? 0 : h
    };
    p.clone = function() {
        return new Rectangle(this.x, this.y, this.w, this.h)
    };
    p.toString = function() {
        return"[Rectangle (x=" + this.x + " y=" + this.y + " w=" + this.w + " h=" + this.h + ")]"
    };
    window.Rectangle = Rectangle
})(window);
(function(window) {
    function CoordTransform() {
        throw"CoordTransform cannot be instantiated";
    }
    CoordTransform.localToGlobal = function(x, y, source) {
        var mtx = CoordTransform.getConcatenatedMatrix(source);
        if (mtx == null)
            return null;
        var mtx2 = new Matrix2D(1, 0, 0, 1, x, y);
        mtx2.concatMatrix(mtx);
        return new Point(mtx2.tx, mtx2.ty)
    };
    CoordTransform.globalToLocal = function(x, y, target) {
        var mtx = CoordTransform.getConcatenatedMatrix(target);
        if (mtx == null)
            return null;
        mtx.invert();
        var mtx2 = new Matrix2D(1, 0, 0, 1, x, y);
        mtx2.concatMatrix(mtx);
        return new Point(mtx2.tx, mtx2.ty)
    };
    CoordTransform.localToLocal = function(x, y, source, target) {
        var pt = CoordTransform.localToGlobal(x, y, source);
        return CoordTransform.globalToLocal(pt.x, pt.y, target)
    };
    CoordTransform.getConcatenatedMatrix = function(target, goal) {
        var path = [target];
        while (target = target.parent) {
            path.push(target);
            if (target == goal)
                break
        }
        var l = path.length;
        var stage = path[l - 1];
        if (!(stage instanceof Stage))
            return null;
        var mtx = new Matrix2D;
        for (var i = 0; i < l; i++) {
            var target = path[i];
            mtx.concatTransform(target.x,
                    target.y, target.scaleX, target.scaleY, target.rotation, target.regX, target.regY)
        }
        return mtx
    };
    window.CoordTransform = CoordTransform
})(window);
(function(window) {
    function SpriteSheetUtils() {
        throw"SpriteSheetUtils cannot be instantiated";
    }
    SpriteSheetUtils.flip = function(spriteSheet, flipData) {
        var image = spriteSheet.image;
        var frameData = spriteSheet.frameData;
        var frameWidth = spriteSheet.frameWidth;
        var frameHeight = spriteSheet.frameHeight;
        var cols = image.width / frameWidth | 0;
        var rows = image.height / frameHeight | 0;
        var ttlFrames = cols * rows;
        var frData = {};
        for (var n in frameData) {
            data = frameData[n];
            if (data instanceof Array)
                data = data.slice(0);
            frData[n] = data
        }
        var map =
                [];
        var frCount = 0;
        var i = 0;
        for (var n in flipData) {
            var fd = flipData[n];
            var data = frameData[fd[0]];
            if (data == null)
                continue;
            if (data instanceof Array) {
                var start = data[0];
                var end = data[1];
                if (end == null)
                    end = start
            } else
                start = end = data;
            map[i] = n;
            map[i + 1] = start;
            map[i + 2] = end;
            frCount += end - start + 1;
            i += 4
        }
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = Math.ceil(rows + frCount / cols) * frameHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, cols * frameWidth, rows * frameHeight, 0, 0, cols *
                frameWidth, rows * frameHeight);
        var frame = ttlFrames - 1;
        for (i = 0; i < map.length; i += 4) {
            n = map[i];
            start = map[i + 1];
            end = map[i + 2];
            fd = flipData[n];
            var flipH = fd[1] ? -1 : 1;
            var flipV = fd[2] ? -1 : 1;
            var offH = flipH == -1 ? frameWidth : 0;
            var offV = flipV == -1 ? frameHeight : 0;
            for (j = start; j <= end; j++) {
                frame++;
                ctx.save();
                ctx.translate(frame % cols * frameWidth + offH, (frame / cols | 0) * frameHeight + offV);
                ctx.scale(flipH, flipV);
                ctx.drawImage(image, j % cols * frameWidth, (j / cols | 0) * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
                ctx.restore()
            }
            frData[n] =
                    [frame - (end - start), frame, fd[3]]
        }
        var img = new Image;
        img.src = canvas.toDataURL("image/png");
        return new SpriteSheet(img.width > 0 ? img : canvas, frameWidth, frameHeight, frData)
    };
    SpriteSheetUtils.frameDataToString = function(frameData) {
        var str = "";
        var max = 0;
        var min = 0;
        var count = 0;
        for (var n in frameData) {
            count++;
            data = frameData[n];
            if (data instanceof Array) {
                var start = data[0];
                var end = data[1];
                if (end == null)
                    end = start;
                next = data[2];
                if (next == null)
                    next = n
            } else {
                start = end = data;
                next = n
            }
            str += "\n\t" + n + ", start=" + start + ", end=" + end +
                    ", next=" + next;
            if (next == false)
                str += " (stop)";
            else if (next == n)
                str += " (loop)";
            if (end > max)
                max = end;
            if (start < min)
                min = start
        }
        str = count + " sequences, min=" + min + ", max=" + max + str;
        return str
    };
    window.SpriteSheetUtils = SpriteSheetUtils
})(window);

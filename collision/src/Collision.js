/**
 * Author: Alexandre Almeida Ferreira
 * Description: Colision for javascript game
 */

export class Collision {

    colliders = {};
    observers = [];

    createColliderGroup(groupId) {
        if (!this.collidersGroup[groupId]) this.collidersGroup[groupId] = [];
    }

    listen(callback) {
        if (typeof callback === 'function') this.observers.push(callback);
    }

    //notify all listeners
    notify(colliderIdOrigin, colliderIdDestiny, collideProps, colliderObject) {
        if (this.observers.length > 0) {
            for (const observerFunction of this.observers) {
                observerFunction(colliderIdOrigin, colliderIdDestiny, collideProps, colliderObject);
            }
        }
    }

    //create collider
    createCollider(colliderId, isBlock, colliderProps, drawOptions) {
        Object.assign(colliderProps, { id: colliderId, isBlock: isBlock });
        this.colliders[colliderId] = new Collider(colliderProps);
        //setup draw properties on init
        if (typeof drawOptions !== 'undefined') {
            this.colliders[colliderId].setDrawProperties(drawOptions);
        }
        return this.colliders[colliderId];
    }

    deleteCollider(colliderId) {
        if (this.colliders[colliderId]) {
            this.colliders[colliderId].clearAll();
            delete this.colliders[colliderId];
        }
    }

    getCollider(colliderId) {
        if (this.colliders[colliderId]) {
            return this.colliders[colliderId];
        }
        return false;
    }

    getColliderProperties(colliderId) {

        if (this.colliders[colliderId]) {
            let prop = {};
            Object.assign(prop, this.colliders[colliderId].box);
            return prop;
        }
        return false;
    }

    getColliderOldProperties(colliderId) {
        if (this.colliders[colliderId]) {
            let prop = {};
            Object.assign(prop, this.colliders[colliderId].oldBox);
            return prop;
        }
        return false;
    }

    setColliderProperties(colliderId, prop) {
        if (this.colliders[colliderId]) {
            this.colliders[colliderId].updatePosition(prop);
        }
    }

    updateCollider(colliderId, properties, callback) {
        this.colliders[colliderId].updatePosition(properties);
        //limits move to its collided
        var isBlocked = this.isCollidingWithBlockObject(colliderId);
        let back = 1;
        if (isBlocked) {
            let limits = {};
            Object.assign(limits, this.colliders[colliderId].box);

            if (isBlocked.isColliding.top) {
                limits.y = isBlocked.colliderObject.box.yh + back;
            }
            if (isBlocked.isColliding.bottom) {
                limits.y = isBlocked.colliderObject.box.y - limits.h - back;
            }
            if (isBlocked.isColliding.left) {
                limits.x = isBlocked.colliderObject.box.xw + back;
            }
            if (isBlocked.isColliding.right) {
                limits.x = isBlocked.colliderObject.box.x - limits.w - back;
            }
            this.colliders[colliderId].updatePosition(limits);
            if (typeof callback === 'function') callback(limits, isBlocked.isColliding);
            //emit event on collide with block
            this.notify(colliderId, isBlocked.colliderId, isBlocked.isColliding, isBlocked.colliderObject);
        }
        //emit event on collide with non block
        var isCollided = this.isCollidingWithNonBlockObject(colliderId);
        if (isCollided) {
            this.notify(colliderId, isCollided.colliderId, isCollided.isColliding, isCollided.colliderObject);
        }
    }

    drawCollider(colliderId, props) {
        if (this.colliders[colliderId]) {
            if (typeof props !== 'undefined') this.colliders[colliderId].setDrawProperties(props);
            this.colliders[colliderId].draw();
        }
    }

    disableDrawCollider(colliderId) {
        if (this.colliders[colliderId]) {
            this.colliders[colliderId].setDrawProperties({
                drawOnUpdate: false
            });
            this.colliders[colliderId].clear();
        }
    }

    //check collision with another collider
    checkCollision(collider1, collider2) {
        if (this.colliders[collider1] && this.colliders[collider2]) {
            return this.colliders[collider1].isColliding(this.colliders[collider2]);
        }
        return false
    }

    //check colision with all colliders 
    isCollidingWith(collider1) {
        if (this.colliders[collider1]) {
            let obj = {};
            for (var [colliderId, colliderObject] of Object.entries(this.colliders)) {
                if (colliderId === collider1) continue;
                let isColliding = this.checkCollision(collider1, colliderId);
                if (isColliding) {
                    obj[colliderId] = isColliding;
                }
            }
            if (Object.entries(obj).length > 0) {
                return obj;
            }
        }
        return false;
    }

    isCollidingWithNonBlockObject(collider1) {
        if (this.colliders[collider1]) {
            for (var [colliderId, colliderObject] of Object.entries(this.colliders)) {
                if (colliderId === collider1) continue;
                if (!colliderObject.isBlock) {
                    let isColliding = this.checkCollision(collider1, colliderId);
                    if (isColliding) {
                        return { colliderId, isColliding, colliderObject };
                    }
                }
            }
        }
        return false
    }

    isCollidingWithBlockObject(collider1) {
        if (this.colliders[collider1] && this.colliders[collider1].isBlock) {
            for (var [colliderId, colliderObject] of Object.entries(this.colliders)) {
                if (colliderId === collider1) continue;
                if (colliderObject.isBlock) {
                    let isColliding = this.checkCollision(collider1, colliderId);
                    if (isColliding) {
                        return { colliderId, isColliding, colliderObject };
                    }
                }
            }
        }
        return false
    }

}

class Collider {
    colliderId = false;
    isBlock = false;
    isDrawed = false;
    box = {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        xw: 1,
        yh: 1,
    };
    oldBox = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        xw: 0,
        yh: 0,
    };

    proximityLevel = 10;
    proximityArea = {};

    drawProperties = {
        drawOnUpdate: false,
        color: 'rgba(0,0,0,0.2)',
        context: false,
    }

    constructor(props) {
        if (props.id) {
            this.colliderId = props.id;
            delete props.id;
        }
        if (props.isBlock) {
            this.isBlock = props.isBlock;
            delete props.isBlock;
        }
        Object.assign(this.box, props);
        Object.assign(this.box, { xw: (props.x + props.w), yh: props.y + props.h });
    }

    setDrawProperties(props) {
        Object.assign(this.drawProperties, props);
    }

    proximityLevel(level) {
        this.proximityLevel = level;
    }

    proximity() {
        Object.assign(this.proximitArea, this.options);
        this.proximityArea.x = this.proximityArea.x - this.proximityLevel;
        this.proximityArea.y = this.proximityArea.y - this.proximityLevel;
        this.proximityArea.w = this.proximityArea.w + this.proximityLevel;
        this.proximityArea.h = this.proximityArea.h + this.proximityLevel;

        this.proximityArea.xw = this.proximityArea.x + this.proximityArea.w + this.proximityLevel;
        this.proximityArea.yh = this.proximityArea.y + this.proximityArea.h + this.proximityLevel;
        return this.proximityArea;
    }

    //update position
    updatePosition(props) {
        if (JSON.stringify(this.box) !== JSON.stringify(this.oldBox)) {
            Object.assign(this.oldBox, this.box);
            Object.assign(this.box, props);
            Object.assign(this.box, { xw: (props.x + props.w), yh: props.y + props.h });
            if (this.drawProperties.drawOnUpdate) {
                this.clear();
                this.draw();
            }
        }
    }

    draw() {
        this.isDrawed = true;
        this.drawProperties.context.fillStyle = this.drawProperties.color;
        this.drawProperties.context.fillRect(this.box.x, this.box.y, this.box.w, this.box.h)
    }

    clear() {
        this.drawProperties.context.clearRect(this.oldBox.x - 10, this.oldBox.y - 10, this.oldBox.w + 20, this.oldBox.h + 20);
    }

    clearAll() {
        if (this.isDrawed) {
            this.drawProperties.context.clearRect(this.oldBox.x - 10, this.oldBox.y - 10, this.oldBox.w + 20, this.oldBox.h + 20);
            this.drawProperties.context.clearRect(this.box.x - 10, this.box.y - 10, this.box.w + 20, this.box.h + 20);
        }
    }

    //check where is colliding
    whereIsColliding(collider) {
        let colliding = {
            top: false,
            bottom: false,
            left: false,
            right: false,
        };

        if (this.box.y >= collider.box.y && collider.box.yh >= this.box.y

            && this.box.yh < this.oldBox.yh) {
            colliding.top = true;
        }

        else if (this.box.yh >= collider.box.y && collider.box.yh >= this.box.yh

            && this.box.yh > this.oldBox.yh) {
            colliding.bottom = true;
        }

        else if (this.box.x >= collider.box.x && collider.box.xw >= this.box.x

            && this.box.xw < this.oldBox.xw) {

            colliding.left = true;
        }

        else if (this.box.xw >= collider.box.x && collider.box.xw >= this.box.xw

            && this.box.xw > this.oldBox.xw) {

            colliding.right = true;
        }

        return colliding;
    }

    //is colliding
    isColliding(collider) {

        if (this.box.xw >= collider.box.x && this.box.x <= collider.box.xw
            &&
            this.box.yh >= collider.box.y && this.box.y <= collider.box.yh
        ) {
            return this.whereIsColliding(collider);
        }
        return false;
    }

    //is is close?
    isClose(collider) {

        if (this.box.xw >= collider.proximityArea.x && this.box.x <= collider.proximityArea.xw
            &&
            this.box.yh >= collider.proximityArea.y && this.box.y <= collider.proximityArea.yh
        ) {
            //return this.whereIsColliding(collider);
            return true;
        }
        return false;
    }

    //get distance
    distanceFrom(collider) {
        // from center diance
        var a = (this.box.x + (this.box.w / 2)) - (collider.box.x + (collider.box.w / 2));
        var b = (this.box.y + (this.box.h / 2)) - (collider.box.y + (collider.box.h / 2));
        var c = Math.hypot(a, b);
        return parseInt(c);
    }
}
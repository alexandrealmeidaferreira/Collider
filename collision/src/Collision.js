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

    updateCollider(colliderId, properties, callback) {
        this.colliders[colliderId].setPosition(properties.x, properties.y);
        //limits move to its collided
        var isBlocked = this.isCollidingWithBlockObject(colliderId);
        let back = 1;
        if (isBlocked) {
            let limits = { position: {}, size: {} };
            Object.assign(limits.position, this.colliders[colliderId].getPosition());
            Object.assign(limits.size, this.colliders[colliderId].getSize());
            if (isBlocked.isColliding.top) {
                limits.position.y = isBlocked.colliderObject.getDim().yh + back;
            }
            if (isBlocked.isColliding.bottom) {
                limits.position.y = isBlocked.colliderObject.getPosition().y - limits.size.h - back;
            }
            if (isBlocked.isColliding.left) {
                limits.position.x = isBlocked.colliderObject.getDim().xw + back;
            }
            if (isBlocked.isColliding.right) {
                limits.position.x = isBlocked.colliderObject.getPosition().x - limits.size.w - back;
            }
            this.colliders[colliderId].setPosition(limits.position.x, limits.position.y);
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

    position = { x: 0, y: 0 };
    size = { w: 0, h: 0 };

    oldPosition = { x: -1, y: -1 };
    oldSize = { w: -1, h: -1 };

    dim = { xw: 0, yh: 0 };
    oldDim = { xw: 0, yh: 0 };

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

        this.setPosition(props.x, props.y);
        this.setSize(props.w, props.h);
        Object.assign(this.oldSize, this.getSize());
        this.updateDim();
    }

    setPosition(x, y) {
        Object.assign(this.oldPosition, this.getPosition());
        Object.assign(this.position, { x, y });
        this.updateDim();
        if (this.drawProperties.drawOnUpdate) {
            this.clear();
            this.draw();
        }

    }
    setSize(w, h) {
        Object.assign(this.oldSize, this.getSize());
        Object.assign(this.size, { w, h });
    }

    getPosition() {
        return Object.assign({}, this.position);
    }

    getSize() {
        return Object.assign({}, this.size);
    }

    getOldPosition() {
        return Object.assign({}, this.oldPosition);
    }

    getOldSize() {
        return Object.assign({}, this.oldSize);
    }

    updateDim() {
        let dim = {};
        dim.xw = (this.getPosition().x + this.getSize().w);
        dim.yh = (this.getPosition().y + this.getSize().h);
        Object.assign(this.oldDim, this.getDim());
        Object.assign(this.dim, dim);
    }

    getDim() {
        return Object.assign({}, this.dim);
    }

    getOldDim() {
        return Object.assign({}, this.oldDim);
    }

    setDrawProperties(props) {
        Object.assign(this.drawProperties, props);
    }

    //update all properties
    updateProperties(props) {
        this.setPosition(props.x, props.y);
        this.setSize(props.w, props.h);
        this.updateDim();
        if (this.drawProperties.drawOnUpdate) {
            this.clear();
            this.draw();
        }
    }

    draw() {
        this.isDrawed = true;
        this.drawProperties.context.fillStyle = this.drawProperties.color;
        this.drawProperties.context.fillRect(this.getPosition().x, this.getPosition().y, this.getSize().w, this.getSize().h)
    }

    clear() {
        if (this.isDrawed) {
            this.drawProperties.context.clearRect(this.getOldPosition().x - 10, this.getOldPosition().y - 10, this.getOldSize().w + 20, this.getOldSize().h + 20);
        }
    }

    clearAll() {
        this.clear();
        if (this.isDrawed) {
            this.drawProperties.context.clearRect(this.getPosition().x - 10, this.getPosition().y - 10, this.getSize().w + 20, this.getSize().h + 20);
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

        if (this.getPosition().y >= collider.getPosition().y && collider.getDim().yh >= this.getPosition().y

            && this.getDim().yh < this.getOldDim().yh) {
            colliding.top = true;
        }

        else if (this.getDim().yh >= collider.getPosition().y && collider.getDim().yh >= this.getDim().yh

            && this.getDim().yh > this.getOldDim().yh) {
            colliding.bottom = true;
        }

        else if (this.getPosition().x >= collider.getPosition().x && collider.getDim().xw >= this.getPosition().x

            && this.getDim().xw < this.getOldDim().xw) {

            colliding.left = true;
        }

        else if (this.getDim().xw >= collider.getPosition().x && collider.getDim().xw >= this.getDim().xw

            && this.getDim().xw > this.getOldDim().xw) {

            colliding.right = true;
        }

        return colliding;
    }

    //is colliding
    isColliding(collider) {
        if (this.getDim().xw >= collider.getPosition().x && this.getPosition().x <= collider.getDim().xw
            &&
            this.getDim().yh >= collider.getPosition().y && this.getPosition().y <= collider.getDim().yh
        ) {
            return this.whereIsColliding(collider);
        }
        return false;
    }

    //get distance
    distanceFrom(collider) {
        // from center diance
        var a = (this.getPosition().x + (this.getSize().w / 2)) - (collider.getPosition().x + (collider.getSize().w / 2));
        var b = (this.getPosition().y + (this.getSize().h / 2)) - (collider.getPosition().y + (collider.getSize().h / 2));
        var c = Math.hypot(a, b);
        return parseInt(c);
    }
}
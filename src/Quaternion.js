(function() {

    "use strict";

    var Vec3 = require('./Vec3'),
        Mat33 = require('./Mat33');

    /**
     * Instantiates a Quaternion object.
     * @class Quaternion
     * @classdesc A quaternion representing an orientation.
     */
    function Quaternion() {
        switch ( arguments.length ) {
            case 1:
                // array or Quaternion argument
                var argument = arguments[0];
                if ( argument.w !== undefined ) {
                    this.w = argument.w;
                } else if ( argument[0] !== undefined ) {
                    this.w = argument[0];
                } else {
                    this.w = 1.0;
                }
                this.x = argument.x || argument[1] || 0.0;
                this.y = argument.y || argument[2] || 0.0;
                this.z = argument.z || argument[3] || 0.0;
                break;
            case 4:
                // individual component arguments
                this.w = arguments[0];
                this.x = arguments[1];
                this.y = arguments[2];
                this.z = arguments[3];
                break;
            default:
                this.w = 1;
                this.x = 0;
                this.y = 0;
                this.z = 0;
                break;
        }
        return this;
    }

    /**
     * Returns a quaternion that represents an oreintation matching
     * the identity matrix.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The identity quaternion.
     */
    Quaternion.identity = function() {
        return new Quaternion( 1, 0, 0, 0 );
    };

    /**
     * Concatenates the rotations of the two quaternions, returning
     * a new Quaternion object.
     * @memberof Quaternion
     *
     * @param {Quaternion|Array} that - The quaterion to concatenate.
     *
     * @returns {Quaternion} The resulting concatenated quaternion.
     */
    Quaternion.prototype.mult = function( that ) {
        that = ( that instanceof Array ) ? new Quaternion( that ) : that;
        var w = (that.w * this.w) - (that.x * this.x) - (that.y * this.y) - (that.z * this.z),
            x = this.y*that.z - this.z*that.y + this.w*that.x + this.x*that.w,
            y = this.z*that.x - this.x*that.z + this.w*that.y + this.y*that.w,
            z = this.x*that.y - this.y*that.x + this.w*that.z + this.z*that.w;
        return new Quaternion( w, x, y, z );
    };

    /**
     * Applies the orientation of the quaternion as a rotation
     * matrix to the provided vector, returning a new Vec3 object.
     * @memberof Quaternion
     *
     * @param {Vec3|Vec4|Array} that - The vector to rotate.
     *
     * @returns {Vec3} The resulting rotated vector.
     */
    Quaternion.prototype.rotate = function( that ) {
        that = ( that instanceof Array ) ? new Vec3( that ) : that;
        var vq = new Quaternion( 0, that.x, that.y, that.z ),
            r = this.mult( vq ).mult( this.inverse() );
        return new Vec3( r.x, r.y, r.z );
    };

    /**
     * Returns the rotation matrix that the quaternion represents.
     * @memberof Quaternion
     *
     * @returns {Mat33} The rotation matrix represented by the quaternion.
     */
    Quaternion.prototype.matrix = function() {
        var xx = this.x*this.x,
            yy = this.y*this.y,
            zz = this.z*this.z,
            xy = this.x*this.y,
            xz = this.x*this.z,
            xw = this.x*this.w,
            yz = this.y*this.z,
            yw = this.y*this.w,
            zw = this.z*this.w;
        return new Mat33([
            1 - 2*yy - 2*zz, 2*xy + 2*zw, 2*xz - 2*yw,
            2*xy - 2*zw, 1 - 2*xx - 2*zz, 2*yz + 2*xw,
            2*xz + 2*yw, 2*yz - 2*xw, 1 - 2*xx - 2*yy ]);
    };

    /**
     * Returns a quaternion representing the rotation defined by an axis
     * and an angle.
     * @memberof Quaternion
     *
     * @param {number} angle - The angle of the rotation, in degrees.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Quaternion} The quaternion representing the rotation.
     */
    Quaternion.rotationDegrees = function( angle, axis ) {
        return Quaternion.rotationRadians( angle*( Math.PI/180 ), axis );
    };

    /**
     * Returns a quaternion representing the rotation defined by an axis
     * and an angle.
     * @memberof Quaternion
     *
     * @param {number} angle - The angle of the rotation, in radians.
     * @param {Vec3} axis - The axis of the rotation.
     *
     * @returns {Quaternion} The quaternion representing the rotation.
     */
    Quaternion.rotationRadians = function( angle, axis ) {
        // normalize arguments
        angle = ( angle > 0 ) ?  angle % (2*Math.PI) : angle % (-2*Math.PI);
        axis = axis.normalize();
        // set quaternion for the equivolent rotation
        var sina = Math.sin( angle/2 ),
            cosa = Math.cos( angle/2 );
        return new Quaternion(
            cosa,
            axis.x * sina,
            axis.y * sina,
            axis.z * sina ).normalize();
    };

    /**
     * Returns a quaternion that has been spherically interpolated between
     * two provided quaternions for a given t value.
     * @memberof Quaternion
     *
     * @param {Quaternion} from - The rotation at t = 0.
     * @param {Quaternion} to - The rotation at t = 1.
     * @param {number} t - The t value, from 0 to 1.
     *
     * @returns {Quaternion} The quaternion representing the interpolated rotation.
     */
    Quaternion.slerp = function( from, to, t ) {
    	// calculate angle between them.
    	var cosHalfTheta = ( from.w * to.w ) +
            ( from.x * to.x ) +
            ( from.y * to.y ) +
            ( from.z * to.z );
    	// if from=to or from=-to then theta = 0 and we can return from
    	if ( Math.abs( cosHalfTheta ) >= 1 ) {
            return new Quaternion(
                from.w,
                from.x,
                from.y,
                from.z );
    	}
    	// calculate temporary values.
    	var halfTheta = Math.acos( cosHalfTheta );
    	var sinHalfTheta = Math.sqrt( 1 - cosHalfTheta * cosHalfTheta );
    	// if theta = 180 degrees then result is not fully defined
    	// we could rotate around any axis normal to 'from' or 'to'
    	if ( Math.abs( sinHalfTheta ) < 0.001 ) {
            return new Quaternion(
                from.w * 0.5 + to.w * 0.5,
                from.x * 0.5 + to.x * 0.5,
                from.y * 0.5 + to.y * 0.5,
                from.z * 0.5 + to.z * 0.5 );
    	}
    	var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta;
    	var ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;
        return new Quaternion(
    	    from.w * ratioA + to.w * ratioB,
        	from.x * ratioA + to.x * ratioB,
    	    from.y * ratioA + to.y * ratioB,
    	    from.z * ratioA + to.z * ratioB );
    };

    /**
     * Returns true if the vector components match those of a provided vector.
     * An optional epsilon value may be provided.
     * @memberof Quaternion
     *
     * @param {Quaternion} - The vector to calculate the dot product with.
     * @param {number} - The epsilon value. Optional.
     *
     * @returns {boolean} Whether or not the vector components match.
     */
    Quaternion.prototype.equals = function( that, epsilon ) {
        epsilon = epsilon === undefined ? 0 : epsilon;
        return ( this.x === that.x || Math.abs( this.x - that.x ) <= epsilon ) &&
            ( this.y === that.y || Math.abs( this.y - that.y ) <= epsilon ) &&
            ( this.z === that.z || Math.abs( this.z - that.z ) <= epsilon ) &&
            ( this.w === that.w || Math.abs( this.w - that.w ) <= epsilon );
    };

    /**
     * Returns a new Quaternion of unit length.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The quaternion of unit length.
     */
    Quaternion.prototype.normalize = function() {
        var mag = Math.sqrt(
                this.x*this.x +
                this.y*this.y +
                this.z*this.z +
                this.w*this.w );
        if ( mag !== 0 ) {
            return new Quaternion(
                this.w / mag,
                this.x / mag,
                this.y / mag,
                this.z / mag );
        }
        return new Quaternion();
    };

    /**
     * Returns the conjugate of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The conjugate of the quaternion.
     */
    Quaternion.prototype.conjugate = function() {
         return new Quaternion( this.w, -this.x, -this.y, -this.z );
    };

    /**
     * Returns the inverse of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Quaternion} The inverse of the quaternion.
     */
    Quaternion.prototype.inverse = function() {
        return this.conjugate();
    };

    /**
     * Returns a random Quaternion of unit length.
     * @memberof Quaternion
     *
     * @returns {Quaternion} A random vector of unit length.
     */
    Quaternion.random = function() {
        var axis = Vec3.random().normalize(),
            angle = Math.random();
        return Quaternion.rotationRadians( angle, axis );
    };

    /**
     * Returns a string representation of the quaternion.
     * @memberof Quaternion
     *
     * @returns {String} The string representation of the quaternion.
     */
    Quaternion.prototype.toString = function() {
        return this.x + ", " + this.y + ", " + this.z + ", " + this.w;
    };

    /**
     * Returns an array representation of the quaternion.
     * @memberof Quaternion
     *
     * @returns {Array} The quaternion as an array.
     */
    Quaternion.prototype.toArray = function() {
        return [  this.w, this.x, this.y, this.z ];
    };

    module.exports = Quaternion;

}());

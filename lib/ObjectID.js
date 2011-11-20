/*
* Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
* This software is not distributed under version 3 or later of the GPL.
*
* Version 2.0.0
* Implemented for server-side by Alejandro Morales (vamg008[at]gmail[dot]com)
* Date: Nov 11 2011
* https://github.com/numbus-org/ObjectId
*/

/**
 * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
 * and converts between that format and the standard 24 character representation.
*/
var ObjectId = exports.ObjectId = function () {
    var increment = 0;
    var pid = Math.floor(Math.random() * (32767));
    var machine = Math.floor(Math.random() * (16777216));
    this.timestamp = Math.floor(new Date().valueOf() / 1000);
    this.machine = machine;
    this.pid = pid;
    if (increment > 0xffffff) {
        increment = 0;
    }
    this.increment = increment++;
    return this;
};

ObjectId.prototype.getDate = function () {
    return new Date(this.timestamp * 1000);
}
/**
* Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
*/
ObjectId.prototype.toString = function () {
    var timestamp = this.timestamp.toString(16);
    var machine = this.machine.toString(16);
    var pid = this.pid.toString(16);
    var increment = this.increment.toString(16);
    return '00000000'.substr(0, 6 - timestamp.length) + timestamp +
           '000000'.substr(0, 6 - machine.length) + machine +
           '0000'.substr(0, 4 - pid.length) + pid +
           '000000'.substr(0, 6 - increment.length) + increment;
}
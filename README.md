## node-comm
This is an attemp to port a comment system ala disqus in [node.js][1]
It's in an early stage of development, is directly extracted from [numbus.co][2] (an small video platform)

Use: 
----
    // require the module first (assuming that it's called ncomm, TODO)
    var comments = require('ncomm');

    // then just manipulate with the module
    // for the moment all the methods are asyncronous
    comments.newComment(req, function(error,data){
      // code goes here
    });

Installation
------------

At this moment only exist this repository so if you want to test it out
    git clone git://github.com/alejandromg/node-comm.git
Then:
    npm install

Contributors:
-------------
* [Alejandro Morales][3]

Tests:
------

Just in the way...
License:
--------
MIT 2011

[1]: http://nodejs.org
[2]: http://github.com/numbus-org
[3]: http://twitter.com/_alejandromg
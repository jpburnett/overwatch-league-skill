#!/usr/local/bin/node


var event = require('./event.json');
var app = require('./index.js');

app.handler(event, context());


function context() {
   var context = require('./context.json');
   context.done = function(error, result) {
       console.log('context.done');
       console.log(error);
       console.log(result);
       process.exit();
   }
   context.succeed = function(result) {
       console.log('context.succeed');
       console.log(result);
       process.exit();
   }
   context.fail = function(error) {
       console.log('context.fail');
       console.log(error);
       process.exit();
   }

   return context;

}



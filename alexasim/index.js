#!/usr/local/bin/node
const Alexa = require('alexa-sdk');

//////////////////////////////////////////////////
// App definiton
//////////////////////////////////////////////////
var handlers = {
    'LaunchRequest': function () {
    	this.emit('HelloWorldIntent');
    },
 
    'HelloWorldIntent': function () {
    	this.emit(':tell', 'Hello World!');
    }
};


//////////////////////////////////////////////////
// Alexa entry point
//////////////////////////////////////////////////
exports.handler = function(event, context) {

	const alexa = Alexa.handler(event, context);

	alexa.registerHandlers(handlers);
	alexa.execute();

}

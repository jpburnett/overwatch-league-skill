'use strict';

const Alexa = require('alexa-sdk');
const https = require("https");

const languageStrings = require('./languageStrings').languageStrings;
const teamIDs = require('./teamID').ids;
const OWL_URL = "https://api.overwatchleague.com/";

const APP_ID = "";
const GOOGAPI = "";

////////////////////////////////////////////////
// console.log(new Date().getTimezoneOffset());
const handlers = {

	'LaunchRequest' : function() {
		let speechOutput = this.t('WELCOME_MSG');
		this.emit(':tell', speechOutput);
	},
	'GetNextMatchIntent' : function() {

		var self = this;

		// first we need to resolve the timezone
		const deviceId = self.event.context.System.device.deviceId;
		const token = self.event.context.System.apiAccessToken;
		//const endpoint = self.event.context.System.apiEndpoint; // should fix this
		const endpoint = 'api.amazonalexa.com';
		let options = {
			host : endpoint,
			path : `/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
			headers : {Authorization : `Bearer ${token}`},
			method : 'GET',
			port: 443
		};

		//launch callback hell
		apiCall(options, getPostalCode, requestPermissions, self);

	},
	'AMAZON.CancelIntent' : function() {
		this.emit(':tell', this.t('SHUTDOWN_MSG'));
	},
	'AMAZON.StopIntent' : function() {
		this.emit(':tell', this.t('SHUTDOWN_MSG'));
	},
	'Unhandled' : function() {
		console.log("error: Unhandled intent");
		this.emit(':tell', this.t('SHUTDOWN_MSG'));
	}
}


////////////////////////////////////////////////
exports.handler = function(event, context) {
	
	const alexa = Alexa.handler(event, context);

	// configure alexa
	alexa.APP_ID = APP_ID;
	alexa.resources = languageStrings;

	// register alexa function handlers and away we go!
	alexa.registerHandlers(handlers);
	alexa.execute();	
}


////////////////////////////////////////////////
// Intent functions

function getNextMatch(rawOffset, self) {
	// 	now we can finally go get a team.	
	const teamSlot = self.event.request.intent.slots.Team;

	let team;
	if (teamSlot && teamSlot.value) {
		team = teamSlot.value.toLowerCase();
	} else {
		console.log('No team seemed to be specified...');
		self.emit(':tell', self.t('SHUTDOWN_MSG'));
	}

	// get team id
	const id = teamIDs[team];

	if (id) {
	// prepare the url
	const url = OWL_URL + 'teams/' + id

	// need to propagate alexa through the asynch chain, cast as 'self'.
	//var self = this;
	getOWL(url, nextMatch, team, rawOffset, self);

	} else {
		self.response.speak(self.t('INVALID_TEAM_MSG', team)).listen(self.t('TEAM_REPROMPT'));
		self.emit(':responseReady');
	}
}

function nextMatch(response, team, rawOffset, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing
		console.log("Error, response was empty.");
		self.response.speak(self.t('API_ERROR_MSG'));
		self.emit(':responseReady');
	} else {
		// get the schedule containing an array of matches
		let schedule = response["schedule"];
		let stTimes = [];
		for (var i in schedule) {
			// get the match and process start times
			const match = schedule[i];
			const st = match['startDate'];
			const stDate = getCalendarMatchDate(st);
			stTimes.push(st);
		}

		// get the next match by filtering through the match
		// start time list and get the next match in the future
		const now = Date.now();
		stTimes = stTimes.sort();
		while(stTimes[0] < now) {
			stTimes.shift()
		}

		let stNextMatch = "";
		if (rawOffset) {
			stNextMatch = stTimes[0] + rawOffset*1000;	
		} else {
			stNextMatch = stTimes[0];
		}
		const calNextMatch = getCalendarMatchDate(stNextMatch);

		// return back to alexa
		let speechOutput = "The next " + team + " game will be " + calNextMatch;
		console.log(speechOutput);
		console.log();

		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

// connect to overwatch api
function getOWL(url, callback, team, rawOffset, self) {
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			return callback(body, team, rawOffset, self);
		});
	});
}

function requestPermissions(self) {
	let speechOutput = self.t('WELCOME_MSG');
	speechOutput += ' In order to get match start times in your local time I need your permission to access your device information. Please see your Alexa companion app, then try your request again.';

	const permissions = ["read::alexa:device:all:address:country_and_postal_code"];
	self.response.askForPermissionsConsentCard(permissions);

	self.response.speak(speechOutput);

	self.emit(':responseReady');
}

function apiCall(options, callback, error, self) {
	https.get(options, res => {
		res.setEncoding("utf8");
		
		// don't have permissio for the api
		if (res.statusCode >= 400) {
			return error(self);
		}

		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			return callback(body, self);
		});
	});
}

function getPostalCode(response, self) {

	let countryCode = "";
	let postalCode = "";
	if (response.countryCode && response.postalCode) {
		countryCode = response.countryCode;
		postalCode = response.postalCode;
	} else {
		// need to generate a better error response
		self.emit(':tell', "Error making request.");
	}
	console.log(countryCode);
	console.log(postalCode);
	const latLonOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/geocode/json?address=${countryCode},${postalCode}&key=${GOOGAPI}`,
		method: 'GET'
	};

	apiCall(latLonOptions, getLatLon, googleErr, self);

}

function getLatLon(response, self) {
	console.log(response)
	const city = response.results[0].address_components[1].short_name;
	const state = response.results[0].address_components[3].short_name;
	const lat = response.results[0].geometry.location.lat;
	const lon = response.results[0].geometry.location.lng;
	const timestamp = Math.floor(Date.now()/1000);
	console.log(city);
	console.log(state);
	console.log(lat);
	console.log(lon);

	const gmapstzOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${GOOGAPI}`,
		method: 'GET'
	};
	console.log(gmapstzOptions.path);
	apiCall(gmapstzOptions, getTimezone, googleErr, self);
}

function getTimezone(response, self) {
	console.log(response);	
	const timezone = response.timeZoneId;
	const rawOffset = response.rawOffset;
	console.log(timezone);
	console.log(`secs: ${rawOffset}`);

	getNextMatch(rawOffset, self);
}

function googleErr(self) {
	self.emit(':tell', "There was a problem with google maps.");
}

////////////////////////////////////////////////
// Helper functions
function getCalendarMatchDate(secondsSinceEpoch) {
	const months = ['Jan.','Feb.','Mar.','Apr.','May.','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
	let date = new Date(secondsSinceEpoch);

	const y = date.getFullYear();
	const m = months[date.getMonth()];
	const d = date.getDate();
	const clkStr = date.toLocaleTimeString('en-US')

	const dateStr = m + " " + d + " " + y +" " + clkStr;

	return dateStr;
}
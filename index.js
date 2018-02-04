'use-strict';

const Alexa = require('alexa-sdk');
const https = require("https");

const languageStrings = require('./languageStrings').languageStrings;
const teamIDs = require('./teamID').ids;
const OWL_URL = "https://api.overwatchleague.com/";

////////////////////////////////////////////////

const handlers = {

	'LaunchRequest' : function() {
		let speechOutput = this.t('WELCOME_MSG');
		this.emit(':tell', speechOutput);
	},
	'GetNextMatchIntent' : function() {
		const teamSlot = this.event.request.intent.slots.Team;

		let team;
		if (teamSlot && teamSlot.value) {
			team = teamSlot.value.toLowerCase();
		} else {
			console.log('No team seemed to be specified...');
			this.emit(':tell', this.t('SHUTDOWN_MSG'));
		}

		// get team id
		const id = teamIDs[team];

		if (id) {
		// prepare the url
		const url = OWL_URL + 'teams/' + id

		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;
		getOWL(url, nextMatch, team, self);

		} else {
			this.response.speak(this.t('INVALID_TEAM_MSG', team)).listen(this.t('TEAM_REPROMPT'));
			this.emit(':responseReady');
		}
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
	alexa.resources = languageStrings;

	// register alexa function handlers and away we go!
	alexa.registerHandlers(handlers);
	alexa.execute();	
}


////////////////////////////////////////////////
// Intent functions

function nextMatch(response, team, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing
		console.log("Error, response was empty.");
		self.response.speak(this.t('API_ERROR_MSG'));
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

		stNextMatch = stTimes[0];
		calNextMatch = getCalendarMatchDate(stNextMatch);

		// return back to alexa
		let speechOutput = "The next " + team + " game will be " + calNextMatch;
		console.log(speechOutput);
		console.log();

		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

// connect to overwatch api
function getOWL(url, callback, team, self) {
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			return callback(body, team, self);
		});
	});
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
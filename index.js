'use strict';

const Alexa = require('alexa-sdk');
const https = require("https");

const languageStrings = require('./languageStrings').languageStrings;

const OWL_URL = "https://api.overwatchleague.com/";

const APP_ID = "amzn1.ask.skill.3efe9a5c-f690-4bd2-b573-a57607b7e109";
const GOOGAPI = "AIzaSyDxKQfECCXrH4YGUVMHFY4OuV7iYSiYYKo";

////////////////////////////////////////////////
// console.log(new Date().getTimezoneOffset());
const handlers = {

	'LaunchRequest' : function() {
		let speechOutput = this.t('WELCOME_MSG');
		this.emit(':tell', speechOutput);
	},
	'GetNextMatchIntent' : function() {
		// need to propagate alexa through the asynch chain, cast as 'self'.
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
	let resolutions = {};
	let team;
	let id;

	if (teamSlot && teamSlot.resolutions) {
		 //TODO: check if length greater than one. We could be introuble
		resolutions = teamSlot.resolutions.resolutionsPerAuthority[0];
	
		if(resolutions.status.code == "ER_SUCCESS_MATCH") {
			const resolutionValues = resolutions.values[0];
			team = resolutionValues.value.name;
			id = resolutionValues.value.id;
		} else {
			// ow error no match. TODO: Look into if this error needs to be differnet and more helpful to the user.
			self.response.speak(self.t('INVALID_TEAM_MSG', teamSlot.value)).listen(self.t('TEAM_REPROMPT'));
			self.response.cardRenderer("error", resolutions.status.code);
			self.emit(':responseReady');
		}

	} else {
		//ow user spoke nothing with a synonym. TODO: Look into if this error needs to be differnet and more helpful to the user.
		self.response.speak(self.t('INVALID_TEAM_MSG', team)).listen(self.t('TEAM_REPROMPT'));
		self.emit(':responseReady');
	}

	// if (teamSlot && teamSlot.value) {
	// 	team = teamSlot.value.toLowerCase();
	// } else {
	// 	console.log('No team seemed to be specified...');
	// 	self.emit(':tell', self.t('SHUTDOWN_MSG'));
	// }

	// // get team id
	// const id = teamIDs[team];

	// prepare the url
	const url = OWL_URL + 'teams/' + id

	getOWL(url, nextMatch, team, rawOffset, self);

	// } else {
	// 	self.response.speak(self.t('INVALID_TEAM_MSG', team)).listen(self.t('TEAM_REPROMPT'));
	// 	self.emit(':responseReady');
	// }
}

function nextMatch(response, team, rawOffset, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		self.response.speak(self.t('API_ERROR_MSG'));
		self.emit(':responseReady');
	} else {
		// try to sort the dictionary
		let teamId = response.id;

		// get the matches as an array from the schedule entry
		let matches = response.schedule;

		//sort the matches
		matches = matches.sort(compareTimes);

		//compare for next start time
		let now = Date.now()
		let liveMatch = {}; //techincally, they could be playing right now.
		while(matches[0].startDate < now) {
			if (matches[0].endDate > now) {
				// will record that a live match for the team is happening, but will also get next match.
				liveMatch = matches[0];
			}
			matches.shift();
		}

		// if their is a live match get that information
		let isWinning = 0;
		let isTied = 0;
		let scores = []; //array of two {} i.e. scores[i].value
		let matchStatus = "";
		let introStatus = "";
		let matchCompetitor = {};
		if (liveMatch.id) {
			scores = liveMatch.scores;

			// if tied we can just zoom on through
			if (scores[0].value === scores[1].value) {
				isTied = 1;
			} else {
				//else we need to find out who's who
				const team1 = liveMatch.competitors[0];
				const team2 = liveMatch.competitors[1];


				const isTeam1 = (team1.id === teamId? 1: 0);
				isWinning = 0;
				if (isTeam1) {
					if (scores[0].value > scores[1].value) {
						isWinning = 1;
					}
					matchCompetitor = team2;
				} else {
					if (scores[1].value > scores[0].value) {
						isWinning = 1;
					}
					matchCompetitor = team1;
					// flip the score around, might be a better way to do this.
					const tmp = scores[0];
					scores[0] = scores[1];
					scores[1] = tmp;
				}
			}

			if (isTied) {
				introStatus = getRandomEntry(introTied);
				matchStatus = getRandomEntry(statusTied);
			} else {
				if (isWinning) {
					introStatus = getRandomEntry(introWinning);
					matchStatus = getRandomEntry(statusWinning);
				} else {
					introStatus = getRandomEntry(introLosing);
					matchStatus = getRandomEntry(statusLosing);
				}
			}
		}

		// get information about the next match
		const nextMatch = matches[0];
		let home = {}; // team of interest
		let away = {};
		const competitors = nextMatch.competitors;
		for (var j in competitors) {
			if (competitors[j].id == teamId) {
				home = competitors[j];
			} else {
				away = competitors[j];
			}
		}
		const calTime = getCalendarMatchDate(nextMatch.startDate, rawOffset*1000);

		// configure the output and return to alexa
		let liveMatchContent = "";
		if (liveMatch.id) {
			liveMatchContent = `A game for the ${home.name} is happening right now!\n\n${introStatus}. The ${home.name} are ${matchStatus} the ${matchCompetitor.name}. The score is ${scores[0].value} to ${scores[1].value}.\n\nIn their next game, `;
		}

		const vsPhrase = getRandomEntry(vs);
		let nextMatchContent = `The ${home.name} will ${vsPhrase} the ${away.name} on ${calTime.month} ${calTime.day} at ${calTime.clkStr}.`
		// prepare card
		const cardTitle = "Match Details";
		const cardContent = `${liveMatchContent}${nextMatchContent}\n\nTheir record is ${response.ranking.matchWin}-${response.ranking.matchLoss}.`;
		const cardImg = {
			smallImageUrl: home.logo,
			largeImageUrl: home.logo
		};
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		// prepare speech
		let speechOutput = `${liveMatchContent}${nextMatchContent}`;

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

	const latLonOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/geocode/json?address=${countryCode},${postalCode}&key=${GOOGAPI}`,
		method: 'GET'
	};

	apiCall(latLonOptions, getLatLon, googleErr, self);

}

function getLatLon(response, self) {
	const city = response.results[0].address_components[1].short_name;
	const state = response.results[0].address_components[3].short_name;
	const lat = response.results[0].geometry.location.lat;
	const lon = response.results[0].geometry.location.lng;
	const timestamp = Math.floor(Date.now()/1000);

	const gmapstzOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${GOOGAPI}`,
		method: 'GET'
	};

	apiCall(gmapstzOptions, getTimezone, googleErr, self);
}

function getTimezone(response, self) {
	const timezone = response.timeZoneId;
	const rawOffset = response.rawOffset;

	getNextMatch(rawOffset, self);
}

function googleErr(self) {
	self.emit(':tell', "There was a problem with google maps.");
}

////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////
function compareTimes(a,b) {
	if (a.startDate < b.startDate) {
		return -1;
	}
	if (a.startDate > b.startDate) {
		return 1;
	}
	return 0;
}

function getCalendarMatchDate(secondsSinceEpoch, rawOffset) {

	if (rawOffset) {
		secondsSinceEpoch = secondsSinceEpoch + rawOffset;
	}

	const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	let date = new Date(secondsSinceEpoch);

	const y = date.getFullYear();
	const m = months[date.getMonth()];
	const d = date.getDate();
	const clkStr = date.toLocaleTimeString('en-US')

	let dateObj = {
		year: y,
		month: m,
		day: d,
		clkStr: clkStr
	};
	//const dateStr = m + " " + d + " " + y +" " + clkStr;
	//return dateStr;
	return dateObj;
}

function getRandomEntry(list) {
	const idx = Math.floor(Math.random()*list.length);
	return list[idx];
}	

// TODO: should we think about converting these to language string?
const vs = [
	"face",
	"showdown with",
	"compete with",
	"play against",
	"compete against",
	"contend with",
	"rival",
	"go head to head with",
	"challenge",
	"take on",
	"battle",
	"throw down with",
	"clash with"
];

const introTied = [
	"It's a close one",
	"This could be a close one. The game is tied",
	"Things might come down to a coin flip",
	"Chances are good"
];

const introWinning = [
	"This has been a piece of cake",
	"So far so good",
	"There is a good chance of victory",
	"It has been a good match",
	"Prepare the confetti",
];

const introLosing = [
	"Oh no, lets hope for a comeback",
	"Things are not looking to good",
	"This game is on the rocks",
	"We may need a miracle"
];

const statusWinning = [
	"winning against",
	"beating",
	"so far triumphant over",
	"laying the smack down on",
	"taking advantage over",
];

const statusLosing = [
	"losing against",
	"struggling against",
	"getting beating from",
	"trying to survive against",
	"crushing beneath",
];

const statusTied = [
	"fighting hard against",
	"currently tied against",
	"looking to overcome",
	"tied with",
	"neck to neck with"
];
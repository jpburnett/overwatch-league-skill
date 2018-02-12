'use strict';

const Alexa = require('alexa-sdk');
const https = require("https");
const languageStrings = require('./languageStrings').languageStrings;
const appResources = require('./resources');

const KEYS = appResources.API_KEYS;
const AUDIO = appResources.AUDIO;
const TEAMS = appResources.TEAMS;

const OWLRes = appResources.URL;;
const OWL_URL = "https://api.overwatchleague.com/";

const APP_ID = KEYS.APP_ID;
const GOOG_API = KEYS.GOOG_API;

//////////////////////////////////////////////////////////////////////////////
// Intents
//////////////////////////////////////////////////////////////////////////////
const handlers = {

	'LaunchRequest' : function() {
		const speechOutput = this.t('WELCOME_MSG', getRandomEntry(TEAMS));
		const ssmlSpeech = `<audio src=\"${AUDIO.hiThere}\" /> ${speechOutput} And, remember, <audio src=\"${AUDIO.moreHeros}\" />`; // can embbed the speech in the ssml since it is a short clip.
		const reprompt = this.t('WELCOME_REPROMPT', getRandomEntry(TEAMS));

		this.response.speak(ssmlSpeech).listen(reprompt);
		this.emit(':responseReady');
	},
	'GetNextTeamMatchIntent' : function() {
		// 1. Get zipcode
		// 2. Get the requested team information.
		// 3. Parse team response for next match

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

		// launch callback hell. getNextTeamMatch (i.e., owlCallback) is the function where we
		// 'merge' back with the OWL app.
		self.attributes.owlCallback = [];
		self.attributes.owlCallback.push(getTeamById);

		apiCall(options, getPostalCode, requestPermissions, self);

	},
	'GetNextMatchIntent' : function () {
		// 1. Get zipcode
		// 2. Get rankings.
		// 3. From rankings determine stage, save stage or emit stage.
		// 4. Get schedule.
		// 5. Parse the scheudle and get the match.

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

		// launch callback hell. getStageFromRankings (i.e., owlCallback) is the function where we
		// 'merge' back with the OWL app.
		self.attributes.owlCallback = [getNextMatch, getSchedule, getStage, getRankings];
		apiCall(options, getPostalCode, requestPermissions, self);
	},
	'AMAZON.CancelIntent' : function() {
		var self = this;
		closeWithSSMLAudio(self);
	},
	'AMAZON.StopIntent' : function() {
		var self = this;
		closeWithSSMLAudio(self);
	},
	'Unhandled' : function() {
		console.log("error: Unhandled intent");
		var self = this;
		closeWithSSMLAudio(self);
	}
}

//////////////////////////////////////////////////////////////////////////////
// Initialize Alexa and connect the application 
//////////////////////////////////////////////////////////////////////////////
exports.handler = function(event, context) {
	
	const alexa = Alexa.handler(event, context);

	// configure alexa
	alexa.APP_ID = APP_ID;
	alexa.resources = languageStrings;

	// register alexa function handlers and away we go!
	alexa.registerHandlers(handlers);
	alexa.execute();	
}

//////////////////////////////////////////////////////////////////////////////
// Intent functions
//////////////////////////////////////////////////////////////////////////////
function closeWithSSMLAudio(self) {
	const ssmlSpeech = `Goodbye! And don't forget, <audio src=\"${AUDIO.moreHeros}\" />`;
	self.response.speak(ssmlSpeech);
	self.emit(':responseReady');
}

function closeWithSpeech(self) {
	self.emit(':tell', self.t('SHUTDOWN_MSG'));
}

// Get team information.
function getTeamById(self) {
	// 	After all that callback we can now finally work with OWL.
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

	self.attributes.team = team; //TODO: not sure team is needed any more??? Because much like id we just pull it out of the response. If anything this represents the saved "spoken" team value from Alexa
	// prepare the url
	// const url = OWL_URL + 'teams/' + id
	// getOWL(url, nextTeamMatch, self);

	const path = `/teams/${id}`;
	const endpoint = 'api.overwatchleague.com';
	let options = {
		host : endpoint,
		path : path,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, nextTeamMatch, OWLErr, self);
}

function nextTeamMatch(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		self.response.speak(self.t('API_ERROR_MSG'));
		self.emit(':responseReady');
	} else {
		// set variables we saved in the Alexa event attributes to use
		let team = self.attributes.team;
		let rawOffset = self.attributes.rawOffset;

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
			//We need to first find out who's who
			const team1 = liveMatch.competitors[0];
			const team2 = liveMatch.competitors[1];

			const isTeam1 = (team1.id === teamId? 1: 0);

			// Are we tied
			if (scores[0].value === scores[1].value) {
				isTied = 1;
				introStatus = getRandomEntry(introTied);
				matchStatus = getRandomEntry(statusTied);
				if (isTeam1) {
					matchCompetitor = team2;
				} else {
					matchCompetitor = team1;
				}
			} else {
				// Are we winning or losing
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
			// set phrase status
			if (isWinning) {
				introStatus = getRandomEntry(introWinning);
				matchStatus = getRandomEntry(statusWinning);
			} else {
				introStatus = getRandomEntry(introLosing);
				matchStatus = getRandomEntry(statusLosing);
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
		const calTime = getCalendarMatchDate(nextMatch.startDate, now, rawOffset*1000);

		// configure the output and prepare alexa response
		// prepare speech
		let liveMatchContent = "";
		if (liveMatch.id) {
			liveMatchContent = `A game for the ${home.name} is happening right now!\n\n${introStatus}. The ${home.name} are ${matchStatus} the ${matchCompetitor.name}. The score is ${scores[0].value} to ${scores[1].value}.\n\nIn their next game, `;
		}

		const vsPhrase = getRandomEntry(vs);
		let nextMatchContent = `The ${home.name} will ${vsPhrase} the ${away.name}`;
		if (calTime.isToday) {
			nextMatchContent = `${nextMatchContent} today at ${calTime.clkStr}.`;
		} else if (calTime.isTomrrow) {
			nextMatchContent = `${nextMatchContent} tomorrow at ${calTime.clkStr}.`;
		} else {
			nextMatchContent = `${nextMatchContent} on ${calTime.dow} ${calTime.month} ${calTime.date} at ${calTime.clkStr}.`
		}
		const speechOutput = `${liveMatchContent}${nextMatchContent}`;

		// prepare card
		const cardTitle = "Match Details";
		const cardContent = `${liveMatchContent}${nextMatchContent}\n\nTheir record is ${response.ranking.matchWin}-${response.ranking.matchLoss}.`;
		const cardImg = {
			smallImageUrl: home.logo,
			largeImageUrl: home.logo
		};

		// configure alexa
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// We use ranking because it seems like the easiest place to get the current stage
// to minimize our next match search. ** An idea could be to make a queue of owlEndpoints
// in the attributes that we look for to indicate if we are done or where we go next
// with the information.... seems like a lot of work right now though
function getRankings(self) {
	const endpoint = 'api.overwatchleague.com';
	let options = {
		host : endpoint,
		path : `/ranking`,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, callback, OWLErr, self);
}

function getSchedule(self) {
	const endpoint = 'api.overwatchleague.com';
	let options = {
		host : endpoint,
		path : `/schedule`,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, callback, OWLErr, self);
}

// uses ranking response to determine what stage we are in overwatch. Will break after regular season? (i.e. needs to handle playoffs.)
function getStage(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		self.response.speak(self.t('API_ERROR_MSG'));
		self.emit(':responseReady');
	} else {

		const played = response.matchesConcluded;
		const matchesPerStage = 60;

		// need to handle playoffs.
		self.attributes.stage = Math.floor(played/matchesPerStage) + 1; //idx representing stage in stages array returned from /schedule endpoint. preason=0, regular season=1-4, playoffs=5, finals=6, all-star=7.
	}

	const callback = self.attributes.owlCallback.pop();
	if (callback != null) {
		const options = null;
		apiCall(options, callback, OWLErr, self);
	} else {
		// TODO: improve alexa response if we want to.
		const speechOutput = "Overwatch league is current in stage ${2}.";
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

// Get ANY next OWL match
function getNextMatch(response, self) {
	// get anything saved in event attributes we picked up along the way.
	let rawOffset = self.attributes.rawOffset;
	let stageIdx = self.attributes.stage; //preason=0, regular season=1-4, playoffs=5, finals=6, all-star=7.

	// there are no alexa slots for this intent so we just get to parse and build the response
	const stages = response.data.stages;
	let matches = stages[stageIdx].matches;

	//sort the matches
	matches = matches.sort(compareTimesTS);

	//compare for next start time
	let now = Date.now()
	let liveMatch = {}; //techincally, there could be a game happening right now.
	while(matches[0].startDate < now) {
		if (matches[0].endDate > now) {
			// will record that a live match is happening, but will also get next match.
			liveMatch = matches[0];
		}
		matches.shift();
	}

	// if their is a live match get that information
	let team1Winning = 0;
	let isTied = 0;
	let scores = []; //array of two {} i.e. scores[i].value
	let team1Live = {};
	let team2Live = {};
	if (liveMatch.id) {
		scores = liveMatch.scores;
		//We need to first find out who's who
		team1 = liveMatch.competitors[0];
		team2 = liveMatch.competitors[1];

		// Are we tied
		if (scores[0].value === scores[1].value) {
			isTied = 1;
			matchStatus = getRandomEntry(statusTied);
		} else {
			if(scores[0].value > scores[1].value) {
				team1Winning = 1;
				matchStatus = getRandomEntry(statusWinning);
			} else {
				matchStatus = getRandomEntry(statusLosing);
			}
		}
	}

	// get information about the next match
	const nextMatch = matches[0];
	const team1 = nextMatch.competitors[0];
	const team2 = nextMatch.competitors[1];
	
	const calTime = getCalendarMatchDate(nextMatch.startDateTS, now, rawOffset*1000);

	// configure the output and prepare alexa response
	// prepare speech
	let liveMatchContent = "";
	if (liveMatch.id) {
		liveMatchContent = `There is a live game right now! The ${team1.name} are ${matchStatus} the ${team2.name}. The score is ${scores[0].value} to ${scores[1].value}. `;
	}

	const vsPhrase = getRandomEntry(vs);
	let nextMatchContent = `The ${team1.name} will ${vsPhrase} the ${team2.name}`;
	if (calTime.isToday) {
		nextMatchContent = `${nextMatchContent} today at ${calTime.clkStr}.`;
	} else if (calTime.isTomrrow) {
		nextMatchContent = `${nextMatchContent} tomorrow at ${calTime.clkStr}.`;
	} else {
		nextMatchContent = `${nextMatchContent} on ${calTime.dow} ${calTime.month} ${calTime.date} at ${calTime.clkStr}.`
	}
	const speechOutput = `${liveMatchContent}${nextMatchContent}`;

	// prepare card
	const cardTitle = "Match Details";
	const cardContent = `${liveMatchContent}${nextMatchContent}`;
	const cardImg = {
		smallImageUrl: OWLRes.Logo,
		largeImageUrl: OWLRes.logo
	};

	// configure alexa
	self.response.cardRenderer(cardTitle, cardContent, cardImg);
	self.response.speak(speechOutput);
	self.emit(':responseReady');
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// connect to overwatch api ** this now looks like apiCall shoudl combine
function getOWL(url, callback, self) {
	https.get(url, res => {
		res.setEncoding("utf8");
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

function requestPermissions(self) {
	let speechOutput = self.t('WELCOME_MSG');
	speechOutput += ' In order to get match start times in your local time I need your permission to access your device information. Please see your Alexa companion app, then try your request again.';

	const permissions = ["read::alexa:device:all:address:country_and_postal_code"];
	self.response.askForPermissionsConsentCard(permissions);

	self.response.speak(speechOutput);

	self.emit(':responseReady');
}

//owlCallback is the intended endpoint when all the information (i.e., timezone)
function apiCall(options, callback, error, self) {
	// this is here to allow pass through of different data that did not require an api call and since a lot
	// of methods require an api call compared to the few that don't just handled it here.
	if (options == null) {
		callback(self);
	} else {
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
}

function getPostalCode(response, self) {
	let countryCode = "";
	let postalCode = "";
	if (response.countryCode && response.postalCode) {
		countryCode = response.countryCode;
		postalCode = response.postalCode;
	} else {
		//TODO: Maybe generate a better error response
		self.response.speak(self.t('API_ERROR_MSG'));
		self.emit(':responseReady');
	}

	const latLonOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/geocode/json?address=${countryCode},${postalCode}&key=${GOOG_API}`,
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
		path: `/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${GOOG_API}`,
		method: 'GET'
	};

	apiCall(gmapstzOptions, getTimezone, googleErr, self);
}

function getTimezone(response, self) {
	const timezone = response.timeZoneId;
	const rawOffset = response.rawOffset;

	self.attributes.rawOffset = rawOffset;

	const callback = self.attributes.owlCallback.pop();
	callback(self);
}

function OWLErr(self) {
	self.response.speak(self.t('API_ERROR_MSG'));
	self.emit(':responseReady');
}

function googleErr(self) {
	self.response.speak(self.t('API_ERROR_MSG'));
	self.emit(':responseReady');
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

function compareTimesTS(a,b) {
	if (a.startDateTS < b.startDateTS) {
		return -1;
	}
	if (a.startDateTS > b.startDateTS) {
		return 1;
	}
	return 0;
}

function getCalendarMatchDate(matchTimeSeconds, nowSeconds, rawOffset) {

	if (rawOffset) {
		matchTimeSeconds = matchTimeSeconds + rawOffset;
	} else {
		rawOffset = 0;
	}

	const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	let date = new Date(matchTimeSeconds);

	let y = date.getFullYear();
	let m = date.getMonth();
	let d = date.getDate();
	const dow1 = date.getDay();
	const clkStr = date.toLocaleTimeString('en-US');

	let dateObj = {
		year: y,
		month: months[m],
		date: d,
		dow: weekdays[dow1],
		clkStr: clkStr,
		isToday: 0,
		isTomorrow: 0,
	};

	// How about relative to today?
	let isToday = 0;
	let isTomorrow = 0;

	let now = new Date(nowSeconds);
	y = now.getFullYear();
	m = now.getMonth();
	d = now.getDate();
	const dow2 = now.getDay();

	// check if the game is today
	let morningNow = new Date(y, m, d, 0, 0, 0, 0);
	morningNow.getTime();
	let midnightNow = new Date(y, m, d, 23, 59, 59, 999);
	midnightNow = midnightNow.getTime();
	if (morningNow < matchTimeSeconds-rawOffset && midnightNow > matchTimeSeconds-rawOffset) {
		dateObj.isToday = 1;
	} else {
		// check if it is tomorrow.
		let midnightTomorrow = new Date(midnightNow+(24*3600*1000));
		midnightTomorrow = midnightTomorrow.getTime();

		if (midnightNow < matchTimeSeconds-rawOffset && midnightTomorrow > matchTimeSeconds-rawOffset) {
			dateObj.isTomorrow = 1;
		}
	}

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
	"losing to"
];

const statusTied = [
	"fighting hard against",
	"currently tied against",
	"looking to overcome",
	"tied with",
	"neck to neck with"
];
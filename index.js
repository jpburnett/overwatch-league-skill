'use strict';

const Alexa = require('alexa-sdk');
const https = require("https");
const languageStrings = require('./languageStrings').languageStrings;
const appResources = require('./resources');

const KEYS = appResources.API_KEYS;
const AUDIO = appResources.AUDIO;
const TEAMS = appResources.TEAMS;
const OWL = appResources.OWL;;

const APP_ID = KEYS.APP_ID;
const GOOG_API = KEYS.GOOG_API;

//////////////////////////////////////////////////////////////////////////////
// Alexa intents
//////////////////////////////////////////////////////////////////////////////
const handlers = {

	'LaunchRequest' : function() {
		const speechOutput = this.t('WELCOME_MSG', getRandomEntry(TEAMS));
		const entry = getRandomEntry(Object.keys(AUDIO.greetings));
		const ssmlSpeech = `<audio src=\"${AUDIO.greetings[entry]}\"/> ${speechOutput} And, remember, <audio src=\"${AUDIO.moreHeros}\" />`; // can embbed the speech in the ssml since it is a short clip.
		const reprompt = this.t('WELCOME_REPROMPT', getRandomEntry(TEAMS));

		this.response.speak(ssmlSpeech).listen(reprompt);
		this.emit(':responseReady');
	},
	'GetNextTeamMatchIntent' : function() {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		// the owlCallback attribute is a stack of functions used to traverse api's
		// in order to collect the required information.
		// 1. Get timezone from zipcode
		// 2. determine and save offset from timezone
		// 3. Get the requested team information
		// 4. Parse team response for next match
		self.attributes.owlCallback = [getNextTeamMatch,
										getTeamById,
										offsetFromTimezone,
										getTimezoneFromZipLatLon];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'GetNextMatchIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		// the owlCallback attribute is a stack of functions used to traverse api's
		// in order to collect the required information
		// 1. Get timezone from zipcode
		// 2. determine and save offset from timezone
		// 3. Get rankings
		// 4. determine stage from rankings save stage
		// 5. Get schedule
		// 6. Parse the scheudle and get the match
		self.attributes.owlCallback = [getNextMatch,
										getSchedule,
										getStage,
										getRankings,
										offsetFromTimezone,
										getTimezoneFromZipLatLon];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'GetTodaysMatchesIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		// the owlCallback attribute is a stack of functions used to traverse api's
		// in order to collect the required information
		// 1. Get timezone from zipcode
		// 2. determine and save offset from timezone
		// 3. Get rankings
		// 4. determine stage from rankings save stage
		// 5. Get schedule
		// 6. Parse the scheudle and get tonights matches from users time.
		self.attributes.owlCallback = [getTodaysMatches,
										getSchedule,
										getStage,
										getRankings,
										offsetFromTimezone,
										getTimezoneFromZipLatLon];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'GetYesterdaysResultsIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;
		// the owlCallback attribute is a stack of functions used to traverse api's
		// in order to collect the required information
		// 1. Get timezone from zipcode
		// 2. determine and save offset from timezone
		// 3. Get rankings
		// 4. determine stage from rankings save stage
		// 5. Get schedule
		// 6. Parse the scheudle and get what happend yesterday.
		self.attributes.owlCallback = [getYesterdaysResults,
										getSchedule,
										getStage,
										getRankings,
										offsetFromTimezone,
										getTimezoneFromZipLatLon];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'GetTeamRecordIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		self.attributes.owlCallback = [getTeamRecord,
										getTeamById];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'GetStandingsIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		self.attributes.owlCallback = [getTeamStandings,
										getRankings];

		const callback = self.attributes.owlCallback.pop();
		callback(self);

	},
	'GetTopTeamIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;


		self.attributes.owlCallback = [getTopTeam,
										getRankings];

		const callback = self.attributes.owlCallback.pop();
		callback(self);

	},
	'GetCurrentStageIntent' : function () {
		// need to propagate alexa through the asynch chain, cast as 'self'.
		var self = this;

		// the owlCallback attribute is a stack of functions used to traverse api's
		// in order to collect the required information
		// 1. Get rankings
		// 2. detremine stage from rankings and emit
		self.attributes.owlCallback = [getStage, getRankings];

		const callback = self.attributes.owlCallback.pop();
		callback(self);
	},
	'AMAZON.HelpIntent' : function () {
		const team1 = getRandomEntry(TEAMS);
		let team2 = getRandomEntry(TEAMS);
		while (team2 == team1) {
			team2 = getRandomEntry(TEAMS);
		}
		const speechOutput = this.t('HELP_MSG', team1, team2);
		const reprompt = this.t('HELP_REPROMPT');
		this.response.speak(speechOutput).listen('HELP_REPROMPT');
		this.emit(':responseReady');
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
		// TODO: Launch a help message explaining available commands.
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
	alexa.appId = APP_ID;
	alexa.resources = languageStrings;

	// register alexa function handlers and away we go!
	alexa.registerHandlers(handlers);
	alexa.execute();	
}

//////////////////////////////////////////////////////////////////////////////
// Intent implementation functions
//////////////////////////////////////////////////////////////////////////////
function getTeamRecord(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		OWLErr(self);
	} else {
		const team = self.attributes.team;
		const rankings = response.ranking;

		const W = rankings.matchWin;
		const L = rankings.matchLoss;

		const speechOutput = `The ${team} have a record of ${W} wins and ${L} ${L == 1 ? 'loss' : 'losses'}.`;
		const cardTitle = `${team}: ${W}-${L}`;
		const cardContent = ``;
		const cardImg = {
			smallImageUrl: response.logo,
			largeImageUrl: response.logo
		};

		// emit response
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');

	}
}

function getTopTeam(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		OWLErr(self);
	} else {
		const rankings = response.content;
		const topTeam = rankings[0].competitor;
		const record = rankings[0].records;
		const name = topTeam.name;
		const W = record[0].matchWin;
		const L = record[0].matchLoss;

		let speechOutput = `The ${name} are the number one team in the league right now. They have a record of ${W} wins and ${L} ${L == 1 ? 'loss' : 'losses'}.`;
		const cardTitle = "Standings";
		const cardContent = `The ${name} are the number one team in the league right now.\n${W}-${L}`;
		const cardImg = {
			smallImageUrl: topTeam.logo,
			largeImageUrl: topTeam.logo
		};

		// emit response
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

function getTeamStandings(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		OWLErr(self);
	} else {
		let speechOutput = "";
		const rankings = response.content;
		const numberSlot = self.event.request.intent.slots["AMAZON.NUMBER"];
		const fullSlot = self.event.request.intent.slots.Standings;
		let numTeams = 0;
		
		if (numberSlot && numberSlot.value) {
			numTeams = numberSlot.value;
			// need to handle people with a sense of humor....
			if (numTeams == 0) {
				speechOutput = `${speechOutput}I am sorry, but asking for the top zero teams is a little silly, don\'t you think? Is there something else you would like to know?`;
				self.response.speak(speechOutput).listen(self.t('SIMPLE_REPROMPT'));
				self.emit(':responseReady');
			}
			if (numTeams < 0) {
				speechOutput = `${speechOutput}Even I know that makes no sense. You need to ask for a positive number. Is there something else you would like to know?`;
				self.response.speak(speechOutput).listen(self.t('SIMPLE_REPROMPT'));
				self.emit(':responseReady');
			}
			if (numTeams > 12) {
				speechOutput = `${speechOutput}I am sorry but there are only 12 teams in the league right now. I will tell you the standings for all of them.`
				numTeams = 12;
			}
		} else if (fullSlot && fullSlot.value) {
			numTeams = 12;

		} else {
			// generally default to top 3 teams.
			numTeams = 3;
		}

		// build sentence response baised on number of teams requested.
		if (numTeams == 12) {
			speechOutput = `${speechOutput} From first place to last place, the current league standings are: `
		} else if (numTeams == 1) {
			speechOutput = `The top team in the league right now is:`;
		} else {
			speechOutput = `The top ${numTeams} teams in the league right now are:`;
		}
		const cardTitle = "Standings";
		let cardContent = speechOutput;
		let cardImg = {
			smallImageUrl: "",
			largeImageUrl: ""
		};

		// full in the speech information
		let i = 0;
		for (i; i < numTeams; i++) {
			const team = rankings[i].competitor;
			const record = rankings[i].records;
			const name = team.name;

			// the 'or' condition here catches if only one team name was given to give a gramatically correct sentence.
			if (i != numTeams -1 || numTeams == 1) {
				speechOutput = `${speechOutput} the ${name},`;
			} else {
				speechOutput = `${speechOutput} and the ${name}.`;
			}

			cardContent = `${cardContent}\n${name}\t${record[0].matchWin}-${record[0].matchLoss}`;
			if (i == 0) {
				cardImg.smallImageUrl = team.logo;
				cardImg.largeImageUrl = team.logo;
			}
		}

		// emit response
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	} 
}

function getYesterdaysResults(response, self) {
	// TODO: probably should check if resposne comes back with something like we did in other function like getNextTeamMatch

	// Get what we need saved in event attributes we had picked up along the way
	let rawOffset = self.attributes.rawOffset;
	let stageIdx = self.attributes.stage;

	const stages = response.data.stages;
	let matches = stages[stageIdx].matches;

	// sort the matches
	matches = matches.sort(compareTimesTS);

	const now = Date.now();

	// quickly cycle through matches until run into yesterday morning
	const nowCal = new Date(now);
	const y = nowCal.getFullYear();
	const m = nowCal.getMonth();
	const d = nowCal.getDate();

	const morningToday = new Date(y,m,d,0,0,0);
	const morningTodaySec = morningToday.getTime();
	const morningYesterdaySec = morningTodaySec - 24*3600*1000;

	while(matches[0].startDateTS < morningYesterdaySec) {
		matches.shift();
	}

	// check relative today if there matches was yesterday
	let yesterdaysMatches = [];
	let calTime = {};
	do {
		const match = matches[0];
		calTime = getCalendarMatchDate(match.startDateTS, now, rawOffset*1000);
		if (calTime.wasYesterday) {
			yesterdaysMatches.push(match);
		}
		matches.shift();
	} while(calTime.wasYesterday)

	// Now have the yesterdays matches, so we can parse the information
	// initialize response content
	let speechOutput = "";
	const cardTitle = "Yesterday's Results";
	let cardContent = "";
	const cardImg = {
		smallImageUrl: OWL.LOGO,
		largeImageUrl: OWL.LOGO
	};

	// no games were played yesterday. TODO: possibility when states are included to go back and fetch last results or when the next games will be.
	if (yesterdaysMatches.length == 0) {
		speechOutput = "There were no games yesterday to report on.";
		cardContent = speechOutput;
		// configure alexa
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}

	speechOutput = `In yesterday's ${yesterdaysMatches.length==1? 'game' : 'games'}`;
	for (let i=0; i < yesterdaysMatches.length; i++) {
		const match = yesterdaysMatches[i];
		const team1 = match.competitors[0];
		const team2 = match.competitors[1];
		const winner = match.winner.name; // there will always be a winner. Map 5 is king of the hill.
		const loser = (team1.name == winner? team2.name : team1.name);
		let scores = match.scores;
		// swap scores is team1 wasn't winner
		if (team1.name == loser) {
			const tmp = scores[0].value;
			scores[0].value = scores[1].value;
			scores[1].value = tmp;
		}

		const resultStr = `the ${winner} beat the ${loser} ${scores[0].value} to ${scores[1].value}`;
		cardContent = `${cardContent}${winner} vs. ${loser}: ${scores[0].value} to ${scores[1].value}`;
		// control flow to build a sentence.
		if (i == 0) {
			speechOutput = `${speechOutput} ${resultStr}.`;
			cardContent = `${cardContent}\n`;
		} else if (i != yesterdaysMatches.length-1) {
			speechOutput = `${speechOutput} Then, ${resultStr}.`;
			cardContent = `${cardContent}\n`;
		} else {
			speechOutput = `${speechOutput} And, ${resultStr}.`;
		}
	}

	// configure alexa
	self.response.cardRenderer(cardTitle, cardContent, cardImg);
	self.response.speak(speechOutput);
	self.emit(':responseReady');
}

function getTodaysMatches(response, self) {
	// get what we need saved in event attributes we had picked up along the way
	let rawOffset = self.attributes.rawOffset;
	let stageIdx = self.attributes.stage;

	const stages = response.data.stages;
	let matches = stages[stageIdx].matches;

	// sort the matches
	matches = matches.sort(compareTimesTS);

	// get the current time
	let  now = Date.now();
	let liveMatch = {}; //technically, there could be a game happening right now.
	while(matches[0].startDateTS < now) {
		if (matches[0].endDateTS > now) {
			// will record that a live match is happening, but will also get next match.
			liveMatch = matches[0];
		}
		matches.shift();
	}

	// matches has been shifted so now check if games are still today.
	let todaysMatches = [];
	let nextMatch = {};
	let calTime = {};
	do {
		nextMatch = matches[0];
		calTime = getCalendarMatchDate(nextMatch.startDateTS, now, rawOffset*1000);
		if(calTime.isToday) {
			todaysMatches.push(nextMatch);
		}
		matches.shift();
	} while(calTime.isToday)
	
	// should have all of today's matches, if any. Start building speech output.
	let speechOutput = "";
	const cardTitle = "Today's Matches";
	let cardContent = "";
	const cardImg = {
		smallImageUrl: OWL.LOGO,
		largeImageUrl: OWL.LOGO
	};
	
	if (!liveMatch.id && !todaysMatches.length) {
		speechOutput = "There are no scheudled Overwatch League games today.";
		cardContent = speechOutput;

		// configure alexa
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}

	// if their is a live match get that information
	let team1Winning = 0;
	let isTied = 0;
	let scores = []; //array of two {} i.e. scores[i].value
	let matchStatus = "";
	let team1Live = {};
	let team2Live = {};
	if (liveMatch.id) {
		scores = liveMatch.scores;
		//We need to first find out who's who
		team1Live = liveMatch.competitors[0];
		team2Live = liveMatch.competitors[1];

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

	// prepare the rest of the speechOutput TODO:: don't like how complicated this is... could the flow be simpler?
	let liveMatchContent = "";
	let todaysMatchesContent = "";
	if (liveMatch.id) {
		liveMatchContent = `There is a live game right now! The ${team1Live.name} are ${matchStatus} the ${team2Live.name}. The score is ${scores[0].value} to ${scores[1].value}.\n`;
		if (todaysMatches > 0) {
			todaysMatchesContent = `Afterwards, today's remaining ${todaysMatches.length == 1 ? 'game is' : 'games are'}:`;
		}
	} else {
		if (todaysMatches.length > 0) {
			todaysMatchesContent = `Today's ${todaysMatches.length == 1 ? 'game is' : 'games are'}:\n`;
		}
	}

	if (todaysMatches.length > 0) {
		for (let i=0; i < todaysMatches.length; i++) {
			const match = todaysMatches[i];
			const team1 = match.competitors[0];
			const team2 = match.competitors[1];
			const matchTime = getCalendarMatchDate(match.startDateTS, now, rawOffset*1000);

			todaysMatchesContent = `${todaysMatchesContent} ${team1.name} vs. ${team2.name} at ${matchTime.clkStr}`;
			if (i != todaysMatches.length-1) {
				todaysMatchesContent = `${todaysMatchesContent}.\n`;
			} else {
				todaysMatchesContent = `${todaysMatchesContent}.`;
			}
		}
	} else {
		todaysMatchesContent = `There are no${liveMatch.id? ' other ' : ' '}scheduled games today.`;
	}

	speechOutput = `${liveMatchContent}${todaysMatchesContent}`;
	cardContent = `${liveMatchContent}${todaysMatchesContent}`;

	// emit response
	self.response.cardRenderer(cardTitle, cardContent, cardImg);
	self.response.speak(speechOutput);
	self.emit(':responseReady');
}

function getNextTeamMatch(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing. TODO: improve this if necessary
		console.log("Error, response was empty.");
		OWLErr(self);
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
			if (isTeam1) {
				matchCompetitor = team2;
			} else {
				matchCompetitor = team1;
			}

			// Are we tied
			if (scores[0].value === scores[1].value) {
				isTied = 1;
			} else {
				// Are we winning or losing
				if (isTeam1) {
					if (scores[0].value > scores[1].value) {
						isWinning = 1;
					}
				} else {
					if (scores[1].value > scores[0].value) {
						isWinning = 1;
					}
					// flip the score around, might be a better way to do this.
					const tmp = scores[0];
					scores[0] = scores[1];
					scores[1] = tmp;
				}
			}
			// set phrase status
			if (isTied) {
				introStatus = getRandomEntry(introTied);
				matchStatus = getRandomEntry(statusTied);
			} else if (isWinning) {
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
		} else if (calTime.isTomorrow) {
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

// Get ANY next OWL match expects response coming from getStage/getSchedule
function getNextMatch(response, self) {
	// get what we need saved in event attributes we had picked up along the way.
	let rawOffset = self.attributes.rawOffset;
	let stageIdx = self.attributes.stage; //preason=0, regular season=1-4, playoffs=5, finals=6, all-star=7.

	// there is not an alexa slot needed for this intent so we just get to start to parse the api response and build the speechOutput
	const stages = response.data.stages;
	let matches = stages[stageIdx].matches;

	// sort the matches
	matches = matches.sort(compareTimesTS);

	// compare for next start time
	let now = Date.now();
	let liveMatch = {}; //techincally, there could be a game happening right now.
	while(matches[0].startDateTS < now) {
		if (matches[0].endDateTS > now) {
			// will record that a live match is happening, but will also get next match.
			liveMatch = matches[0];
		}
		matches.shift();
	}

	// if their is a live match get that information
	let team1Winning = 0;
	let isTied = 0;
	let scores = []; //array of two {} i.e. scores[i].value
	let matchStatus = "";
	let team1Live = {};
	let team2Live = {};
	if (liveMatch.id) {
		scores = liveMatch.scores;
		//We need to first find out who's who
		team1Live = liveMatch.competitors[0];
		team2Live = liveMatch.competitors[1];

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
	console.log(calTime);

	// configure the output and prepare alexa response
	// prepare speech
	let liveMatchContent = "";
	if (liveMatch.id) {
		liveMatchContent = `There is a live game right now! The ${team1Live.name} are ${matchStatus} the ${team2Live.name}. The score is ${scores[0].value} to ${scores[1].value}. After this game, `;
	}

	const vsPhrase = getRandomEntry(vs);
	let nextMatchContent = `The next match will be`;
	if (calTime.isToday) {
		nextMatchContent = `${nextMatchContent} today at ${calTime.clkStr}.`;
	} else if (calTime.isTomorrow) {
		nextMatchContent = `${nextMatchContent} tomorrow at ${calTime.clkStr}.`;
	} else {
		nextMatchContent = `${nextMatchContent} on ${calTime.dow} ${calTime.month} ${calTime.date} at ${calTime.clkStr}.`
	}
	nextMatchContent = `${nextMatchContent} The ${team1.name} will ${vsPhrase} the ${team2.name}.`;
	const speechOutput = `${liveMatchContent}${nextMatchContent}`;

	// prepare card
	const cardTitle = "Match Details";
	const cardContent = `${liveMatchContent}${nextMatchContent}`;
	const cardImg = {
		smallImageUrl: OWL.LOGO,
		largeImageUrl: OWL.LOGO
	};

	// configure alexa
	self.response.cardRenderer(cardTitle, cardContent, cardImg);
	self.response.speak(speechOutput);
	self.emit(':responseReady');
}

// Expects ranking information as the response to determine current stage. 
// TODO: Will break after regular season? (i.e. needs to handle playoffs.)
function getStage(response, self) {
	if (response == '') {
		// something went wrong, OWL API returned nothing.
		// TODO: improve this if necessary
		console.log("Error, response was empty.");
		OWLErr(self);
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
		// prepare speech output
		const speechOutput = `Overwatch league is currently in stage ${self.attributes.stage}.`;

		// prepare card
		const cardTitle = "Current Stage";
		const cardContent = `${speechOutput}`;
		const cardImg = {
			smallImageUrl: OWL.LOGO,
			largeImageUrl: OWL.LOGO
		};

		// configure alexa
		self.response.cardRenderer(cardTitle, cardContent, cardImg);
		self.response.speak(speechOutput);
		self.emit(':responseReady');
	}
}

function closeWithSSMLAudio(self) {
	const ssmlSpeech = `Goodbye! And don't forget, <audio src=\"${AUDIO.moreHeros}\" />`;
	self.response.speak(ssmlSpeech);
	self.emit(':responseReady');
}

function closeWithSpeech(self) {
	self.emit(':tell', self.t('SHUTDOWN_MSG'));
}

function requestPermissions(self) {
	const permissionsWelcome = self.t('PERMISSIONS_WELCOME');
	const permissionsPrompt = self.t('PERMISSIONS_PROMPT');

	const speechOutput = `${permissionsWelcome} ${permissionsPrompt}`;

	const permissions = ["read::alexa:device:all:address:country_and_postal_code"];
	self.response.askForPermissionsConsentCard(permissions);

	self.response.speak(speechOutput);

	self.emit(':responseReady');
}

function OWLErr(self) {
	self.response.speak(self.t('OWL_API_ERR_MSG'));
	self.emit(':responseReady');
}

function googleErr(self) {
	self.response.speak(self.t('GOOG_API_ERR_MSG'));
	self.emit(':responseReady');
}

///////////////////////////////////////////////////////////////////////////////
// Accessing OWL and Google APIs
///////////////////////////////////////////////////////////////////////////////

// Generic method to handle any api call. In OWL the callbacks are stack of functions to trace
// connecting to different APIs if necessary to gather all information. To have a funciton in
// the stack that doesn't require a connection (i.e., when getting any next match and we get
// stage information from rankings set options to null to pass through).
function apiCall(options, callback, error, self) {
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

// Get team information
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
			self.emit(':responseReady');
		}

	} else {
		//ow user spoke nothing with a synonym. TODO: Look into if this error needs to be differnet and more helpful to the user.
		self.response.speak(self.t('INVALID_TEAM_MSG', team)).listen(self.t('TEAM_REPROMPT'));
		self.emit(':responseReady');
	}

	//TODO: not sure team is needed any more??? Because much like id we just pull it out of the response. If anything this represents the saved "spoken" team value from Alexa
	self.attributes.team = team;

	const path = `/teams/${id}`;
	let options = {
		host : OWL.API,
		path : path,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, callback, OWLErr, self);
}

// Get all ranking information
function getRankings(self) {
	let options = {
		host : OWL.API,
		path : `/ranking`,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, callback, OWLErr, self);
}

// Get full match schedule
function getSchedule(self) {
	let options = {
		host : OWL.API,
		path : `/schedule`,
		method : 'GET',
		port: 443
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(options, callback, OWLErr, self);
}

// Get timezone, launches getLatLon and getTimezone
function getTimezoneFromZipLatLon(self) {
	const deviceId = self.event.context.System.device.deviceId;
	const token = self.event.context.System.apiAccessToken;

	let options = {
		host : 'api.amazonalexa.com',
		path : `/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
		headers : {Authorization : `Bearer ${token}`},
		method : 'GET',
		port: 443
	};

	apiCall(options, getLatLon, requestPermissions, self);
}

function getLatLon(response, self) {
	let countryCode = "";
	let postalCode = "";
	if (response.countryCode && response.postalCode) {
		countryCode = response.countryCode;
		postalCode = response.postalCode;
	} else {
		//TODO: Maybe generate a better error response
		googleErr(self);
	}

	const latLonOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/geocode/json?address=${countryCode},${postalCode}&key=${GOOG_API}`,
		method: 'GET'
	};

	apiCall(latLonOptions, getTimezone, googleErr, self);
}

function getTimezone(response, self) {
	let city = "";
	let state = "";
	let lat = "";
	let lon = "";
	if (response.results[0].address_components && response.results[0].geometry) {
		city = response.results[0].address_components[1].short_name;
		state = response.results[0].address_components[3].short_name;
		lat = response.results[0].geometry.location.lat;
		lon = response.results[0].geometry.location.lng;

	} else {
		googleErr(self);
	}

	const timestamp = Math.floor(Date.now()/1000);

	const gmapstzOptions = {
		host: 'maps.googleapis.com',
		path: `/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${GOOG_API}`,
		method: 'GET'
	};

	const callback = self.attributes.owlCallback.pop();
	apiCall(gmapstzOptions, callback, googleErr, self);
}

function offsetFromTimezone(response, self) {
	let timezone = "";
	let rawOffset = "";
	if (response.timeZoneId && response.rawOffset) {
		timezone = response.timeZoneId;
		rawOffset = response.rawOffset;
	} else {
		googleErr(self);
	}

	self.attributes.rawOffset = rawOffset;

	const callback = self.attributes.owlCallback.pop();
	callback(self);
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
		wasYesterday: 0
	};

	let now = new Date(nowSeconds+rawOffset);
	y = now.getFullYear();
	m = now.getMonth();
	d = now.getDate();
	const dow2 = now.getDay();

	// check if the game is today
	let morningNow = new Date(y, m, d, 0, 0, 0, 0);
	morningNow = morningNow.getTime();

	let midnightNow = new Date(y, m, d, 23, 59, 59, 999);
	midnightNow = midnightNow.getTime();

	const morningYesterday = morningNow - (24*3600*1000);
	const midnightTomorrow = midnightNow + (24*3600*1000);

	if (morningNow <= matchTimeSeconds && midnightNow >= matchTimeSeconds) {
		dateObj.isToday = 1;
	} else if (midnightNow < matchTimeSeconds && midnightTomorrow >= matchTimeSeconds) {
		dateObj.isTomorrow = 1;
	} else if (morningYesterday <= matchTimeSeconds && morningNow > matchTimeSeconds) {
		dateObj.wasYesterday = 1;
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
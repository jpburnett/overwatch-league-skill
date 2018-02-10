'use strict';

// import packages
const https = require("https");

// set up environment
const teamID = '4405';
const teamsURL = "https://api.overwatchleague.com/teams/";
const url = teamsURL+teamID;

// test functionality
getOWL(url, nextMatch);


////////////////////////////////////////////////
// Intent functions
////////////////////////////////////////////////
function nextMatch(response) {
	if (response == '') {
		// something went wrong, OWL API returned nothing
		console.log("Error, response was empty.");
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

		// configure the output
		const nextMatch = matches[0];
		const competitors = nextMatch.competitors;
		let home = {};
		let away = {};
		for (var j in competitors) {
			if (competitors[j].id == teamId) {
				home = competitors[j];
			} else {
				away = competitors[j];
			}
		}

		let liveMatchContent = "";
		if (liveMatch.id) {
			liveMatchContent = `A game for the ${home.name} is happening right now!\n${introStatus}. The ${home.name} are ${matchStatus} the ${matchCompetitor.name}. The score is ${scores[0].value} to ${scores[1].value}. In their next game, `;
		}
		// alexa takes over from here
		const calTime = getCalendarMatchDate(nextMatch.startDate);
		const vsPhrase = getRandomEntry(vs);
		let nextMatchContent = `The ${home.name} will ${vsPhrase} the ${away.name} on ${calTime.month} ${calTime.day} at ${calTime.clkStr}`

		let speechOutput = liveMatchContent + nextMatchContent;
		console.log(speechOutput);
		const nameArr = home.name.split(" ");
		console.log(`Their record is ${response.ranking.matchWin}-${response.ranking.matchLoss}\nGood Luck ${nameArr[nameArr.length-1]}!`);
	}
}

// connect to overwatch api
function getOWL(url, callback) {
	https.get(url, res => {
		res.setEncoding("utf8");
		// good practice would be to check status code
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			return callback(body);
		});
	});
}

////////////////////////////////////////////////
// Helpers
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

// helper functions
function getCalendarMatchDate(secondsSinceEpoch) {
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

//${introStatus}. The ${home.name} are ${status} the ${away.name}. The score is ${scores[0].value} to ${scores[1].value}.`)

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
	"This game is on the rocks start",
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






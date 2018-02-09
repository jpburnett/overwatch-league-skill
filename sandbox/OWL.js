'use strict';

// import packages
const https = require("https");

// set up environment
const teamID = '4523';
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
		while(matches[0].startDate < now) {
			matches.shift();
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

		// alexa takes over from here
		const calTime = getCalendarMatchDate(nextMatch.startDate);
		console.log(`The ${home.name} will face the ${away.name} on ${calTime}!`);
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
	const months = ['Jan.','Feb.','Mar.','Apr.','May.','Jun.','Jul.','Aug.','Sep.','Oct.','Nov.','Dec.'];
	let date = new Date(secondsSinceEpoch);

	const y = date.getFullYear();
	const m = months[date.getMonth()];
	const d = date.getDate();
	const clkStr = date.toLocaleTimeString('en-US')

	const dateStr = m + " " + d + " " + y +" " + clkStr;
	return dateStr;
}


const https = require("https");

const teamID = '4523';
const teamsURL = "https://api.overwatchleague.com/teams/";

const url = teamsURL+teamID

let str = "The next Fuel game will be ";

getOWL(url, nextMatch, str);

//********************************************************

// intent functions
function nextMatch(response, str) {
	if (response == '') {
		// something went wrong, OWL API returned nothing
		console.log("Error, response was empty.");
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
		console.log(str + calNextMatch);
		console.log();
	}
}

// connect to overwatch api
function getOWL(url, callback, str) {
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", () => {
			body = JSON.parse(body);
			return callback(body, str);
		});
	});
}

// *************************************************

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
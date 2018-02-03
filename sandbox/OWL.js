const https = require("https");

const teamID = '4523';
const teamsURL = "https://api.overwatchleague.com/teams/";

const url = teamsURL+teamID

//console.log(url);

let responseStr = "The next Fuel game will be ";

getOWL(url, nextMatch);


//********************************************************

// connect to overwatch api
function getOWL(url, callback) {
	https.get(url, res => {
		res.setEncoding("utf8");
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

// intent functions

function nextMatch(response) {
	if (response == '') {
		console.log("Error, response was empty.");
	} else {
		// get the schedule
		let schedule = response["schedule"];
		let stTimes = [];
		for (var i in schedule) {
			// get the match and process information
			//console.log(schedule[i]);
			const match = schedule[i];
			const matchid = match['id'];
			const st = match['startDate'];
			const et = match['endDate'];
			const stDate = getCalendarMatchDate(st);
			const etDate = getCalendarMatchDate(et);
			stTimes.push(st);
		}
		const now = Date.now();
		//sort stTimes to compare to todays date.
		stTimes = stTimes.sort();

		const len = stTimes.length;
		let iter = 0;
		let j = 0;
		while (iter < len) {
			if (stTimes[iter] < now) {
				j=j+1
			}
			iter = iter+1
		}
		stTimes = stTimes.slice(9);

		stNextMatch = stTimes[0];
		calNextMatch = getCalendarMatchDate(stNextMatch);
		console.log(responseStr + calNextMatch);
		console.log();
	}
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
'use strict';
//////////////////////////////////////////////////////////////////////////////
// Imports and other Constants
//////////////////////////////////////////////////////////////////////////////

// Import the new vs ask-sdk module 
const Alexa = require('ask-sdk-core');
const https = require("https");
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

// Imports the file with all the messages
const languageStrings = require('./languageStrings').languageStrings;
const appResources = require('./resources');

const KEYS = appResources.API_KEYS;
const AUDIO = appResources.AUDIO;
const TEAMS = appResources.TEAMS;
const OWL = appResources.OWL;;

const APP_ID = KEYS.APP_ID; //I dont think I need this anymore, it was done away with in v2...
const GOOG_API = KEYS.GOOG_API;

//////////////////////////////////////////////////////////////////////////////
// Handlers
//////////////////////////////////////////////////////////////////////////////

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        //Figure out which intent I am in...
        console.log("In LaunchRequestHandler");

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // TODO: Continue to implement and get LaunchRequest to work

        const speechOutput = requestAttributes.t('WELCOME_MSG', requestAttributes.t(getRandomEntry(TEAMS)));
        const entry = requestAttributes.t(getRandomEntry(Object.keys(AUDIO.greetings)));
        const ssmlSpeech = `<audio src=\"${AUDIO.greetings[entry]}\"/> ${speechOutput} And, remember, <audio src=\"${AUDIO.moreHeros}\" />`;
        const repromptOutput = requestAttributes.t('WELCOME_REPROMPT', requestAttributes.t(getRandomEntry(TEAMS)));

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(ssmlSpeech)
            .reprompt(repromptOutput)
            .getResponse();
    },
};

// GetNextTeamMatchHandler gets the next match for a specific team
const GetNextTeamMatchHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetNextTeamMatchIntent';
    },
    handle(handlerInput) {
        console.log("In GetNextTeamMatchHandler");
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        console.log("handlerInput is: " + JSON.stringify(handlerInput));

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information.
        // 1. Get timezone from zipcode
        // 2. determine and save offset from timezone
        // 3. Get the requested team information
        // 4. Parse team response for next match
        requestAttributes.owlCallback = [getNextTeamMatch,
            getTeamById,
        ];

        const callback = requestAttributes.owlCallback.pop();
        callback(handlerInput);

        return handlerInput.responseBuilder
            .speak(handlerInput)
            .getResponse();
    },
};

// GetNextMatchHandler is the general case to get whatever match is next
const GetNextMatchHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetNextMatchIntent';
    },
    handle(handlerInput) {
        console.log("In GetNextMatchHandler");

        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information
        // 1. Get timezone from zipcode
        // 2. determine and save offset from timezone
        // 3. Get rankings
        // 4. determine stage from rankings save stage
        // 5. Get schedule
        // 6. Parse the scheudle and get the match
        handlerInput.attributes.owlCallback = [getNextMatch,
            getSchedule,
            getStage,
            getRankings,
            offsetFromTimezone,
            getTimezoneFromZipLatLon];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetTodaysMatchesHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetTodaysMatchesIntent';
    },
    handle(handlerInput) {
        console.log("In GetTodaysMatchesHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information
        // 1. Get timezone from zipcode
        // 2. determine and save offset from timezone
        // 3. Get rankings
        // 4. determine stage from rankings save stage
        // 5. Get schedule
        // 6. Parse the scheudle and get tonights matches from users time.
        handlerInput.attributes.owlCallback = [getTodaysMatches,
            getSchedule,
            getStage,
            getRankings,
            offsetFromTimezone,
            getTimezoneFromZipLatLon];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetYesterdaysResultsHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetYesterdaysResultsIntent';
    },
    handle(handlerInput) {
        console.log("In GetYesterdaysResultsHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information
        // 1. Get timezone from zipcode
        // 2. determine and save offset from timezone
        // 3. Get rankings
        // 4. determine stage from rankings save stage
        // 5. Get schedule
        // 6. Parse the scheudle and get what happend yesterday.
        handlerInput.attributes.owlCallback = [getYesterdaysResults,
            getSchedule,
            getStage,
            getRankings,
            offsetFromTimezone,
            getTimezoneFromZipLatLon];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetTomorrowsMatchesHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetTomorrowsMatchesIntent';
    },
    handle(handlerInput) {
        console.log("In GetTomorrowsMatchesHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information
        // 1. Get timezone from zipcode
        // 2. determine and save offset from timezone
        // 3. Get rankings
        // 4. determine stage from rankings save stage
        // 5. Get schedule
        // 6. Parse the scheudle and get what is happening tomorrow.
        handlerInput.attributes.owlCallback = [getTomorrowsMatches,
            getSchedule,
            getStage,
            getRankings,
            offsetFromTimezone,
            getTimezoneFromZipLatLon];
        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetTeamRecordHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetTeamRecordIntent';
    },
    handle(handlerInput) {
        console.log("In GetTeamRecordHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        handlerInput.attributes.owlCallback = [getTeamRecord,
            getTeamById];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetStandingsHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetStandingsIntent';
    },
    handle(handlerInput) {
        console.log("In GetStandingsHandler");
        handlerInput.attributes.owlCallback = [getTeamStandings,
            getRankings];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

const GetTopTeamHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetTopTeamIntent';
    },
    handle(handlerInput) {
        console.log("In GetTopTeamHandler");

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        requestAttributes.owlCallback = [getTopTeam,
            getRankings];

        const callback = requestAttributes.owlCallback.pop();
        callback(handlerInput.attributesManager);

        return handlerInput.responseBuilder
            .speak(sessionAttributes.speakOutput)
            .getResponse();
    },
};

const GetCurrentStageHandler = {
    canHandle(handlerInput) {

        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'GetCurrentStageIntent';
    },
    handle(handlerInput) {
        console.log("In GetCurrentStageHandler");

        // the owlCallback attribute is a stack of functions used to traverse api's
        // in order to collect the required information
        // 1. Get rankings
        // 2. detremine stage from rankings and emit
        handlerInput.attributes.owlCallback = [getStage, getRankings];

        const callback = handlerInput.attributes.owlCallback.pop();
        callback(handlerInput);
    },
};

// Help the User make informed decisions of how to use the skill
const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        console.log("In HelpHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder
            .speak(requestAttributes.t('HELP_MSG'))
            .reprompt(requestAttributes.t('HELP_MSG'))
            .getResponse();
    },
};

// When the User says stop, quit or cancel (No means no, Alexa!)
const StopHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.NoIntent'
                || request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        console.log("In StopHandler");
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();
        return responseBuilder.speak(requestAttributes.t('STOP_MSG')).getResponse();
    },
};


const FallbackHandler = {
    // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.
    // This handler will not be triggered except in that locale, so it can be
    // safely deployed for any locale.
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(FALLBACK_MESSAGE)
            .reprompt(FALLBACK_REPROMPT)
            .getResponse();
    },
};

// ErrorHandler is the bringer of bad news, but we don't kill the messenger
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        const speechOutput = 'an error occurred.';
        const errorSpeech = `<audio src=\"${AUDIO.errorSounds['mei']}\"/> ${speechOutput}`;

        return handlerInput.responseBuilder
            .speak(errorSpeech)
            .getResponse();
    },
};

// Handler for when the user closes the skill
const SessionEndedHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

//////////////////////////////////////////////////////////////////////////////
// Intent implementation functions
//////////////////////////////////////////////////////////////////////////////

function getTeamRecord(response, handlerInput) {
    if (response == '') {
        // something went wrong, OWL API returned nothing. TODO: improve this if necessary
        console.log("Error, response was empty.");
        OWLErr(handlerInput);
    } else {
        const team = handlerInput.attributes.team;
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
        handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        handlerInput.response.speak(speechOutput);
        handlerInput.emit(':responseReady');

    }
}

function getTopTeam(response, handlerInput) {
    console.log("In getTopTeam function");
    if (response == '') {
        // something went wrong, OWL API returned nothing. TODO: improve this if necessary
        console.log("Error, response was empty.");
        OWLErr(handlerInput);
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

        //Print out what speechOutput is sending out
        console.log("Speech Output %s", speechOutput);
        // Sesstion attributes has speechOutput in it I believe?
        sessionAttributes.speakOutput = speechOutput;

        // New responses
        // return handlerInput.responseBuilder
        //     .speak(speechOutput)
        //     .withStandardCard(cardTitle, cardContent, cardImg.smallImageUrl, cardImg.largeImageUrl)
        //     .getResponse();

        // emit response
        // handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        // handlerInput.response.speak(speechOutput);
        // handlerInput.emit(':responseReady');
    }
}

function getTeamStandings(response, handlerInput) {
    if (response == '') {
        // something went wrong, OWL API returned nothing. TODO: improve this if necessary
        console.log("Error, response was empty.");
        OWLErr(handlerInput);
    } else {
        let speechOutput = "";
        const rankings = response.content;
        const numberSlot = handlerInput.event.request.intent.slots["AMAZON.NUMBER"];
        const fullSlot = handlerInput.event.request.intent.slots.Standings;
        let numTeams = 0;

        if (numberSlot && numberSlot.value) {
            numTeams = numberSlot.value;
            // need to handle people with a sense of humor....
            if (numTeams == 0) {
                speechOutput = `${speechOutput}I am sorry, but asking for the top zero teams is a little silly, don\'t you think? Is there something else you would like to know?`;
                handlerInput.response.speak(speechOutput).listen(handlerInput.t('SIMPLE_REPROMPT'));
                handlerInput.emit(':responseReady');
            }
            if (numTeams < 0) {
                speechOutput = `${speechOutput}Even I know that makes no sense. You need to ask for a positive number. Is there something else you would like to know?`;
                handlerInput.response.speak(speechOutput).listen(handlerInput.t('SIMPLE_REPROMPT'));
                handlerInput.emit(':responseReady');
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
            if (i != numTeams - 1 || numTeams == 1) {
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
        handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        handlerInput.response.speak(speechOutput);
        handlerInput.emit(':responseReady');
    }
}

function getYesterdaysResults(response, handlerInput) {
    // TODO: probably should check if resposne comes back with something like we did in other function like getNextTeamMatch

    // Get what we need saved in event attributes we had picked up along the way
    let rawOffset = handlerInput.attributes.rawOffset;
    let stageIdx = handlerInput.attributes.stage;

    const stages = response.data.stages;
    let matches = stages[stageIdx].matches;

    // sort the matches
    matches = matches.sort(compareTimesTS);

    const now = Date.now();

    // quickly cycle through matches until run into yesterday morning
    const nowCal = new Date(now + rawOffset * 1000);
    const y = nowCal.getFullYear();
    const m = nowCal.getMonth();
    const d = nowCal.getDate();

    const morningToday = new Date(y, m, d, 0, 0, 0);
    const morningTodaySec = morningToday.getTime();
    const morningYesterdaySec = morningTodaySec - 24 * 3600 * 1000;

    while (matches[0].startDateTS + rawOffset * 1000 < morningYesterdaySec) {
        matches.shift();
    }

    // check relative today if there matches was yesterday
    let yesterdaysMatches = [];
    let calTime = {};
    do {
        const match = matches[0];
        calTime = getCalendarMatchDate(match.startDateTS, now, rawOffset * 1000);
        if (calTime.wasYesterday) {
            yesterdaysMatches.push(match);
        }
        matches.shift();
    } while (calTime.wasYesterday)

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
        handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        handlerInput.response.speak(speechOutput);
        handlerInput.emit(':responseReady');
    }

    speechOutput = `In yesterday's ${yesterdaysMatches.length == 1 ? 'game' : 'games'}`;
    for (let i = 0; i < yesterdaysMatches.length; i++) {
        const match = yesterdaysMatches[i];
        const team1 = match.competitors[0];
        const team2 = match.competitors[1];
        const winner = match.winner.name; // there will always be a winner. Map 5 is king of the hill.
        const loser = (team1.name == winner ? team2.name : team1.name);
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
        } else if (i != yesterdaysMatches.length - 1) {
            speechOutput = `${speechOutput} Then, ${resultStr}.`;
            cardContent = `${cardContent}\n`;
        } else {
            speechOutput = `${speechOutput} And, ${resultStr}.`;
        }
    }

    // configure alexa
    handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
    handlerInput.response.speak(speechOutput);
    handlerInput.emit(':responseReady');
}

function getTodaysMatches(response, handlerInput) {
    // get what we need saved in event attributes we had picked up along the way
    let rawOffset = handlerInput.attributes.rawOffset;
    let stageIdx = handlerInput.attributes.stage;

    const stages = response.data.stages;
    let matches = stages[stageIdx].matches;

    // sort the matches
    matches = matches.sort(compareTimesTS);

    // get the current time
    let now = Date.now();
    let liveMatch = {}; //technically, there could be a game happening right now.
    while (matches[0].startDateTS < now) {
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
        calTime = getCalendarMatchDate(nextMatch.startDateTS, now, rawOffset * 1000);
        if (calTime.isToday) {
            todaysMatches.push(nextMatch);
        }
        matches.shift();
    } while (calTime.isToday)

    // should have all of today's matches, if any. Start building speech output.
    let speechOutput = "";
    const cardTitle = "Today's Matches";
    let cardContent = "";
    const cardImg = {
        smallImageUrl: OWL.LOGO,
        largeImageUrl: OWL.LOGO
    };

    if (!liveMatch.id && !todaysMatches.length) {
        speechOutput = "There are no scheduled Overwatch League games today.";
        cardContent = speechOutput;

        // configure alexa
        handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        handlerInput.response.speak(speechOutput);
        handlerInput.emit(':responseReady');
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
            if (scores[0].value > scores[1].value) {
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
        for (let i = 0; i < todaysMatches.length; i++) {
            const match = todaysMatches[i];
            const team1 = match.competitors[0];
            const team2 = match.competitors[1];
            const matchTime = getCalendarMatchDate(match.startDateTS, now, rawOffset * 1000);

            todaysMatchesContent = `${todaysMatchesContent} ${team1.name} vs. ${team2.name} at ${matchTime.clkStr}`;
            if (i != todaysMatches.length - 1) {
                todaysMatchesContent = `${todaysMatchesContent}.\n`;
            } else {
                todaysMatchesContent = `${todaysMatchesContent}.`;
            }
        }
    } else {
        todaysMatchesContent = `There are no${liveMatch.id ? ' other ' : ' '}scheduled games today.`;
    }

    speechOutput = `${liveMatchContent}${todaysMatchesContent}`;
    cardContent = `${liveMatchContent}${todaysMatchesContent}`;

    // emit response
    handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
    handlerInput.response.speak(speechOutput);
    handlerInput.emit(':responseReady');
}

function getTomorrowsMatches(response, handlerInput) {
    // TODO: probably should check if resposne comes back with something like we did in other function like getNextTeamMatch

    // Get what we need saved in event attributes we had picked up along the way
    let rawOffset = handlerInput.attributes.rawOffset;
    let stageIdx = handlerInput.attributes.stage;

    const stages = response.data.stages;
    let matches = stages[stageIdx].matches;

    // sort the matches
    matches = matches.sort(compareTimesTS);

    const now = Date.now();

    // quickly cycle through matches until run into yesterday morning
    const nowCal = new Date(now + rawOffset * 1000);
    const y = nowCal.getFullYear();
    const m = nowCal.getMonth();
    const d = nowCal.getDate();

    const midnightToday = new Date(y, m, d, 23, 59, 59, 999);
    const midnightTodaySec = midnightToday.getTime();

    while (matches[0].startDateTS + rawOffset * 1000 < midnightTodaySec) {
        matches.shift();
    }

    // check relative today if there matches was yesterday
    let tomorrowsMatches = [];
    let calTime = {};
    do {
        const match = matches[0];
        calTime = getCalendarMatchDate(match.startDateTS, now, rawOffset * 1000);
        console.log(calTime)
        if (calTime.isTomorrow) {
            tomorrowsMatches.push(match);
        }
        matches.shift();
    } while (calTime.isTomorrow)

    // Now have the yesterdays matches, so we can parse the information
    // initialize response content
    let speechOutput = "";
    const cardTitle = "Tomorrow's Games";
    let cardContent = "";
    const cardImg = {
        smallImageUrl: OWL.LOGO,
        largeImageUrl: OWL.LOGO
    };

    // no games were played yesterday. TODO: possibility when states are included to go back and fetch last results or when the next games will be.
    if (tomorrowsMatches.length == 0) {
        speechOutput = "There are no games scheduled tomorrow.";
        cardContent = speechOutput;
        // configure alexa
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withStandardCard(cardTitle, cardContent, cardImg.smallImageUrl, cardImg.largeImageUrl)
            .getResponse();
    }

    speechOutput = `Tomorrow`;
    for (let i = 0; i < tomorrowsMatches.length; i++) {
        const match = tomorrowsMatches[i];
        const team1 = match.competitors[0];
        const team2 = match.competitors[1];
        calTime = getCalendarMatchDate(match.startDateTS, now, rawOffset * 1000);

        const resultStr = `the ${team1.name} will play the ${team2.name} at ${calTime.clkStr}`;
        cardContent = `${cardContent}${team1.name} vs. ${team2.name} @ ${calTime.clkStr}`;
        // control flow to build a sentence.
        if (i == 0) {
            speechOutput = `${speechOutput} ${resultStr}.`;
            cardContent = `${cardContent}\n`;
        } else if (i != tomorrowsMatches.length - 1) {
            speechOutput = `${speechOutput} Then, ${resultStr}.`;
            cardContent = `${cardContent}\n`;
        } else {
            speechOutput = `${speechOutput} And, ${resultStr}.`;
        }
    }
    // configure alexa
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .withStandardCard(cardTitle, cardContent, cardImg.smallImageUrl, cardImg.largeImageUrl)
        .getResponse();
}

function getNextTeamMatch(response, handlerInput) {
    if (response == '') {
        // something went wrong, OWL API returned nothing. TODO: improve this if necessary
        console.log("Error, response was empty.");
        OWLErr(handlerInput);
    } else {
        console.log("I MADE IT TO THE GETNEXTTEAMMATCH FUNCTION!!!!")
        console.log(handlerInput);
        // set variables we saved in the Alexa event attributes to use
        let team = handlerInput.attributes.team;
        let rawOffset = handlerInput.attributes.rawOffset;

        // try to sort the dictionary
        let teamId = response.id;

        // get the matches as an array from the schedule entry
        let matches = response.schedule;

        //sort the matches
        matches = matches.sort(compareTimes);

        //compare for next start time
        let now = Date.now()
        let liveMatch = {}; //techincally, they could be playing right now.
        while (matches[0].startDate < now) {
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

            const isTeam1 = (team1.id === teamId ? 1 : 0);
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
        const calTime = getCalendarMatchDate(nextMatch.startDate, now, rawOffset * 1000);

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

        //Print out what speechOutput is sending out
        console.log("Speech Output %s", speechOutput);
        // Sesstion attributes has speechOutput in it I believe?
        sessionAttributes.speakOutput = speechOutput;
    }
}

// Get ANY next OWL match expects response coming from getStage/getSchedule
function getNextMatch(response, handlerInput) {
    // get what we need saved in event attributes we had picked up along the way.
    let rawOffset = handlerInput.attributes.rawOffset;
    let stageIdx = handlerInput.attributes.stage; //preason=0, regular season=1-4, playoffs=5, finals=6, all-star=7.

    // there is not an alexa slot needed for this intent so we just get to start to parse the api response and build the speechOutput
    const stages = response.data.stages;
    let matches = stages[stageIdx].matches;

    // sort the matches
    matches = matches.sort(compareTimesTS);

    // compare for next start time
    let now = Date.now();
    let liveMatch = {}; //techincally, there could be a game happening right now.
    while (matches[0].startDateTS < now) {
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
            if (scores[0].value > scores[1].value) {
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

    const calTime = getCalendarMatchDate(nextMatch.startDateTS, now, rawOffset * 1000);
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
    handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
    handlerInput.response.speak(speechOutput);
    handlerInput.emit(':responseReady');
}

// Expects ranking information as the response to determine current stage. 
// TODO: Will break after regular season? (i.e. needs to handle playoffs.)
function getStage(response, handlerInput) {
    if (response == '') {
        // something went wrong, OWL API returned nothing.
        // TODO: improve this if necessary
        console.log("Error, response was empty.");
        OWLErr(handlerInput);
    } else {

        const played = response.matchesConcluded;
        const matchesPerStage = 60;

        // need to handle playoffs.
        handlerInput.attributes.stage = Math.floor(played / matchesPerStage) + 1; //idx representing stage in stages array returned from /schedule endpoint. preason=0, regular season=1-4, playoffs=5, finals=6, all-star=7.
    }

    const callback = handlerInput.attributes.owlCallback.pop();
    if (callback != null) {
        const options = null;
        apiCall(options, callback, OWLErr, handlerInput);
    } else {
        // TODO: improve alexa response if we want to.
        // prepare speech output
        const speechOutput = `Overwatch league is currently in stage ${handlerInput.attributes.stage}.`;

        // prepare card
        const cardTitle = "Current Stage";
        const cardContent = `${speechOutput}`;
        const cardImg = {
            smallImageUrl: OWL.LOGO,
            largeImageUrl: OWL.LOGO
        };

        // configure alexa
        handlerInput.response.cardRenderer(cardTitle, cardContent, cardImg);
        handlerInput.response.speak(speechOutput);
        handlerInput.emit(':responseReady');
    }
}

function closeWithSSMLAudio(handlerInput) {
    const ssmlSpeech = `Goodbye! And don't forget, <audio src=\"${AUDIO.moreHeros}\" />`;
    handlerInput.response.speak(ssmlSpeech);
    handlerInput.emit(':responseReady');
}

function closeWithSpeech(handlerInput) {
    handlerInput.emit(':tell', handlerInput.t('SHUTDOWN_MSG'));
}

function requestPermissions(handlerInput) {
    const permissionsWelcome = handlerInput.t('PERMISSIONS_WELCOME');
    const permissionsPrompt = handlerInput.t('PERMISSIONS_PROMPT');

    const speechOutput = `${permissionsWelcome} ${permissionsPrompt}`;

    const permissions = ["read::alexa:device:all:address:country_and_postal_code"];
    handlerInput.response.askForPermissionsConsentCard(permissions);

    handlerInput.response.speak(speechOutput);

    handlerInput.emit(':responseReady');
}

function OWLErr(handlerInput) {
    //TODO: Change these things I think?
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    // handlerInput.response.speak(handlerInput.t('OWL_API_ERR_MSG'));
    // handlerInput.emit(':responseReady');
}

function googleErr(handlerInput) {
    handlerInput.response.speak(handlerInput.t('GOOG_API_ERR_MSG'));
    handlerInput.emit(':responseReady');
}

///////////////////////////////////////////////////////////////////////////////
// Accessing OWL and Google APIs
///////////////////////////////////////////////////////////////////////////////

// Generic method to handle any api call. In OWL the callbacks are stack of functions to trace
// connecting to different APIs if necessary to gather all information. To have a funciton in
// the stack that doesn't require a connection (i.e., when getting any next match and we get
// stage information from rankings set options to null to pass through).
function apiCall(options, callback, error, handlerInput) {
    if (options == null) {
        callback(handlerInput);
    } else {
        https.get(options, res => {
            res.setEncoding("utf8");

            // don't have permissio for the api
            if (res.statusCode >= 400) {
                return error(handlerInput);
            }

            let body = "";
            res.on("data", data => {
                body += data;
            });
            res.on("end", () => {
                body = JSON.parse(body);
                return callback(body, handlerInput);
            });
        });
    }
}

// Get team information
function getTeamById(handlerInput) {
    // 	After all that callback we can now finally work with OWL.
    console.log("Made it to getTeamById (error is in here...)");
    //TODO: Figure out how to get handlerInput defined in here...Maybe pass that in instead of handlerInput (whatever handlerInput is?).
    const teamSlot = handlerInput.requestEnvelope.request.intent.slots.Team;

    let resolutions = {};
    let team = "";
    let id;

    if (teamSlot && teamSlot.resolutions) {
        //TODO: check if length greater than one. We could be introuble
        resolutions = teamSlot.resolutions.resolutionsPerAuthority[0];

        if (resolutions.status.code == "ER_SUCCESS_MATCH") {
            const resolutionValues = resolutions.values[0];
            team = resolutionValues.value.name;
            id = resolutionValues.value.id;
        } else {
            // ow error no match. TODO: Look into if this error needs to be differnet and more helpful to the user.
            // handlerInput.response.speak(handlerInput.t('INVALID_TEAM_MSG', teamSlot.value)).listen(handlerInput.t('TEAM_REPROMPT'));
            // handlerInput.emit(':responseReady');
            const speechOutput = requestAttributes.t('INVALID_TEAM_MSG', teamSlot.value);
            const repromptSpeechOutput = requestAttributes.t('TEAM_REPROMPT');
    
            // Lets see if it is the response model?
            handlerInput.responseBuilder.speak(speechOutput).reprompt(repromptSpeechOutput).getResponse();
        }

    } else {
        //ow user spoke nothing with a synonym. TODO: Look into if this error needs to be differnet and more helpful to the user.
        // handlerInput.response.speak(handlerInput.t('INVALID_TEAM_MSG', team)).listen(handlerInput.t('TEAM_REPROMPT'));
        // handlerInput.emit(':responseReady');
        const speechOutput = requestAttributes.t('INVALID_TEAM_MSG', team);
        const repromptSpeechOutput = requestAttributes.t('TEAM_REPROMPT');

        // Lets see if it is the response model?
        handlerInput.responseBuilder.speak(speechOutput).reprompt(repromptSpeechOutput).getResponse();
    }

    //TODO: not sure team is needed any more??? Because much like id we just pull it out of the response. If anything this represents the saved "spoken" team value from Alexa
    // ------I want to say the error is here!----
    // handlerInput.attributes.team = team;
    handlerInput.responseBuilder = team;

    const path = `/teams/${id}`;
    let options = {
        host: OWL.API,
        path: path,
        method: 'GET',
        port: 443
    };

    const callback = handlerInput.attributes.owlCallback.pop();
    apiCall(options, callback, OWLErr, handlerInput);
}

// Get all ranking information
function getRankings(self) {
    console.log("In getRankings function");
    let options = {
        host: OWL.API,
        path: `/ranking`,
        method: 'GET',
        port: 443
    };

    console.log(self);
    // I took off pop because it said it was not defined... with it off it says callback is not a function...
    const callback = self.owlCallback;
    apiCall(options, callback, OWLErr, self);
}

// Get full match schedule
function getSchedule(handlerInput) {
    let options = {
        host: OWL.API,
        path: `/schedule`,
        method: 'GET',
        port: 443
    };

    const callback = handlerInput.attributes.owlCallback.pop();
    apiCall(options, callback, OWLErr, handlerInput);
}

// Get timezone, launches getLatLon and getTimezone
function getTimezoneFromZipLatLon(handlerInput) {
    const deviceId = handlerInput.event.context.System.device.deviceId;
    const token = handlerInput.event.context.System.apiAccessToken;

    let options = {
        host: 'api.amazonalexa.com',
        path: `/v1/devices/${deviceId}/settings/address/countryAndPostalCode`,
        headers: { Authorization: `Bearer ${token}` },
        method: 'GET',
        port: 443
    };

    apiCall(options, getLatLon, requestPermissions, handlerInput);
}

function getLatLon(response, handlerInput) {
    let countryCode = "";
    let postalCode = "";
    if (response.countryCode && response.postalCode) {
        countryCode = response.countryCode;
        postalCode = response.postalCode;
    } else {
        //TODO: Maybe generate a better error response
        googleErr(handlerInput);
    }

    const latLonOptions = {
        host: 'maps.googleapis.com',
        path: `/maps/api/geocode/json?address=${countryCode},${postalCode}&key=${GOOG_API}`,
        method: 'GET'
    };

    apiCall(latLonOptions, getTimezone, googleErr, handlerInput);
}

function getTimezone(response, handlerInput) {
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
        googleErr(handlerInput);
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const gmapstzOptions = {
        host: 'maps.googleapis.com',
        path: `/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${GOOG_API}`,
        method: 'GET'
    };

    const callback = handlerInput.attributes.owlCallback.pop();
    apiCall(gmapstzOptions, callback, googleErr, handlerInput);
}

function offsetFromTimezone(response, handlerInput) {
    let timezone = "";
    let rawOffset = "";
    if (response.timeZoneId && response.rawOffset) {
        timezone = response.timeZoneId;
        rawOffset = response.rawOffset;
    } else {
        googleErr(handlerInput);
    }

    handlerInput.attributes.rawOffset = rawOffset;

    const callback = handlerInput.attributes.owlCallback.pop();
    callback(handlerInput);
}

// TODO: See if this stuff can work later instead of google way.
// Get timezone, launches getLatLon and getTimezone
// function getTimezone(handlerInput) {
//     const deviceId = handlerInput.event.context.System.device.deviceId;
//     const accessToken = handlerInput.event.context.System.apiAccessToken

//     let options = {
//         host: 'api.amazonalexa.com',
//         path: `/v2/devices/${deviceId}/settings/System.timeZone`,
//         headers: { Authorization: `Bearer ${accessToken}` },
//         method: 'GET',
//         port: 443
//     };

//     apiCall(options, requestPermissions, handlerInput);
// }

// function offsetFromTimezone(timezone, handlerInput) {
// 	let rawOffset = "";
// 	if (response.timeZoneId && response.rawOffset) {
// 		timezone = response.timeZoneId;
// 		rawOffset = response.rawOffset;
// 	} else {
// 		googleErr(handlerInput);
// 	}

// 	handlerInput.attributes.rawOffset = rawOffset;

// 	const callback = handlerInput.attributes.owlCallback.pop();
// callback(handlerInput);
// }

////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////
function compareTimes(a, b) {
    if (a.startDate < b.startDate) {
        return -1;
    }
    if (a.startDate > b.startDate) {
        return 1;
    }
    return 0;
}

function compareTimesTS(a, b) {
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

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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

    let now = new Date(nowSeconds + rawOffset);
    y = now.getFullYear();
    m = now.getMonth();
    d = now.getDate();
    const dow2 = now.getDay();

    // check if the game is today
    let morningNow = new Date(y, m, d, 0, 0, 0, 0);
    morningNow = morningNow.getTime();

    let midnightNow = new Date(y, m, d, 23, 59, 59, 999);
    midnightNow = midnightNow.getTime();

    const morningYesterday = morningNow - (24 * 3600 * 1000);
    const midnightTomorrow = midnightNow + (24 * 3600 * 1000);

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
    const idx = Math.floor(Math.random() * list.length);
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

//////////////////////////////////////////////////////////////////////////////
// Export LAMBDA SETUP
//////////////////////////////////////////////////////////////////////////////

const skillBuilder = Alexa.SkillBuilders.custom();

const LocalizationInterceptor = {
    process(handlerInput) {
        const localizationClient = i18n.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = function (...args) {
            return localizationClient.t(...args);
        };
    },
};

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        GetNextTeamMatchHandler,
        GetNextMatchHandler,
        GetTodaysMatchesHandler,
        GetYesterdaysResultsHandler,
        GetTomorrowsMatchesHandler,
        GetTeamRecordHandler,
        GetStandingsHandler,
        GetTopTeamHandler,
        GetCurrentStageHandler,
        HelpHandler,
        StopHandler,
        FallbackHandler,
        ErrorHandler,
        SessionEndedHandler
    )
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(LocalizationInterceptor)
    .lambda();

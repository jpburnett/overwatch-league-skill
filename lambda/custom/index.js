'use strict';
//////////////////////////////////////////////////////////////////////////////
// Imports and other Constants
//////////////////////////////////////////////////////////////////////////////

// Import the standard SDK module 
const Alexa = require('alexa-sdk');
const https = require("https");
// Imports the file with all the messages
const languageStrings = require('./lambda/custom/languageStrings').languageStrings;
const appResources = require('./resources');

const KEYS = appResources.API_KEYS;
const AUDIO = appResources.AUDIO;
const TEAMS = appResources.TEAMS;
const OWL = appResources.OWL;;

const APP_ID = KEYS.APP_ID;
const GOOG_API = KEYS.GOOG_API;

//////////////////////////////////////////////////////////////////////////////
// Handlers
//////////////////////////////////////////////////////////////////////////////

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        // const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        const speechOutput = this.t('WELCOME_MSG', getRandomEntry(TEAMS));
		const entry = getRandomEntry(Object.keys(AUDIO.greetings));
        const ssmlSpeech = `<audio src=\"${AUDIO.greetings[entry]}\"/> ${speechOutput} And, remember, <audio src=\"${AUDIO.moreHeros}\" />`; // can embbed the speech in the ssml since it is a short clip.
        const repromptOutput = this.t('WELCOME_REPROMPT', getRandomEntry(TEAMS));

        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(ssmlSpeech)
            .reprompt(repromptOutput)
            .getResponse();
    },
};



// Help the User make informed decisions of how to use the skill
const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
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

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Sorry, an error occurred.')
            .reprompt('Sorry, an error occurred.')
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
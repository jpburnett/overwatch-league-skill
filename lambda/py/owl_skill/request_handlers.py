
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_core.utils import is_request_type, is_intent_name

from ask_sdk_model.ui import StandardCard, SimpleCard
from ask_sdk_model.ui.image import Image
from ask_sdk_model.response import Response
from ask_sdk_model.slu.entityresolution import StatusCode

# Data contains all the skill speech phrases
from utils import data

# import resources for the audio lines
from utils import resources as resource

# import OWL API Request interface
from owl_model.apirequest import APIRequest
from owl_skill.helpers import *

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# =====================================================================
# Request Handlers
# =====================================================================
class LaunchRequestHandler(AbstractRequestHandler):
    """Handler for Skill Launch."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In LaunchRequestHandler")

        # Random entry for the greetings
        greeting = getRandomEntry(list(resource.AUDIO['greetings'].values()))

        speechOut = data.WELCOME_MESSAGE

        ssmlSpeech = '<audio src=\"' + greeting + '\"/> ' + speechOut

        handler_input.response_builder.speak(ssmlSpeech).set_card(
            SimpleCard(data.SKILL_NAME, "Overwatch League")).ask(data.WELCOME_REPROMPT)
        return handler_input.response_builder.response


class GetNextMatchIntent(AbstractRequestHandler):
    """Handler for getting the next match."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetNextMatchIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In GetNextMatchIntent")

        # Get user timezone
        usertz = getUserTimezone(handler_input.request_envelope)
        if usertz is None:
            handler_input = requestPermission(handler_input)
            return handler_input.response_builder.response

        # Get OWL schedule
        schedule = APIRequest.schedule()

        curWeek = getCurrentWeek(schedule)
        nextMatch = getNextMatch(curWeek)
        matchTime = nextMatch.startdate.astimezone(usertz)

        team1 = nextMatch.teams[0]
        team2 = nextMatch.teams[1]

        # TODO: old version implemented a check for live games here. It is
        # probably a good idea to check for a live game (the user may be
        # interested to know) but the TODO is to consider if here is the best
        # place to do that.
        liveMatchContent = ""

        # Prepare speech output
        nextMatchContent = "The next match will be"
        if isToday(matchTime):
            nextMatchContent = "{} today at {}.".format(nextMatchContent,
                                                        matchTime.strftime(clkfrmt.clkstr))
        elif isTomorrow(matchTime):
            nextMatchContent = "{} tomorrow at {}.".format(nextMatchContent,
                                                           matchTime.strftime(clkfrmt.clkstr))
        else:
            nextMatchContent = "{} on {}.".format(nextMatchContent,
                                                  matchTime.strftime(clkfrmt.datetimestr))

        nextMatchContent = "{} The {} will {} the {}.".format(nextMatchContent,team1.name,getRandomEntry(vs),team2.name)

        speechOutput = "{}{}".format(liveMatchContent, nextMatchContent)

        # Setup card
        title = "Match Details"
        img = Image(
            small_image_url=resource.OWL['LOGO'], large_image_url=resource.OWL['LOGO'])
        content = speechOutput

        handler_input.response_builder.speak(speechOutput) \
            .set_card(StandardCard(title, content, img)) \
            .set_should_end_session(True)

        return handler_input.response_builder.response


class GetNextTeamMatchIntent(AbstractRequestHandler):
    """Handler for getting the next team match."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetNextTeamMatchIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetNextTeamMatchIntent")

        # Get user timezone
        usertz = getUserTimezone(handler_input.request_envelope)
        if usertz is None:
            handler_input = requestPermission(handler_input)
            return handler_input.response_builder.response

        slots = handler_input.request_envelope.request.intent.slots
        id = ''
        if 'Team' in slots:
            teamSlot = slots['Team']
            resolution = teamSlot.resolutions.resolutions_per_authority[0]
            if resolution.status.code == StatusCode.ER_SUCCESS_MATCH:
                resolutionValues = resolution.values[0]
                teamName = resolutionValues.value.name
                id = resolutionValues.value.id
            else:
                print("ERRRORRRR")
                # TODO: Figure out error handling
        else:
            print("ANOTHER ERROR.....No team slots")
            # TODO: continue implementing

        print(id)
        team = APIRequest.teamfromid(id)  # Get the teams endpoint
        schedule = team.schedule  # Schedule is a list of matches

        firstMatch = schedule[0]

        firstMatchState = firstMatch.state  # get the match state
        print(firstMatchState)

        liveMatchContent = ""

        nextTeamMatchIntro = "The next {} match will be".format(teamName)

        # Now that I got this working...
        # TODO: Finish writing the logic for if a state is not concluded, that is
        # when the next game should be...this could be bad logic, but hey, it works
        for match in schedule:
            if match.state == "PENDING":
                matchTime = match.startdate
                print(matchTime)
                nextTeamMatchContent = "{} on {}".format(
                    nextTeamMatchIntro, matchTime.strftime(clkfrmt.datetimestr))
                break
            else:
                noUpcomingMatch = "No new matches"

        speechOutput = nextTeamMatchContent
        # speechOutput = "{}{}".format(liveMatchContent, nextMatchContent)

        handler_input.response_builder.speak(speechOutput).set_card(
            SimpleCard("Next Team Match", speechOutput)).set_should_end_session(True)
        return handler_input.response_builder.response


class GetCurrentStageIntent(AbstractRequestHandler):
    """Handler for getting the current stage."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetCurrentStageIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In GetCurrentStageIntent")

        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
        return handler_input.response_builder.response


class GetStandingsIntent(AbstractRequestHandler):
    """Handler for getting the standings of the OWL."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetStandingsIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In GetStandingsIntent")

         # determine the number of teams to report on
        slots = handler_input.request_envelope.request.intent.slots
        if 'AMAZON.NUMBER' in slots:
            numTeams = int(slots['AMAZON.NUMBER'].value)

        elif 'Standings' in slots:
            numTeams = int(slots['Standings'].value)
        else:
            # default to the top three teams
            numTeams = 3

        speechOutput = ''
        rankings = APIRequest.rankings()

        if rankings.ranks is None:
            print("Error, response was empty")
            # TODO: return an alexa response with an error and close session

        if numTeams == 0:
            speechOutput = (' I am sorry, but asking for the top zero teams is'
                    ' a little silly, don\'t you think? Is there something else'
                    ' you would like to know?')
            # TODO: Need to implement the SIMPLE_REPROMPT
            handler_input.response_builder.speak(speechOutput).ask(data.SIMPLE_REPROMPT)
            # TODO: does set_should_end_session need to be called and set to False?
            return handler_input.response_builder.response
        if numTeams < 0:
            speechOutput = ('Even I know that makes no sense. You need to ask'
                    ' for a positive number. Is there something else you would'
                    ' like to know?')
            handler_input.response_builder.speak(speechOutput).ask(data.SIMPLE_REPROMPT)
            # TODO: does set_should_end_session need to be called and set to False?
            return handler_input.response_builder.response
        if numTeams > len(rankings.ranks):
            speechOutput = ('I am sorry, there are only {} teams in the league'
                    ' right now. I will tell you the standings for all of'
                    ' them.')
            speechOutput = speechOutput.format(len(rankings.ranks))
            numTeams = len(rankings.ranks)

        if numTeams == len(rankings.ranks):
            speechOutput = speechOutput + ('From first place to last place, the'
                    ' current league standings: ')
        elif numTeams == 1:
            speechOutput = 'The top team in the league right now is: '
        else:
            speechOutput = 'The top {} teams in the league right now are: '
            speechOutput = speechOutput.format(numTeams)

        # Setup card
        cardTitle = "Standings"
        cardImg = Image()
        cardContent = speechOutput

        # Fill out speech output with standings info
        for i in range(0, numTeams):
            team = rankings.ranks[i].team
            record = rankings.ranks[i].record
            name = team.name

            if (i != numTeams - 1 or numTeams == 1):
                speechOutput = speechOutput + ' the {},'.format(name)
            else:
                speechOutput = speechOutput + ' and the {}.'.format(name)

            cardContent = '{}\n{}\t{}-{}'.format(cardContent, name,
                                            record.matchwin, record.matchloss)
            if i == 0:
                cardImg.small_image_url=team.logo
                cardImg.large_image_url=team.logo

        handler_input.response_builder.speak(speechOutput) \
            .set_card(StandardCard(cardTitle, cardContent, cardImg)) \
            .set_should_end_session(True)

        return handler_input.response_builder.response


class GetTeamRecordIntent(AbstractRequestHandler):
    """Handler for getting the record of a team."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetTeamRecordIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetTeamRecordIntent")

        slots = handler_input.request_envelope.request.intent.slots
        if 'Team' not in slots:
            print("Error: entered request without a slot")
            # TODO: Will we ever get here? If so we need to return an ASK error

        teamSlot = slots['Team']
        resolution = teamSlot.resolutions.resolutions_per_authority[0]

        if resolution.status.code == StatusCode.ER_SUCCESS_MATCH:
            resolutionValues = resolution.values[0]
            teamName = resolutionValues.value.name
            teamId = resolutionValues.value.id
        else:
            print("Error: not a valid team recognized in the slots")
            # TODO: implement data.TEAM_REPROMPT
            handler_input.response_builder.speak(data.INVALID_TEAM_MSG.format(teamSlot.value))\
                    .ask(data.TEAM_REPORMPT)
            return handler_input.response_builder.response

        team = APIRequest.teamfromid_v2(teamId)
        record = team.records

        W = record['matchWin']
        L = record['matchLoss']

        speechOutput = 'The {} have a record of {} wins and {}'.format(team.name,
                                                                W, L)
        if L == 1:
            speechOutput = speechOutput + ' loss.'
        else:
            speechOutput = speechOutput + ' losses.'

        cardTitle = '{}: {}-{}'.format(team.name, W, L)
        cardContent = ''
        # TODO: With the /v2/teams endpoint the logo URL are a little more
        # formatted and varying. Need to go back and modify.
        cardImg = Image(small_image_url=team.logo.path['main']['svg'],
                    large_image_url=team.logo.path['main']['svg'])

        handler_input.response_builder.speak(speechOutput) \
            .set_card(StandardCard(cardTitle, cardContent, cardImg)) \
            .set_should_end_session(True)

        return handler_input.response_builder.response


class GetTodaysMatchesIntent(AbstractRequestHandler):
    """Handler for getting matches for the day."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetTodaysMatchesIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetTodaysMatchesIntent")

        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
        return handler_input.response_builder.response


class GetTomorrowsMatchesIntent(AbstractRequestHandler):
    """Handler for getting matches for tomorrow."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetTomorrowsMatchesIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetTomorrowsMatchesIntent")

        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
        return handler_input.response_builder.response\



class GetTopTeamHandler(AbstractRequestHandler):
    """Handler for getting the Top Team Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetTopTeamIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetTopTeamHandler")

        rankings = APIRequest.rankings()
        teamRankings = rankings.ranks
        smittyWerbenManJensen = teamRankings[0].team.name #He was number one
        print(smittyWerbenManJensen)

        speech_text = smittyWerbenManJensen


        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
        return handler_input.response_builder.response


class GetYesterdaysResultsIntent(AbstractRequestHandler):
    """Handler for getting the results of the previous days matches."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GetYesterdaysResultsIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetYesterdaysResultsIntent")
        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
        return handler_input.response_builder.response


class HelpIntentHandler(AbstractRequestHandler):
    """Handler for Help Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        speech_text = "You can say hello to me!"

        handler_input.response_builder.speak(speech_text).ask(
            speech_text).set_card(SimpleCard(
                "Hello World", speech_text))
        return handler_input.response_builder.response


class CancelOrStopIntentHandler(AbstractRequestHandler):
    """Single handler for Cancel and Stop Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_intent_name("AMAZON.CancelIntent")(handler_input) or
                is_intent_name("AMAZON.StopIntent")(handler_input))

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        speech_text = "Goodbye!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text))
        return handler_input.response_builder.response


class FallbackIntentHandler(AbstractRequestHandler):
    """AMAZON.FallbackIntent is only available in en-US locale.
    This handler will not be triggered except in that locale,
    so it is safe to deploy on any locale.
    """

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        speech_text = (
            "The Hello World skill can't help you with that.  "
            "You can say hello!!")
        reprompt = "You can say hello!!"
        handler_input.response_builder.speak(speech_text).ask(reprompt)
        return handler_input.response_builder.response


class SessionEndedRequestHandler(AbstractRequestHandler):
    """Handler for Session End."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_request_type("SessionEndedRequest")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        return handler_input.response_builder.response

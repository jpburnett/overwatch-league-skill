
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
        usertz= getUserTimezone(handler_input.request_envelope)
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

        nextMatchContent = "{} The {} will {} the {}.".format(nextMatchContent,
                                                        team1.name,
                                                        getRandomEntry(vs),
                                                        team2.name)

        speechOutput = "{}{}".format(liveMatchContent, nextMatchContent)

        # Setup card
        title = "Match Details"
        img = Image(small_image_url=resource.OWL['LOGO'], large_image_url=resource.OWL['LOGO'])
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
        usertz= getUserTimezone(handler_input.request_envelope)
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
                #TODO: Figure out error handling 
        else:
            print("ANOTHER ERROR.....No team slots")
            #TODO: continue implementing
            
        print(id)
        team = APIRequest.teamfromid(id) #Get the teams endpoint
        schedule = team.schedule #Schedule is a list of matches
        
        firstMatch = schedule[0]
        
        firstMatchState = firstMatch.state #get the match state
        print(firstMatchState)
        
        liveMatchContent = ""
        
        nextMatchContent = "The next {} match will be".format(teamName)
        
        # Now that I got this working...
        #TODO: Finish writing the logic for if a state is not concluded, that is
        #when the next game should be...this could be bad logic, but hey, it works
        for match in schedule:
            if match.state == "PENDING":
                
                #WHY DOES THIS BREAK THINGS?!?! ITS LITERALLY THE SAME AS LINE 175 and THAT WORKS
                startTime = match.actualStartDate
                print("In Pending for loop")
                matchTime = "one upcoming"
                break
            else:
                matchTime = "No new matches"
                
            print(match.state)
            actualTime = match.actualStartDate
            print(actualTime)
            
        
        speechOutput = "{} at {}".format(nextMatchContent, matchTime)
        # speechOutput = "{}{}".format(liveMatchContent, nextMatchContent)

        handler_input.response_builder.speak(speechOutput).set_card(
            SimpleCard("Hello World", speechOutput)).set_should_end_session(True)
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

        # will help with figuring out errors in cloudwatch later
        logger.info("In GetStandingsIntent") 
        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
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

        speech_text = "Hello Python World from Classes!"

        handler_input.response_builder.speak(speech_text).set_card(
            SimpleCard("Hello World", speech_text)).set_should_end_session(
            True)
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

        speech_text = "Hello Python World from Classes!"

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



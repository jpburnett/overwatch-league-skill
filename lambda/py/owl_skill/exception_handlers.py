
from ask_sdk_core.dispatch_components import AbstractExceptionHandler
from ask_sdk_core.handler_input import HandlerInput

# import resources for the audio lines
from utils import resources as resource

import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class CatchAllExceptionHandler(AbstractExceptionHandler):
    """Catch all exception handler, log exception and
    respond with custom message.
    """
    def can_handle(self, handler_input, exception):
        # type: (HandlerInput, Exception) -> bool
        return True

    def handle(self, handler_input, exception):
        # type: (HandlerInput, Exception) -> Response
        logger.error(exception, exc_info=True)

        speech = "Sorry, there was some problem. Please try again!!"
        ssmlSpeech = '<audio src=\"' + resource.AUDIO['errorSounds']['mei'] + '"\/> ' + speech

        handler_input.response_builder.speak(ssmlSpeech).ask(ssmlSpeech)

        return handler_input.response_builder.response


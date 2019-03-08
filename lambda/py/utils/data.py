# -*- coding: utf-8 -*-

# Resolving gettext as _ for module loading. This will help with future il18n (internationalization?...)
from gettext import gettext as _

SKILL_NAME = _("Overwatch League")
WELCOME_MESSAGE = _("Welcome to Overwatch League. You can ask me about Overwatch League games and standings. For more help on everything I can do, say help.")
WELCOME_REPROMPT = _("For instructions on what I can help with, say help.")
PERMISSIONS_WELCOME = _("Welcome to Overwatch League.")
PERMISSIONS_PROMPT = _("In order to get match times in your local time I need permission to access your device information and location.\
                Use the Alexa companion app and enable permissions by either selecting the manage permissions link on the most recent card,\
                or, you can change permissions under this skills settings. Afterwards, please try your request again.")
DISPLAY_CARD_TITLE = _("{}  - Recipe for {}.")
HELP_MESSAGE = _("To get match date and times for a specific team, you could ask, when is the next {} game. To get\
                the next game regardless of the team, you could say tell me the next match, or, when is the next game. For\
                standings information, you can ask, who are the top teams, and I will tell you the current top three teams.\
                You may also ask for any number of teams like the top four or six teams. I am also able to tell you the current\
                record for any team. If you would like to know the current standings for every team, you can ask for all standings.\
                I am also able to tell you today\'s games, yesterday\'s results, and, tomorrow\'s games.")
HELP_REPROMPT = _("Say help to hear this again.")
INVALID_TEAM_MSG = _("I am sorry, {} is not a valid league team. Can I Help by searching for another team?")
INVALID_STAND_MSG = _("I am sorry, I did\'t quiet get that.")
API_ERROR_MSG = _("Something went wrong with an API, please try again later.")
FALLBACK_MESSAGE = _("The {} skill can't help you with that.")
STOP_MESSAGE = _("Goodbye!")

from datetime import datetime as dt
import random
import requests
import pytz

from ask_sdk_model.ui.ask_for_permissions_consent_card import AskForPermissionsConsentCard

from utils import data

vs = [
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
]

# =====================================================================
# Helper Functions
# =====================================================================
def getRandomEntry(inputList):
    """Gets a random entry from a list"""
    return random.choice(inputList)

class clkfrmt():
    datetimestr ='%A %B %d at %I:%M %p'
    clkstr = '%I:%M %p'

def requestPermission(handler_input):
    welcome = data.PERMISSIONS_WELCOME
    prompt = data.PERMISSIONS_PROMPT

    speechOutput = "{} {}".format(welcome, prompt)

    requiredPermissions = ["read::alexa:device:all:address:country_and_postal_code"]
    permissionsCard = AskForPermissionsConsentCard(requiredPermissions)

    handler_input.response_builder.speak(speechOutput) \
            .set_card(permissionsCard) \
            .set_should_end_session(True)

    return handler_input


def getUserTimezone(request_envelope):
    deviceId = request_envelope.context.system.device.device_id
    endpoint = request_envelope.context.system.api_endpoint
    token = request_envelope.context.system.api_access_token

    headers = {'Authorization': 'Bearer {}'.format(token)}

    url = '{}/v2/devices/{}/settings/System.timeZone'.format(endpoint, deviceId)

    r = requests.get(url, headers=headers)

    # TODO: right now the approach is to return None and then in the request if
    # None is detected return a permission request. The TODO here is to consider
    # if we may need to consider other options and if there is a better way.
    if r.status_code >= 400:
        print('User does not have permissions... redirecting...')
        return None

    # the content returned from the request are raw bytes the json() method
    # decodes the response and strips the double quotation, and the timezones
    # are guranteed to be from the tz database
    # (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
    return pytz.timezone(r.json())

 
# TODO: wondering if this is the best way to make/store this comparison. There
# probably is a more efficient way to go about doing this
def isToday(matchTime):
    today = dt.today().date()
    matchDate = matchTime.date()

    dateDelta = (today - matchDate).days

    return (dateDelta == 0)

def wasYesterday(matchTime):
    today = dt.today().date()
    matchDate = matchTime.date()

    dateDelta = (today - matchDate).days

    return (dateDelta == -1)

def isTomorrow(matchTime):
    today = dt.today().date()
    matchDate = matchTime.date()

    dateDelta = (today - matchDate).days

    return (dateDelta == 1)

# TODO: Idk if this will be sufficient because of how the week rolls over in
# each week, meaning we may have a bug not identifiying the next match using the
# logic as written here
def getCurrentWeek(schedule):
    # TODO: The js implementation used a hueristic based on the total number of
    # games in the season to cut this search in half. It may be worth while to
    # include that here.
    # get this week in the schedule
    today = dt.today()
    for stage in schedule.stages:
        for week in stage.weeks:
            start = week.startTS
            end = week.endTS
            if today > start and today < end:
                return week

    # a valid week was not found
    return None

def getNextMatch(week):

    today = dt.today()
    # sort matches with start time in ascending order, just to be safe.
    matches = week.matches
    matches.sort(key = lambda x: x.startTS)
    for match in matches:
        start = match.startTS
        end = match.endTS
        if today < start:
            return match

    # a valid match was not found
    return None

if __name__=="__main__":
    from owl_model.apirequest import APIRequest

    schedule = APIRequest.schedule()

    thisweek = getCurrentWeek(schedule)

    nextmatch = getNextMatch(thisweek)

    print("Current week starts:", thisweek.matches[0].startTS)
    print("\tThe next match is:", nextmatch.startTS)

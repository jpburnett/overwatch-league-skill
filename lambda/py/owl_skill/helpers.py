
from datetime import datetime as dt
import random

# =====================================================================
# Helper Functions
# =====================================================================
def getRandomEntry(inputList):
    """Gets a random entry from a list"""
    randomEntry = random.choice(list(inputList))
    return inputList[randomEntry]


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

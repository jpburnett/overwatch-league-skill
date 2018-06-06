import os, sys, json, requests
import datetime as dt
import time
import numpy as np
from scipy.stats import poisson
import matplotlib.pyplot as plt

# NOTE: TEAM1 = AWAY TEAM (ATK FIRST)
#       TEAM2 = HOME TEAM (DEF FIRST)

SOURCE = "NETWORK"

ESCORT  = ['junkertown', 'dorado', 'route-66', 'gibraltar']
ASSAULT  = ['hanamura', 'volskaya', 'temple-of-anubis', 'horizon-lunar-colony']
HYBRID  = ['kings-row', 'numbani', 'hollywood', 'eichenwalde', 'blizzard-world']
CONTROL = ['nepal', 'ilios', 'lijiang', 'oasis']

TEAM_ID = {
         '4523' : 'fuel',
         '4524' : 'fusion',
         '4525' : 'outlaws',
         '4402' : 'uprising',
         '4403' : 'excelsior',
         '4404' : 'shock',
         '4405' : 'valiant',
         '4406' : 'gladiators',
         '4407' : 'mayhem',
         '4408' : 'dragons',
         '4409' : 'dynasty',
         '4410' : 'spitfire'
    }

class dataManager:
    def __init__(self, root=None, src=SOURCE, ext='.json'):
        self.root = root
        self.src = src
        self.ext = ext

    def fetchData(self, route):

        url = os.path.join(self.root, route)

        if self.src == "NETWORK":
            # fetch from network url and json decode
            r = requests.get(url).json()
        else:
            # open json file
            fp = open(url+self.ext, 'r')
            r = json.load(fp)

        return r

class WL_hist:
    def __init__(self, min, max):
        self.homePts = simple_hist(min, max)
        self.awayPts = simple_hist(min, max)

    def binHomePts(self, val):
        self.homePts.bin(val)
    def binAwayPts(self, val):
        self.awayPts.bin(val)

class simple_hist:
    def __init__(self, min, max):
        self.min = min
        self.max = max
        self.bins = np.zeros(int(max - min))

    def bin(self, value):
        self.bins[value] += 1

class league:
    def __init__(self):
        self.teams = []

    def addTeam(self, team):
        self.teams.append(team)

    def getTeam(self, id):
        if len(self.teams) == 0:
            return None

        for i in range(0, len(self.teams)):
            t = self.teams[i]
            if t.id == id:
                return t

        print "Team not found..."
        return None

    def printOverallStandings(self):
        print '{:<6s}{:<24s} W-L     MAP W-L-T'.format("ID", "Name")
        print "--------------------------------------------------"
        for t in self.teams:
            print '{:<6d}{:<24s} {:2d}-{:<2d}      {:2d}-{:2d}-{:<2d}'.format(t.id, t.name, t.W, t.L, t.wins, t.loss,
                                                                              t.tie)
        print "--------------------------------------------------"
        print '{:<6s}{:<24s}         MAP {:<3d}-{:<3d}-{:2d}'.format("####", "League Totals", totalPtsWin, totalPtsLoss,
                                                                     totalPtsTie)
        print ""

class team:
    def __init__(self, obj):
        self.name = obj['competitor']['name']
        self.id = obj['competitor']['id']
        self.place = obj['placement']

        record = obj['records'][0]
        self.wins = record['gameWin']
        self.loss = record['gameLoss']
        self.tie  = record['gameTie']
        self.W    = record['matchWin']
        self.L    = record['matchLoss']

        self.simResults = {
            "wins" : 0,
            "loss" : 0,
            "tie"  : 0,
            "W"    : 0,
            "L"    : 0
        }

        self. matchesPlayed = 0

        self.streak  = 0

        self.escortPts  = 0
        self.escortPtsLost = 0
        self.escortPlayed = 0
        self.hybridPts  = 0
        self.hybridPtsLost = 0
        self.hybridPlayed = 0
        self.controlPts = 0
        self.controlPtsLost = 0
        self.controlPlayed = 0
        self.assaultPts  = 0
        self.assaultPtsLost = 0
        self.assaultPlayed = 0

        self.escortAtk = 0
        self.escortDef = 0
        self.hybridAtk = 0
        self.hybridDef = 0
        self.controlAtk = 0
        self.controlDef = 0
        self.assaultAtk = 0
        self.assaultDef = 0

league = league()
totalPtsWin  = 0
totalPtsLoss = 0
totalPtsTie  = 0

totalHomePts = 0
totalAwayPts = 0
team1Matches = 0 # team1 matches == team2 matches == matches played (hopefully) maybe matches concluded?
team2Matches = 0

totalEscortPts  = 0
totalEscortPlayed = 0
totalAssaultPts  = 0
totalAssaultPlayed = 0
totalHybridPts  = 0
totalHybridPlayed = 0
totalControlPts = 0
totalControlPlayed = 0
matchesConcluded = 0
matchesPlayed = 0       # there is a discrepancy between matches played and matches concluded because of season stage finals and preseason

escort_hist = WL_hist(0,10)
hybrid_hist = WL_hist(0,10)
control_hist = WL_hist(0,3)
assault_hist = WL_hist(0,10)

# escort_hist = simple_hist(0,10)
# hybrid_hist = simple_hist(0,10)
# control_hist = simple_hist(0,4)
# assault_hist = simple_hist(0,10)


# initialize the data source information
if SOURCE == "NETWORK":
    rootURL = 'https://api.overwatchleague.com'
else:
    rootURL = './data'
dm = dataManager(rootURL)

# Get team standings and initialize league
response = dm.fetchData('standings')

ranks = response['ranks']

for rank in ranks:
    t = team(rank)
    league.addTeam(t)
    totalPtsWin += t.wins
    totalPtsLoss += t.loss
    totalPtsTie  += t.tie

league.printOverallStandings()

# get the number of matches played... figured it was better to get it from the API
response = dm.fetchData('ranking')
matchesConcluded = response['matchesConcluded'] # matches concluded form the API is diff than the count because it doesn't include playoff games
totalMatchCount = 0

# Now get all the matches played by the team and fill in their map type scores
now = int(time.time()*1000)
response = dm.fetchData('schedule')
stages = response['data']['stages']

startStgIdx = 1
stageEndIdx = 5 # preseason is id 0
for s in stages[startStgIdx:stageEndIdx]:
    print 'Processing matches for stage {:d}...'.format(s['id'])

    matches = s['matches']
    matches = sorted(matches, key=lambda x: x['startDateTS'])

    for m in matches:
        if m['state'] == "CONCLUDED":
        #if now > m['startDateTS']:
            totalMatchCount += 1
            totalAwayPts += m['scores'][0]['value']
            totalHomePts += m['scores'][1]['value']

            t1 = league.getTeam(m['competitors'][0]['id']) # away
            t2 = league.getTeam(m['competitors'][1]['id']) # home

            t1.matchesPlayed += 1
            t2.matchesPlayed += 1

            games = m['games']
            for g in games:
                if g['state'] == "CONCLUDED":
                    gAttrs = g['attributes']
                    mapType = gAttrs['map']

                    if mapType in ESCORT:
                        t1.escortPts += gAttrs['mapScore']['team1']
                        t1.escortPtsLost += gAttrs['mapScore']['team2']

                        t2.escortPtsLost += gAttrs['mapScore']['team1']
                        t2.escortPts += gAttrs['mapScore']['team2']

                        t1.escortPlayed += 1
                        t2.escortPlayed += 1
                        totalEscortPlayed += 1

                        # bin the points scored by the teams to visualize probability of scoring
                        # pts on a certain map type. I am a little conflicted about this because of
                        # league game format. The home team defends first and in OW for escort,
                        # assault and hybrid maps the home team only need to score one better
                        # than the away teams attack attempt. So maybe the atk/def strength can
                        # take this into account but I can imagine a better model being "generate
                        # the away teams atk score given an opponets defense strength then calculate
                        # the probability the home team scores that number of points or greater given their
                        # attack strength and away teams defense strength."
                        escort_hist.binAwayPts(gAttrs['mapScore']['team1'])
                        escort_hist.binHomePts(gAttrs['mapScore']['team2'])

                    if mapType in ASSAULT:
                        t1.assaultPts += gAttrs['mapScore']['team1']
                        t1.assaultPtsLost += gAttrs['mapScore']['team2']

                        t2.assaultPtsLost += gAttrs['mapScore']['team1']
                        t2.assaultPts += gAttrs['mapScore']['team2']

                        t1.assaultPlayed += 1
                        t2.assaultPlayed += 1
                        totalAssaultPlayed += 1

                        assault_hist.binAwayPts(gAttrs['mapScore']['team1'])
                        assault_hist.binHomePts(gAttrs['mapScore']['team2'])

                    if mapType in HYBRID:
                        t1.hybridPts += gAttrs['mapScore']['team1']
                        t1.hybridPtsLost += gAttrs['mapScore']['team2']

                        t2.hybridPtsLost += gAttrs['mapScore']['team1']
                        t2.hybridPts += gAttrs['mapScore']['team2']

                        t1.hybridPlayed += 1
                        t2.hybridPlayed += 1
                        totalHybridPlayed += 1

                        hybrid_hist.binAwayPts(gAttrs['mapScore']['team1'])
                        hybrid_hist.binHomePts(gAttrs['mapScore']['team2'])

                    if mapType in CONTROL:
                        t1.controlPts += gAttrs['mapScore']['team1']
                        t1.controlPtsLost += gAttrs['mapScore']['team2']

                        t2.controlPtsLost += gAttrs['mapScore']['team1']
                        t2.controlPts += gAttrs['mapScore']['team2']

                        t1.controlPlayed += 1
                        t2.controlPlayed += 1
                        totalControlPlayed += 1

                        control_hist.binAwayPts(gAttrs['mapScore']['team1'])
                        control_hist.binHomePts(gAttrs['mapScore']['team2'])

# Print total points scored by team and the league
print '{:<24s}{:<14s}{:<14s}{:<14s}{:<14s}'.format("Name", "Escort W-L", "Assault W-L", "Hybrid W-L", "Control W-L")
print "---------------------------------------------------------------------------"
for t in league.teams:
    print '{:<24s}{:>6d}-{:<6d}{:>6d}-{:<6d}{:>6d}-{:<6d}{:>6d}-{:<6d}'.format(t.name, t.escortPts, t.escortPtsLost, t.assaultPts, t.assaultPtsLost, t.hybridPts, t.hybridPtsLost, t.controlPts, t.controlPtsLost)
    totalEscortPts  += t.escortPts
    totalAssaultPts  += t.assaultPts
    totalHybridPts  += t.hybridPts
    totalControlPts += t.controlPts
print "---------------------------------------------------------------------------"
print '{:<24s}{:<16d}{:<16d}{:<16d}{:<16d}'.format("League Totals", totalEscortPts, totalAssaultPts, totalHybridPts, totalControlPts)

# Calculate strengths

leagueMatchAtkRatio = float(totalAwayPts)/float(totalMatchCount) # maybe could call Away strength? A metric to help weight prob of an away team winning?
leagueMatchDefRatio = float(totalHomePts)/float(totalMatchCount) # maybe could call Home strength? A metric to help weight prob of a home team stopping the away team?

leagueEscortRatio = float(totalEscortPts)/float(totalEscortPlayed)
leagueAssaultRatio = float(totalAssaultPts)/float(totalAssaultPlayed)
leagueHybridRatio = float(totalHybridPts)/float(totalHybridPlayed)
leagueControlRatio = float(totalControlPts)/float(totalControlPlayed)

print "league match atk ratio ", leagueMatchAtkRatio
print "league match def ratio ", leagueMatchDefRatio
print "total escort pts", totalEscortPts
print "total escort played", totalEscortPlayed
print leagueEscortRatio
print
print "total control pts", totalControlPts
print "total control played", totalControlPlayed
print leagueControlRatio

print ""
print "{:<24s}{:<20s}{:<20s}{:<20s}{:<20s}".format("Name", "Escort Atk-Def", "Assault Atk-Def", "Hybrid Atk-Def", "Control Atk-Def")
print "----------------------------------------------------------------------------------------------"
for t in league.teams:
    t.escortAtk = (float(t.escortPts)/float(t.escortPlayed))/leagueEscortRatio
    t.escortDef = (float(t.escortPtsLost)/float(t.escortPlayed))/leagueEscortRatio

    t.assaultAtk = (float(t.assaultPts)/float(t.assaultPlayed))/leagueAssaultRatio
    t.assaultDef = (float(t.assaultPtsLost)/float(t.assaultPlayed))/leagueAssaultRatio

    t.hybridAtk = (float(t.hybridPts)/float(t.hybridPlayed))/leagueHybridRatio
    t.hybridDef = (float(t.hybridPtsLost)/float(t.hybridPlayed))/leagueHybridRatio

    t.controlAtk = (float(t.controlPts)/float(t.controlPlayed))/leagueControlRatio
    t.controlDef = (float(t.controlPtsLost)/float(t.controlPlayed))/leagueControlRatio
    print "{:<24s}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}".format(t.name, t.escortAtk, t.escortDef, t.assaultAtk, t.assaultDef, t.hybridAtk, t.hybridDef, t.controlAtk, t.controlDef)
print "----------------------------------------------------------------------------------------------"
print ""

print control_hist.awayPts.bins
print control_hist.homePts.bins
print
print assault_hist.awayPts.bins
print assault_hist.homePts.bins
print
print hybrid_hist.awayPts.bins
print hybrid_hist.homePts.bins
print
print escort_hist.awayPts.bins
print escort_hist.homePts.bins

plt.figure()
plt.plot(control_hist.homePts.bins, '-g', label='home')
plt.plot(control_hist.awayPts.bins, '--or', label='away')
plt.title('control')
plt.legend()
plt.grid()

plt.figure()
plt.plot(assault_hist.homePts.bins, '-g', label='home')
plt.plot(assault_hist.awayPts.bins, '--or', label='away')
plt.title('assault')
plt.legend()
plt.grid()

plt.figure()
plt.plot(hybrid_hist.homePts.bins, '-g', label='home')
plt.plot(hybrid_hist.awayPts.bins, '--or', label='away')
plt.title('hybrid')
plt.legend()
plt.grid()

plt.figure()
plt.plot(escort_hist.homePts.bins, '-g', label='home')
plt.plot(escort_hist.awayPts.bins, '--or', label='away')
plt.title('escort')
plt.legend()
plt.grid()

# plt.show()

#####################################
## time to simulate some matches...
#####################################

# TODO: Use the streak information to help weight probability? Currently it ins't being set. It was removed when
# accumulating points from the 'schedule' endpoint instead of the 'team/ID' endpoint.

# get the games for the stages
currentStgIdx = 4

response = dm.fetchData('schedule')

stages = response['data']['stages']
matches = stages[currentStgIdx]['matches']

limit = 3
N = 10
#for m in matches:
j = 0
while j < N:
    i = 0
    while i < limit:
        m = matches[i]
        home = m['competitors'][0]
        away = m['competitors'][1]

        home = league.getTeam(home['id'])
        away = league.getTeam(away['id'])

        homeScore = 0
        awayScore = 0
        print '{:20s} vs. {:20s}'.format(home.name, away.name)
        games = m['games']
        for g in games:
            map = g['attributes']['map']
            if map in ESCORT:
                homepts = poisson.rvs(home.escortAtk*away.escortDef*leagueEscortRatio)
                awaypts = poisson.rvs(away.escortAtk*home.escortDef*leagueEscortRatio)

                print "\tEscrot:{:d}-{:d}".format(homepts, awaypts)
                if awaypts <= homepts:
                    homeScore += 1
                else:
                    awayScore += 1

            if map in ASSAULT:
                homepts = poisson.rvs(home.assaultAtk * away.assaultDef * leagueAssaultRatio)
                awaypts = poisson.rvs(away.assaultAtk * home.assaultDef * leagueAssaultRatio)

                print "\tAssault:{:d}-{:d}".format(homepts, awaypts)
                if awaypts < homepts:
                    homeScore += 1
                elif awaypts > homepts:
                    awayScore += 1

            if map in HYBRID:
                homepts = poisson.rvs(home.hybridAtk * away.hybridDef * leagueHybridRatio)
                awaypts = poisson.rvs(away.hybridAtk * home.hybridDef * leagueHybridRatio)

                print "\tHybrid:{:d}-{:d}".format(homepts, awaypts)
                if awaypts < homepts:
                    homeScore += 1
                elif awaypts > homepts:
                    awayScore += 1

            if map in CONTROL:
                homepts = poisson.rvs(home.controlAtk * away.controlDef * leagueControlRatio)
                awaypts = poisson.rvs(away.controlAtk * home.controlDef * leagueControlRatio)

                print "\tControl:{:d}-{:d}".format(homepts, awaypts)
                if awaypts <= homepts:
                    homeScore += 1
                else:
                    awayScore += 1

        if homeScore == awayScore:
            homepts = poisson.rvs(home.controlAtk * away.controlDef * leagueControlRatio)
            awaypts = poisson.rvs(away.controlAtk * home.controlDef * leagueControlRatio)

            print "\tControl:{:d}-{:d}".format(homepts, awaypts)
            if awaypts <= homepts:
                homeScore += 1
            else:
                awayScore += 1

        print "\tFinal:{:d}-{:d}".format(homeScore, awayScore)

        # tally up the score for the this game...
        isTeam1 = True if homeScore > awayScore else False

        if isTeam1:
            home.simResults["W"] += 1
            away.simResults["L"] += 1
        else:
            home.simResults["L"] += 1
            away.simResults["W"] += 1

        home.simResults["wins"] += homeScore
        home.simResults["loss"] += awayScore

        away.simResults["wins"] += awayScore
        away.simResults["loss"] += homeScore
        print ""
        i+=1
    j += 1
    print "done with sim #{:d}".format(j)





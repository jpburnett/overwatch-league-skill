import os, sys, json, requests
import datetime as dt
import time
import numpy as np
from scipy.stats import poisson
import matplotlib.pyplot as plt

SOURCE = "FILE"

ESCORT  = ['junkertown', 'dorado', 'route-66', 'gibraltar']
ASSULT  = ['hanamura', 'volskaya', 'temple-of-anubis', 'horizon-lunar-colony']
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
        self.w = simple_hist(min, max)
        self.l = simple_hist(min, max)

    def bin_w(self, val):
        self.w.bin(val)
    def bin_l(self, val):
        self.l.bin(val)

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
        self.assultPts  = 0
        self.assultPtsLost = 0
        self.assultPlayed = 0

        self.escortAtk = 0
        self.escortDef = 0
        self.hybridAtk = 0
        self.hybridDef = 0
        self.controlAtk = 0
        self.controlDef = 0
        self.assultAtk = 0
        self.assultDef = 0


league = league()
totalPtsWin  = 0
totalPtsLoss = 0
totalPtsTie  = 0

team1Pts = 0
team2Pts = 0
team1Matches = 0 # team1 matches == team2 matches == matches played (hopefully) maybe matches concluded?
team2Matches = 0

totalEscortPts  = 0
totalEscortPlayed = 0
totalAssultPts  = 0
totalAssultPlayed = 0
totalHybridPts  = 0
totalHybridPlayed = 0
totalControlPts = 0
totalControlPlayed = 0
matchesConcluded = 0
matchesPlayed = 0       # there is a discrepancy between matches played and matches concluded because of season stage finals and preseason

escort_hist = WL_hist(0,10)
hybrid_hist = WL_hist(0,10)
control_hist = WL_hist(0,4)
assult_hist = WL_hist(0,10)

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
matchesConcluded = response['matchesConcluded']

# Now get all the matches played by the team and fill in their map type scores
now = int(time.time()*1000)
for t in league.teams:
    print 'Processing matches for {:s}...'.format(t.name)

    response = dm.fetchData('teams/{:d}'.format(t.id))
    t.streak = response['ranking']['streakNum']

    matches = response['schedule']
    matches = sorted(matches, key= lambda x: x['startDate'])

    i = 0
    m = matches[i]
    while m['state'] == "CONCLUDED" or  m['state'] == "CONCLUDED_BYE":
        competitors = m['competitors']
        isTeam1 = True if t.id == competitors[0]['id'] else False

        games = m['games']

        # first breakdown breakdown scores by map type
        for g in games:
            if g['state'] == "CONCLUDED":
                gAttrs = g['attributes']
                mapType = gAttrs['map']
                if mapType in ESCORT:
                    t.escortPts += gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2']
                    t.escortPtsLost += gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1']

                    escort_hist.bin_w(gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2'])
                    escort_hist.bin_l(gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1'])

                    t.escortPlayed += 1
                    totalEscortPlayed += 1
                if mapType in ASSULT:
                    t.assultPts += gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2']
                    t.assultPtsLost += gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1']

                    assult_hist.bin_w(gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2'])
                    assult_hist.bin_l(gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1'])

                    t.assultPlayed += 1
                    totalAssultPlayed += 1
                if mapType in HYBRID:
                    t.hybridPts += gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2']
                    t.hybridPtsLost += gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1']

                    hybrid_hist.bin_w(gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2'])
                    hybrid_hist.bin_l(gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1'])

                    t.hybridPlayed += 1
                    totalHybridPlayed += 1
                if mapType in CONTROL:
                    t.controlPts += gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2']
                    t.controlPtsLost += gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1']

                    control_hist.bin_w(gAttrs['mapScore']['team1'] if isTeam1 else gAttrs['mapScore']['team2'])
                    control_hist.bin_l(gAttrs['mapScore']['team2'] if isTeam1 else gAttrs['mapScore']['team1'])

                    t.controlPlayed += 1
                    totalControlPlayed += 1

                #then tally the match score for the league to have an overall atk/defense score to
                # compare to individual maps
                team1Pts += m['scores'][0]['value']
                team2Pts += m['scores'][1]['value']
                t.matchesPlayed += 1

        i += 1
        m = matches[i]
print ""

# Print total points scored by team and the league
print '{:<24s}{:<14s}{:<14s}{:<14s}{:<14s}'.format("Name", "Escort W-L", "Assult W-L", "Hybrid W-L", "Control W-L")
print "---------------------------------------------------------------------------"
for t in league.teams:
    print '{:<24s}{:>6d}-{:<6d}{:>6d}-{:<6d}{:>6d}-{:<6d}{:>6d}-{:<6d}'.format(t.name, t.escortPts, t.escortPtsLost, t.assultPts, t.assultPtsLost, t.hybridPts, t.hybridPtsLost, t.controlPts, t.controlPtsLost)
    totalEscortPts  += t.escortPts
    totalAssultPts  += t.assultPts
    totalHybridPts  += t.hybridPts
    totalControlPts += t.controlPts
print "---------------------------------------------------------------------------"
print '{:<24s}{:<16d}{:<16d}{:<16d}{:<16d}'.format("League Totals", totalEscortPts, totalAssultPts, totalHybridPts, totalControlPts)

# Calculate strengths
leagueEscortRatio = float(totalEscortPts)/float(totalEscortPlayed)
leagueAssultRatio = float(totalAssultPts)/float(totalAssultPlayed)
leagueHybridRatio = float(totalHybridPts)/float(totalHybridPlayed)
leagueControlRatio = float(totalControlPts)/float(totalControlPlayed)

print "total escort pts", totalEscortPts
print "total escort played", totalEscortPlayed
print leagueEscortRatio
print
print "total control pts", totalControlPts
print "total control played", totalControlPlayed
print leagueControlRatio

print ""
print "{:<24s}{:<20s}{:<20s}{:<20s}{:<20s}".format("Name", "Escort Atk-Def", "Assult Atk-Def", "Hybrid Atk-Def", "Control Atk-Def")
print "-----------------------------------------------------------------------------------------"
for t in league.teams:
    t.escortAtk = (float(t.escortPts)/float(t.escortPlayed))/leagueEscortRatio
    t.escortDef = (float(t.escortPtsLost)/float(t.escortPlayed))/leagueEscortRatio

    t.assultAtk = (float(t.assultPts)/float(t.assultPlayed))/leagueAssultRatio
    t.assultDef = (float(t.assultPtsLost)/float(t.assultPlayed))/leagueAssultRatio

    t.hybridAtk = (float(t.hybridPts)/float(t.hybridPlayed))/leagueHybridRatio
    t.hybridDef = (float(t.hybridPtsLost)/float(t.hybridPlayed))/leagueHybridRatio

    t.controlAtk = (float(t.controlPts)/float(t.controlPlayed))/leagueControlRatio
    t.controlDef = (float(t.controlPtsLost)/float(t.controlPlayed))/leagueControlRatio
    print "{:<24s}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}{:>10.2f}-{:<6.2f}".format(t.name, t.escortAtk, t.escortDef, t.assultAtk, t.assultDef, t.hybridAtk, t.hybridDef, t.controlAtk, t.controlDef)
print "-----------------------------------------------------------------------------------------"
print ""

print control_hist.w.bins
print control_hist.l.bins
print
print assult_hist.w.bins
print assult_hist.l.bins
print
print hybrid_hist.w.bins
print hybrid_hist.l.bins
print
print escort_hist.w.bins
print escort_hist.l.bins

plt.figure()
plt.plot(control_hist.w.bins, '-g', label='wins')
plt.plot(control_hist.l.bins, '--or', label='losses')
plt.title('control')

plt.figure()
plt.plot(assult_hist.w.bins, '-g', label='wins')
plt.plot(assult_hist.l.bins, '--or', label='losses')
plt.title('assult')

plt.figure()
plt.plot(hybrid_hist.w.bins, '-g', label='wins')
plt.plot(hybrid_hist.l.bins, '--or', label='losses')
plt.title('hybrid')

plt.figure()
plt.plot(escort_hist.w.bins, '-g', label='wins')
plt.plot(escort_hist.l.bins, '--or', label='losses')
plt.title('escort')

# plt.show()

#####################################
## time to simulate some matches...
#####################################

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

            if map in ASSULT:
                homepts = poisson.rvs(home.assultAtk * away.assultDef * leagueAssultRatio)
                awaypts = poisson.rvs(away.assultAtk * home.assultDef * leagueAssultRatio)

                print "\tAssult:{:d}-{:d}".format(homepts, awaypts)
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





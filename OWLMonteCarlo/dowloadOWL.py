import os, sys
import json, requests

# TODO: NEED TO UPDATE TO HAVE FILES RIGHT OUT AS THE TEAM ID NUMBER
# TODO: NOT THE TEAM NAME.


TEAM_ID = {
        'fuel'       : 4523,
         'fusion'    : 4524,
         'outlaws'   : 4525,
         'uprising'  : 4402,
         'excelsior' : 4403,
         'shock'     : 4404,
         'valiant'   : 4405,
         'gladiators': 4406,
         'mayhem'    : 4407,
         'dragons'   : 4408,
         'dynasty'   : 4409,
         'spitfire'  : 4410
    }

OWLURL = 'https://api.overwatchleague.com'

STANDINGS = '/standings'
RANKING = '/ranking'
SCHEDULE = '/schedule'

save_path = './data/'
standings_file = open(save_path+'standings.json', 'w+')
ranking_file = open(save_path+'ranking.json', 'w+')
schedule_file = open(save_path+'schedule.json', 'w+')


standings_request = requests.get(OWLURL+STANDINGS)
standings_json_data = standings_request.json()
standings_data_str = json.dump(standings_json_data, standings_file)

ranking_request = requests.get(OWLURL+RANKING)
ranking_json_data = ranking_request.json()
standings_data_str = json.dump(ranking_json_data, ranking_file)

schedule_request = requests.get(OWLURL+SCHEDULE)
schedule_json_data = schedule_request.json()
schedule_data_str = json.dump(schedule_json_data, schedule_file)

save_path = './data/teams/'
for team, id in TEAM_ID.iteritems():
    file = open(save_path+'{:s}'.format(team)+'.json', 'w+')
    request = requests.get(OWLURL+'/teams/{:d}'.format(id))
    json_data = request.json()
    data_str = json.dump(json_data,file)

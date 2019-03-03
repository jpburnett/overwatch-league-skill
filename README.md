# overwatch-league-skill
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/jpburnett/overwatch-league-skill/master/LICENSE)
<p align="center">
  <b>The Overwatch League Alexa Skill</b><br>
  <a href="https://www.overwatchleague.com">Overwatch League Website</a> |
  <a href="https://www.amazon.com/Parker-Burnett-Overwatch-League/dp/B079T6GPXD/ref=sr_1_2?s=digital-skills&ie=UTF8&qid=1519791836&sr=1-2&keywords=Overwatch+League">Link To Enable Alexa Skill</a> | 
  <a href="http://alexa.parkerburnett.com">Privacy Policy Page</a>
  <br><br>
  <img src="https://bnetcmsus-a.akamaihd.net/cms/blog_thumbnail/sk/SK64HITB0XB41544562348016.jpg">
  
  <p align="center" font="32pt"> WELCOME TO SEASON 2! </p>
  
</p>

## What Does the Skill Do?
The Overwatch League Skill gives information about the overwatch league game schedule and scores. 

Here is a list of current features that you can ask Alexa:

1. When a team plays next:
   - Ex. "Alexa open Overwatch League and ask When does the {**team name**} play next?" Team names being Outlaws, Dynasty, etc.
   
   Alexa will respond with the date and time of the requested teams game. Provided you granted access to your location the times should be time zone adjusted to your time zone.
   
2. Who plays today/tonight:
   - Ex. "Alexa open Overwatch League and ask who plays today/tonight". 
  
    Alexa will give you a list of the teams that will be playing that night and give the times of the scheduled games.
    
3. Who the top teams are:
   - Ex. "Alexa open Overwatch League and ask who the top team is". 
   
   This will tell you the number one team in the league with their wins and losses.
   - Ex. "Alexa open Overwatch League and ask who the top teams are". 
   
   This will default with giving you the Top three teams in the league.
   - Ex. "Alexa open Overwatch League and ask who the top {**any number**} teams are". 
   
   This case depends on how many number of teams you ask for. It can be any number from 1 to 12. You are welcome to try other numbers :wink:
   
4. A teams record:
   - Ex. "Alexa open Overwatch League and tell me the record of the {**team name**}"
   
   Or
   - Ex. "Alexa open Overwatch League and tell me what's the record for the {**team name**}"
   
   Alexa will give you the record of wins and losses of the requested team. There are other variations as to how you could phrase this question, hopefully we covered them all. 


## Acknowledgements
Overwatch League is a brand and trademark of Blizzard Entertainment. Thank you to Blizzard and the Overwatch League Devs for providing/allowing the use of the API. It has been a fun side project working on this! 

We hope to add more features as time goes on.

# When deploying code for the Alexa Skill, make sure to do the following 4 steps:

1. ```pip install -r py/requirements.txt -t skill_env```

2. ```cp -r py/* skill_env/```

3. Zip the contents of the skill_env folder. Zip the contents of the folder and NOT the folder itself. If you zip the folder it will not work

4. Upload the .ZIP file to the AWS Lambda console

## Using IPython to Test Locally
To use the local Alexa simulator you will need some sample events in JSON format
under ```lambda/py/utils/sampleEvents```. The files need to be named as shown in
the ```sample_events``` dictionary of ```aws_sim.py```.

1. Setup your enviornment

    source <path/to/env>/bin/activate>
    export PYTHONPATH=<path/to/repo>/lambda/py

2. Start IPython from ```lambda/py```

    cd <path/to/repo>/lambda/py
    ipython

3. The following will run the simulator for the default launch request:

    %run aws_sim.py lambda
    request_envelope = load_request_from_templates(samples_path+sample_events['LaunchRequest'])
    context = load_context()
    s.invoke(request_envelope, context)

The output should be similar to the following:

    {'response': {'can_fulfill_intent': None,
              'card': {'content': 'Overwatch League',
                       'object_type': 'Simple',
                       'title': 'Overwatch League'},
              'directives': None,
              'output_speech': {'object_type': 'SSML',
                                'play_behavior': None,
                                'ssml': '<speak>'
                                        'Welcome to Overwatch League. You can '
                                        'ask me about Overwatch League games '
                                        'and standings. For more help on '
                                        'everything I can do, say '
                                        'help.</speak>'},
              'reprompt': {'output_speech': {'object_type': 'SSML',
                                             'play_behavior': None,
                                             'ssml': '<speak>For instructions '
                                                     'on what I can help with, '
                                                     'say help.</speak>'}},
              'should_end_session': False},
    'session_attributes': {},
    'user_agent': 'ask-python/1.8.0 Python/3.7.0',
    'version': '1.0'}

To invoke a different intent replace ```'LaunchRequest'``` with a different one
from the ```sample_events``` dictionary in the simulator.

## A list of endpoints

```
/rankings - returns current rankings
/schedule - returns current schedule including past matches 
/matches - Returns all matches
/matches/:matchID
/match - Returns all matches
/match/:matchID - Returns a specific match
/teams - Returns all teams
/teams/:TeamID - Returns a specific team
/news - Returns all news items
/news/:blogID - Returns a specified news item
/data/countries - Returns list of countries
/v2/email - Unsure what this does, but it was in the js
/live-match - Presumably returns live data for a match?
/v2/streams - Returns owl stream links
/maps - Returns list of maps
/vods - Returns list of vods for prior matches
/live-match
/players
/standings
/playoffs
/about
/health
```

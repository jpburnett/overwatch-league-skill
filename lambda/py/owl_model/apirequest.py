
from owl_model.url import URL
from utils.deserializer import SerDeser

from owl_model.easteregg import EasterEgg
from owl_model.team import Team
from owl_model.league import League

# TODO: make note in different request class about the difference between making
# requests at teams and teamsById and schedule and matchById. For example, when
# making a request at schedule it includes stages infromation and the individual
# matches do not have the list of players in the match object. But a call at the
# matchById endpoint includes much more information. Similar thing was observed
# for teams but need to go back and note and document that.

# TODO: should this extend url? How to make this class the best it can be is
# still a little fuzzy to me
class APIRequest(URL):
    """
    """
    baseurl = 'https://api.overwatchleague.com'
    endpoints = {
        'TeamsRequest': '/teams',
        'TeamByIdRequest': '/team/{}',
        'schedule': '/schedule',
        'matchById': '/match/{}',
        'rankings': '/ranking'
    }
    
    path = None
    deser_cls_type = None
    sd = SerDeser()


    @classmethod
    def __makecall(cls):
        """
        Make the call to the OWL API. Fetch the content and pass to the deserializer.
        """
        return cls.sd.deserialize(cls.get_resource(cls), cls.deser_cls_type)


    @classmethod
    def easteregg(cls):
        cls.path = cls.baseurl;
        cls.deser_cls_type = EasterEgg
        return cls.__makecall()


    @classmethod
    def teams(cls):
        cls.path = cls.baseurl + cls.endpoints['TeamsRequest']
        cls.deser_cls_type = League
        return cls.__makecall()


    @classmethod
    def teamfromid(cls, teamid=None):
        if not teamid:
            print("ERROR: team id not provided")
            return None

        cls.path = cls.baseurl + cls.endpoints['TeamByIdRequest']
        cls.path = cls.path.format(teamid)
        cls.deser_cls_type = Team
        return cls.__makecall()


if __name__ == "__main__":

    # Fetch the entire collections of teams in the OWL from the '/teams'
    # endpoint
    league = APIRequest.teams() 

    # Get a specifc team by teamid (summary of team id's can be found in
    # owl_model.league.League)
    team = APIRequest.teamfromid('4523')

    # The APIRequest classmethod are a factory constructor returning model
    # objects from owl_model. The above call to get team with id 4523 (the
    # Dallas Fuel) returns a owl_model.team.Team and the Team model object has
    # several attribute to expose relevant for a team such as the players of the
    # team or the schedule of the team.

    # See owl_model.team.Team for more detail on available information. The
    # following show some examples for how to use a Team

    # show the info for the first player on the team.
    print(team.players[0].info, "\n")

    # Print all the players on the team
    print("The players for the", team.name, "are:")
    for player in team.players:
        print("\t", player.info.name)

    # Get the date for the first match the team has and timezone for the match.
    # The team schedule is a list of owl_model.match.Match. See
    # owl_model/model.py for more detail.
    print(team.schedule[0].startdate, team.schedule[0].timezone, "\n")

    # and remeber
    print("The world,", APIRequest.easteregg().theWorld)

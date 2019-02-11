
from owl_model.url import URL
from utils.deserializer import SerDeser

from owl_model.team import Team

#TODO: make note in different request class about the difference between making
# requests at teams and teamsById and schedule and matchById. For example, when
# making a request at schedule it includes stages infromation and the individual
# matches do not have the list of players in the match object. But a call at the
# matchById endpoint includes much more information. Similar thing was observed
# for teams but need to go back and note and document that.

#TODO: should 'bootstrap_subclass()' and 'get_resource()' be hidden in the
# implementation somehow? Because although calling them doesn't 'break' anything
# it shouldn't really be explored

#TODO: should this extend url? How to make this class the best it can be is
# still a little fuzzy to me
class APIRequest(URL):
    """
    """
    baseurl = 'https://api.overwatchleague.com'
    endpoints = {
        'APIRequest': '',
        'TeamsRequest': '/teams',
        'TeamByIdRequest': '/team/{}',
        'schedule': '/schedule',
        'matchById': '/match/{}',
        'rankings': '/ranking'
    }

    cls_attr_types = {
        'theWorld': 'str'
    }
    cls_attr_map = {
        'theWorld': 'the world'
    }


    @classmethod
    def bootstrap_subclass(cls, data):
        # TODO: had to override the classmethod from URL because it was messing
        # with the deserialization. This is again something to take into
        # consideration if we want APIRequest to inherit from URL.
        return data


    @classmethod
    def makeapicall(cls):
        # TODO: still thinking if the class should use 'path' as the variable
        cls.path = cls.baseurl + cls.endpoints[cls.__name__]
        sd = SerDeser()
        return sd.deserialize(cls.get_resource(cls), cls)


    def __init__ (self, theWorld=None):
        """
        API request at the default endpoint
        """
        self.theWorld = theWorld


class TeamByIdRequest(APIRequest):
    """
    API request for a specifc team by ID
    """
    cls_attr_types = {
    }
    cls_attr_map = {
    }

    # TODO: would be convenient to allow making requests by teamname (as well as
    # an id) since people don't remember team id's off the top of their head
    @classmethod
    def makeapicall(cls, teamid=None):
        """
        """
        cls.path = cls.baseurl + cls.endpoints[cls.__name__]
        cls.path = cls.path.format(teamid)
        sd = SerDeser()
        return sd.deserialize(cls.get_resource(cls), Team)


    def __init__ (self):
        """
        """
        # TODO: the 'path' method was first here in the class __init__ method
        # but I then realized that this is a chicken and the egg problem since
        # in the deserializer the object is created. So the makeapicall class
        # method was instead made. The todo here is determine if this is the
        # final approach we should take
        pass


class TeamsRequest(APIRequest):
    """
    API request to the teams endpoing fetching all the teams in the league
    """
    cls_attr_types = {
        # This was the implementation before addint the bootstrap_subclass
        # method and was changed and now is commented out becasue it felt
        # awkward compared to the rest of the model interfaces.
        # For example to access the teams it would be
        #  league = sd.deserialize(r.content, TeamRequest)
        #  ...
        #  league.leagueteams[0]['competitor'] -> this is a owl_model.team.Team
        #'leagueteams': 'list[dict(str, owl_model.team.Team)]',
        'leagueteams': 'list[owl_model.team.Team]',
        'leaguedivisions': 'list[owl_model.team.Division]',
        'logo': 'owl_model.url.Logo'
    }
    cls_attr_map = {
        'leagueteams': 'competitors',
        'leaguedivisions': 'owl_divisions',
        'logo': 'logo'
    }

    @classmethod
    def bootstrap_subclass(cls, data):
        """
        The /teams request endpoint has the usually 'competitors' key indicating
        participating teams. However, the list contains another object before
        matching the structure of an owl_model.team.Team because there are two
        other keys. One being the 'division' key which is the same for all teams
        with this call. It looks like this is a division identifying the team as
        belonging to the game Overwatch and not a division within Overwatch.
        So as to make this 'competitors' list look like a team we have to modify
        list.
        """

        teams = []
        for team in data['competitors']:
            teams.append(team['competitor'])
        data['competitors'] = teams
        return data


    def __init__ (self, leagueteams=None, leaguedivisions=None):
        """
        """
        self.leagueteams = leagueteams
        self.leaguedivisions = leaguedivisions


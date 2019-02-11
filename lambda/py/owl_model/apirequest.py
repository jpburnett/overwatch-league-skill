
from owl_model.url import URL
from utils.deserializer import SerDeser

from owl_model.team import Team
from owl_model.league import League

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

    # TODO: the 'path' method was first here in the class __init__ method
    # but I then realized that this is a chicken and the egg problem since
    # in the deserializer the object is created. So the makeapicall class
    # method was instead made. The todo here is determine if this is the
    # final approach we should take

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
        pass


class TeamsRequest(APIRequest):
    """
    API request to the teams endpoing fetching all the teams in the league
    """
    cls_attr_types = {
    }
    cls_attr_map = {
    }

    @classmethod
    def makeapicall(cls):
        cls.path=cls.baseurl + cls.endpoints[cls.__name__]
        sd = SerDeser()
        return sd.deserialize(cls.get_resource(cls), League)

    def __init__ (self):
        """
        """
        pass

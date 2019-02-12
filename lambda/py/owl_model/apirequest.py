
from owl_model.modelobject import ModelObject

#TODO: should this extend url? How to make this class the best it can be is
# still a little fuzzy to me
class APIRequest(ModelObject):
    """
    """
    baseurl = 'https://api.overwatchleague.com'
    endpoints = {
        'teams': '/teams',
        'teamById': '/team/%s',
        'schedule': '/schedule',
        'matchById': '/match/%s',
        'rankings': '/ranking'
    }

class TeamRequest(APIRequest):
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


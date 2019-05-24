

from owl_model.modelobject import ModelObject

# TODO: Noted previously, the League was made after a decision to seperate the
# TeamsRequest (APIRequest) class from the model objects with information. The
# problem was that the APIRequest was returning a TeamsRequest object which
# would have all the APIRequest/URL methods which overwhelms the class and is
# really not necessariy. This is one approach
# However, another approach would be to better write the TeamsRequest (and other
# inherited APIRequest classes) to return objects in the model. For example, the
# TeamsRequest instead would parse the data and return a list of teams (e.g.,
# list[owl_model.team.Team] and other model objects.

class League(ModelObject):
    """
    Collection of all OWL Teams
    """
    # TODO: build a way to alias team names. Currently the team model has a
    # shortname attribute that is a 3 letter initial but sometimes we may like
    # to refer to the teams by spoken shorthand name e.g., Fuel, Fusion,
    # Uprising, etc (or at least we did before hand).

    teams_id_map = {
        '4523': 'Dallas Fuel',
        '4524': 'Philadelphia Fusion',
        '4525': 'Houston Outlaws',
        '4402': 'Boston Uprising',
        '4403': 'New York Excelsior',
        '4404': 'San Francisco Shock',
        '4405': 'Los Angeles Valiant',
        '4406': 'Los Angeles Gladiators',
        '4407': 'Florida Mayhem',
        '4408': 'Shanghai Dragons',
        '4409': 'Seoul Dynasty',
        '4410': 'London Spitfire',
        '7692': 'Chengdu Hunters',
        '7693': 'Hangzhou Spark',
        '7694': 'Paris Eternal',
        '7695': 'Toronto Defiant',
        '7696': 'Vancouver Titans',
        '7697': 'Washington Justice',
        '7698': 'Atlanta Reign',
        '7699': 'Guangzhou Charge'
    }

    cls_attr_types = {
        # This was the implementation before addint the bootstrap_subclass
        # method and was changed and now is commented out becasue it felt
        # awkward compared to the rest of the model interfaces.
        # For example to access the teams it would be
        #  league = sd.deserialize(r.content, TeamRequest)
        #  ...
        #  league.leagueteams[0]['competitor'] -> this is a owl_model.team.Team
        #'leagueteams': 'list[dict(str, owl_model.team.Team)]',
        'teams': 'list[owl_model.team.Team]',
        'divisions': 'list[owl_model.team.Division]',
        'logo': 'owl_model.url.Logo'
    }
    cls_attr_map = {
        'teams': 'competitors',
        'divisions': 'owl_divisions',
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


    def __init__ (self, teams=None, divisions=None):
        """
        """
        self.teams = teams
        self.divisions = divisions


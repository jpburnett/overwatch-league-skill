#!/usr/bin/python

from owl_model.modelobject import ModelObject

class Team(ModelObject):
    """
    An OWL team
    """
    # TODO: This approach seems to be working although sometimes unexpected
    # behavior happens when passing primitive types. For example, I think I
    # passed in 'string' instead of 'str' as a test and that wrong builtin type
    # did not phase anything. I got the right answer but that was unexpected.
    # This makes mer think the __deserialize method, while it does work, may be
    # more complicated than it may need be. The todo here is to investigate this
    cls_attr_types = {
        'id': 'str',
        'name': 'str',
        'players': 'list[owl_model.player.Player]',
        'schedule': 'list[owl_model.match.Match]',
        'ranking': 'dict(str, str)',
        'division': 'str',
        'hometown': 'str',
        'country': 'str',
        'shortname': 'str',
        'logo': 'owl_model.url.Logo',
        'logolrg': 'owl_model.url.Logo',
        'icon': 'owl_model.url.Icon',
        'colorA': 'str',
        'colorB': 'str'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'players': 'players',
        'schedule': 'schedule',
        'ranking': 'ranking',
        'division': 'owl_division',
        'hometown': 'homeLocation',
        'country': 'addressCountry',
        'shortname': 'abbreviatedName',
        'logo': 'logo',
        'logolrg': 'secondaryPhoto',
        'icon': 'icon',
        'colorA': 'primaryColor',
        'colorB': 'secondaryColor'
    }

    @classmethod
    def bootstrap_subclass(cls, data):
        """
        As written now the owl_model expects a list[owl_model.player.Players]
        and each owl_model.player.Player has a owl_model.player.PlayerInfo
        attribute.
        Requests to the OWL API with Team information is inconsistent in the way
        returns Team information. It does not always match this assumption
        (e.g., the /teams endpoint and 'players' are not even present in
        /match/id request).
        This bootstraps the team component to match the owl_model expectation.
        """
        # handle when no players are present in team info
        if not 'players' in data:
            return data
        # require that players match owl_model.player.Player
        players = []
        for player in data['players']:
            if 'team' in player.keys():
                # already matches expected PlayerInfo structure
                d = player
            else:
                # need to set up the structure
                d = {
                    'team': {'id': data['id'], 'type':'TEAM'},
                    'player': player,
                    'flags':[]
                    }
            players.append(d)
        data['players'] = players
        return data


    def __init__ (self, id=None, name=None, players=None, division=None,
                schedule=None, ranking=None, hometown=None, country=None,
                shortname=None, logo=None, logolrg=None, icon=None,
                colorA=None, colorB=None):
        self.id = id
        self.name = name
        self.players = players
        self.schedule = schedule
        self.ranking = ranking
        self.division = division
        self.hometown = hometown
        self.country = country
        self.shortname = shortname
        self.logo = logo
        self.logolrg = logolrg
        self.icon = icon
        self.colorA = colorA
        self.colorB = colorB


class Division(ModelObject):
    """
    A division is a logical group of teams that compete against eachother in the
    standings for an oppertunity at the playoffs.

    Right now the league consists of two major divisions (Atlantic and Pacific)
    and no subdivisions within these divisions.
    """
    cls_attr_types = {
        'id': 'str',
        'name': 'str',
        'shortname': 'str'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'shortname': 'abbrev'
    }


    def __init__ (self, id=None, name=None, shortname=None):
        """
        """
        self.id = id
        self.name = name
        self.shortname = shortname




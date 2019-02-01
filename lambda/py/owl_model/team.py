#!/usr/bin/python

from modelobject import ModelObject 

class Team(ModelObject):
    """
    An OWL team
    """

    cls_attr_types = {
    # TODO: This approach seems to be working although sometimes unexpected
    # behavior happens when passing primitive types. For example, I think I
    # passed in 'string' instead of 'str' as a test and that wrong builtin type
    # did not phase anything. I got the right answer but that was unexpected.
    # This makes mer think the __deserialize method, while it does work, may be
    # more complicated than it may need be. The todo here is to investigate this
        'id': 'str',
        'name': 'str',
        'players': 'list[owl_model.player.Player]',
        'division': 'str',
        'hometown': 'str',
        'country': 'str',
        'shortname': 'str',
        'logo': 'str',
        'icon': 'str',
        'logo': 'owl_model.url.Logo',
        'icon': 'owl_model.url.Icon',
        'colorA': 'str',
        'colorB': 'str'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'players': 'players',
        'division': 'owl_division',
        'hometown': 'homeLocation',
        'country': 'addressCountry',
        'shortname': 'abbreviatedName',
        'logo': 'logo',
        'icon': 'icon',
        'colorA': 'primaryColor',
        'colorB': 'secondaryColor'
    }


    def __init__ (self, id=None, name=None, players=None, division=str,
                hometown=None, country=None, shortname=None, logo=None,
                icon=None, colorA=None, colorB=None):
        self.id = id
        self.name = name
        self.players = players
        self.division = division
        self.hometown = hometown
        self.country = country
        self.shortname = shortname
        self.logo = logo
        self.icon = icon
        self.colorA = colorA
        self.colorB = colorB



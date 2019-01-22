#!/usr/bin/python

from modelobject import ModelObject 

class Team(ModelObject):
    """
    An OWL team
    """

    cls_attr_types = {
    # this seemed to be working although it said string makes  me think that the
    # __deserialize method is more complicated than it needs because giving the
    # wrong builtin type did not phase it.
        'id': 'str',
        'name': 'str',
        'players': 'list[owl_model.player.Player]',
        'division': 'str',
        'hometown': 'str',
        'country': 'str',
        'shortname': 'str',
        'logo': 'owl_model.URL',
        'icon': 'owl_model.URL',
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



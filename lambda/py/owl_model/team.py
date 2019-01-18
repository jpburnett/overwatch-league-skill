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
        'players': 'list[owl_model.player.Player]'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'players': 'players'
    }


    def __init__ (self, id=None, name=None, players=None):
        self.id = id
        self.name = name
        self.players = players




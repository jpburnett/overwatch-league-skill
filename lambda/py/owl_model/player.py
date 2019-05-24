#!/usr/bin/python

from owl_model.modelobject import ModelObject

class PlayerInfo(ModelObject):
    """
    """
    cls_attr_types = {
        'id': 'str',
        'name': 'str',
        'hometown': 'str',
        'firstname': 'str',
        'lastname' : 'str'#,
        #'metadata' : 'dict(str, owl_model.hero.Heros)'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'hometown': 'homeLocation',
        'firstname': 'givenName',
        'lastname': 'familyName'#,
        #'metadata': 'attributes'
    }


    def __init__ (self, id=None, name=None, hometown=None, firstname=None,
                     lastname=None, metadata=None):
        """
        """
        self.id = id
        self.name = name
        self.hometown = hometown
        self.firstname = firstname
        self.lastname = lastname
        self.metadata = metadata


class Player(PlayerInfo):
    """
    An OWL player
    """
    cls_attr_types = {
        'team': 'dict(str, str)',
        'info': 'owl_model.player.PlayerInfo'
        #'flags': 'object'
    }
    cls_attr_map = {
        'team': 'team',
        'info': 'player'
        #'metadata': 'flags'
    }

    def __init__ (self, team=None, info=None, metadata=None):
        self.team = team
        self.info = info
        self.metadata = metadata




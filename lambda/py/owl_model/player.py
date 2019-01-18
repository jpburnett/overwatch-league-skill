#!/usr/bin/python

from modelobject import ModelObject

class Player(ModelObject):
    """
    An OWL player
    """
    cls_attr_types = {
        'id': 'str',
        'name': 'str',
        'hometown': 'str',
        'firstname': 'str',
        'lastname' : 'str',
        'metadata' : 'dict()'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'hometown': 'homeLocation',
        'firstname': 'givenName',
        'lastname': 'familyName',
        'metadata': 'attributes'
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




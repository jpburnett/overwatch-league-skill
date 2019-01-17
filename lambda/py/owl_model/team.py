#!/usr/bin/python

class Team(object):

    cls_attr_types = {
        'id': 'string',
        'name': 'string'
    }
    cls_attr_map = {
        'id': 'id',
        'name': 'name'
    }


    def __init__ (self, id=None, name=None):
        self.id = id
        self.name = name

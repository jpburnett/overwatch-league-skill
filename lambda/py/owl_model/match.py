#!/usr/bin/python

from modelobject import ModelObject

class Match(ModelObject):
    """
    An OWL match
    """

    cls_attr_types = {
        'id': 'str',
        'teams': 'list[owl_model.team.Team]',
        'startdate': 'datetime',
        'enddate': 'datetime',
        'startTS': 'datetime',
        'endTS': 'datetime',
        'timezone': 'str'
    }
    cls_attr_map = {
        'id': 'id',
        'teams': 'competitors',
        'startdate': 'startDate',
        'enddate': 'endDate',
        'startTS': 'startDateTS',
        'endTS': 'endDateTS',
        'timezone': 'timeZone'
    }

    def __init__ (self, id=None, teams=None, startdate=None, enddate=None,
                    startTS=None, endTS=None, timezone=None):
        """
        """
        self.id = id
        self.teams = teams
        self.startdate = startdate
        self.enddate = enddate
        self.startTS = startTS
        self.endTS = endTS
        self.timezone = timezone






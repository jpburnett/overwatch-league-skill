#!/usr/bin/python

from owl_model.modelobject import ModelObject

class Match(ModelObject):
    """
    An OWL match
    """

    cls_attr_types = {
        'id': 'str',
        'teams': 'list[owl_model.team.Team]',
        'games': 'list[owl_model.game.Game]',
        'startdate': 'datetime',
        'enddate': 'datetime',
        'startTS': 'datetime',
        'endTS': 'datetime',
        'timezone': 'str'
    }
    cls_attr_map = {
        'id': 'id',
        'teams': 'competitors',
        'games': 'games',
        'startdate': 'startDate',
        'enddate': 'endDate',
        'startTS': 'startDateTS',
        'endTS': 'endDateTS',
        'timezone': 'timeZone'
    }

    def __init__ (self, id=None, teams=None, games=None, startdate=None,
                    enddate=None, startTS=None, endTS=None, timezone=None):
        """
        """
        self.id = id
        self.teams = teams
        self.games = games
        self.startdate = startdate
        self.enddate = enddate
        self.startTS = startTS
        self.endTS = endTS
        self.timezone = timezone



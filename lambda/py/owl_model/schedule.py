
from owl_model.modelobject import ModelObject

class Schedule(ModelObject):
    """
    """
    cls_attr_types = {
        'id': 'str',
        'stages': 'list[owl_model.schedule.Stage]',
        'startdate': 'datetime',
        'enddate': 'datetime',
        'endTS': 'datetime'
    }
    cls_attr_map = {
        'id': 'id',
        'stages': 'stages',
        'startdate': 'startDate',
        'enddate': 'endDate',
        'endTS': 'endDateMS'
    }

    @classmethod
    def bootstrap_subclass(cls, data):
        """
        """
        return data['data']

    def __init__ (self, id=None, stages=None, startdate=None, enddate=None,
                    endTS=None):
        """
        """
        self.id = id
        self.stages = stages
        self.startdate = startdate
        self.enddate = enddate
        self.endTS = endTS


class Stage(ModelObject):
    """
    """
    cls_attr_types = {
        'id': 'str',
        'slug': 'str', # what exactly is a slug?
        'name': 'str',
        'matches': 'list[owl_model.match.Match]',
        'weeks': 'list[owl_model.schedule.Week]'
    }
    cls_attr_map = {
        'id': 'id',
        'slug': 'slug',
        'name': 'name',
        'matches': 'matches',
        'weeks': 'weeks'
    }


    def __init__ (self, id=None, slug=None, name=None, matches=None,
                    weeks=None):
        """
        """
        self.id = id
        self.slug = slug
        self.name = name
        self.matches = matches
        self.weeks = weeks


class Week(ModelObject):
    """
    """
    cls_attr_types = {
        'id': 'str',
        'startTS': 'datetime',
        'endTS': 'datetime',
        'name': 'str',
        'matches': 'list[owl_model.match.Match]'
    }
    cls_attr_map = {
        'id': 'id',
        'startTS': 'startDate',
        'endTS': 'endDate',
        'name': 'name',
        'matches': 'matches'
    }


    def __init__ (self, id=None, startTS=None, endTS=None, name=None,
                    matches=None):
        """
        """
        self.id = id
        self.startTS = startTS
        self.endTS = endTS
        self.name = name
        self.matches = matches






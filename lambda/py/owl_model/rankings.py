from owl_model.modelobject import ModelObject

class Rankings(ModelObject):
    """ The Rankings Model for OWL """

    cls_attr_types = {
        'ranks': 'list[owl_model.rankings.Rank]',
        'totalmatches': 'int',
        'matchesconcluded': 'int',
        'playoffcutoff': 'int'

    }

    cls_attr_map = {
        'ranks': 'content',
        'totalmatches': 'totalMatches',
        'matchesconcluded': 'matchesConcluded',
        'playoffcutoff': 'playoffCutoff'
    } 

    def __init__ (self, ranks=None, totalmatches=None, matchesconcluded=None,
            playoffcutoff=None):
        """
        """
        self.ranks = ranks
        self.totalmatches = totalmatches
        self.matchesconcluded = matchesconcluded
        self.playoffcutoff = playoffcutoff

class Rank(ModelObject):
    """ Model for a Ranking from the Ranking endpoint """
    cls_attr_types = {
        'team' : 'owl_model.team.Team',
        'placement': 'str',
        'advantage': 'str',
        'record' : 'owl_model.rankings.Record'
    }
    cls_attr_map = {
        'team': 'competitor',
        'placement': 'placement',
        'advantage': 'advantage',
        'record': 'records'
    }

    def __init__ (self, team=None, placement=None, advantage=None, record=None):
        """
        """
        self.team = team
        self.placement = placement
        self.advantage = advantage
        self.record = record



class Record(ModelObject):
    """ Model for the Record of a team """

    cls_attr_types = {
        'matchwin': 'str',
        'matchloss': 'str',
        'matchdraw': 'str',
        'matchbye': 'str',
        'gamewin': 'str',
        'gameloss': 'str',
        'gametie': 'str',
        # TODO: implement the comparisons list
    }

    cls_attr_map = {
        'matchwin': 'matchWin',
        'matchloss': 'matchLoss',
        'matchdraw': 'matchDraw',
        'matchbye': 'matchBye',
        'gamewin': 'gameWin',
        'gameloss': 'gameLoss',
        'gametie': 'gameTie'
    }

    @classmethod
    def bootstrap_subclass(cls, data):
        """
        The records object in the OWL API is a list of one dictionary object.
        Return that single object to be a record
        """
        return data[0]

    def __init__ (self, matchwin=None, matchloss=None, matchdraw=None, matchbye=None,
                    gamewin=None, gameloss=None, gametie=None):
        """
        """
        self.matchwin = matchwin
        self.matchloss = matchloss
        self.matchbye = matchbye
        self.gamewin = gamewin
        self.gameloss = gameloss
        self.gametie = gametie



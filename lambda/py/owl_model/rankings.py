from owl_model.modelobject import ModelObject

class Rankings(ModelObject):
    """ The Rankings Model for OWL """

    cls_attr_types = {
        'id' : 'str',
        'name': 'str',
        'placement': 'str',
        'advantage': 'str',
        'records': 'list[owl_model.rankings.Record]'
    }

    cls_attr_map = {
        'id': 'id',
        'name': 'name',
        'placement': 'placement',
        'advantage': 'advantage'
    } 
    
    @classmethod
    def bootstrap_subclass(cls, data):
        """
        """
        return data['data']

    def __init__ (self, id=None, name=None, placement=None, advantage=None,
                    records=None):
        """
        """
        self.id = id
        self.name = name
        self.placement = placement
        self.advantage = advantage
        self.records = records

class Record(ModelObject):
    """ Model for the Record of a team """

    cls_attr_types = {
        'matchWin': 'str',
        'matchLoss': 'str',
        'matchDraw': 'str',
        'matchBye': 'str',
        'gameWin': 'str',
        'gameLoss': 'str',
        'gameTie': 'str'
    }

    cls_attr_map = {
        'matchWin': 'matchWin',
        'matchLoss': 'matchLoss',
        'matchDraw': 'matchDraw',
        'matchBye': 'matchBye',
        'gameWin': 'gameWin',
        'gameLoss': 'gameLoss',
        'gameTie': 'gameTie'
    }

    def __init__ (self, matchWin=None, matchLoss=None, matchDraw=None, matchBye=None,
                    gameWin=None, gameLoss=None, gameTie=None):
        """
        """
        self.matchWin = matchWin
        self.matchLoss = matchLoss
        self.matchBye = matchBye
        self.gameWin = gameWin
        self.gameLoss = gameLoss
        self.gameTie = gameTie
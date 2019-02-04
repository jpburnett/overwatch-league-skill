
from owl_model.modelobject import ModelObject

class Game(ModelObject):
    """
    An OWL game

    A match in OWL is a best-of-X competition where two teams play X games and
    the winner of the match is considered to be the team winning the majority of
    the games.
    """

    cls_attr_types = {
        'id': 'str',
        'map': 'owl_model.map.Map',
        'vod': 'owl_model.url.Vod',
        'players': 'list[owl_model.player.Player]',
        'state': 'str',
        'status': 'str',
        #stats : TODO: watch this field closely, this seems new.
        'matchid': 'dict(str, str)'
    }
    cls_attr_map = {
        'id': 'id',
        'map': 'attributes',
        'vod': 'vodLink',
        'players': 'players',
        'state': 'state',
        'status': 'status',
        #'stats': 'stats',
        'matchid': 'match'
    }

    def __init__ (self, id=None, map=None, vod=None, players=None,
                state=None, status=None, matchid=None):
        """
        """
        self.id = id
        self.map = map
        self.vod = vod
        self.players = players
        self.state = state
        self.status = status
        self.matchid = matchid

    def finalize_init (self):
        """
        """
        self.matchid = self.matchid['id']





from owl_model.modelobject import ModelObject

class Map(ModelObject):
    """
    An OWL map

    A map in Overwatch in many ways is synonymous with the term "game" because
    playing map comes with different objective goals. There are 4 different map
    types that determine the objective for victory.
    """

    cls_attr_types = {
        'name': 'str',
        'id': 'str',
        'type': 'str'
    }
    cls_attr_map = {
        'name': 'map',
        'id': 'mapGuid',
        'type': 'type'
    }

    map_type_discriminator = {
        'junkertown': 'escort',
        'dorado': 'escort',
        'route-66': 'escort',
        'gibraltar': 'escort',
        'rialto': 'escort',
        'havana': 'escort',
        'hanamura': 'assault',
        'volskaya': 'assault',
        'temple-of-anubis': 'assault',
        'horizon-lunar-colony': 'assault',
        'paris': 'assault',
        'kings-row': 'hybrid',
        'numbani': 'hybrid',
        'hollywood': 'hybrid',
        'eichenwalde': 'hybrid',
        'blizzard-world': 'hybrid',
        'nepal': 'control',
        'ilios': 'control',
        'lijiang-tower': 'control',
        'oasis': 'control',
        'busan': 'control',
    }

    def __init__ (self, id=None, name=None, type=None):
        """
        """
        self.id = id
        self.name = name
        self.type = type

    def finalize_init (self):
        """
        """
        if self.name is not None:
            self.type = self.map_type_discriminator[self.name]




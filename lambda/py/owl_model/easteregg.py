
from owl_model.modelobject import ModelObject

class EasterEgg(ModelObject):
    """
    The Easter Egg in the API
    """
    cls_attr_types = {
        'theWorld': 'str'
    }
    cls_attr_map = {
        'theWorld': 'the world'
    }

    def __init__ (self, theWorld=None):
        """
        API request at the default endpoint
        """
        self.theWorld = theWorld



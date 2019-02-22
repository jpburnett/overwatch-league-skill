from owl_model.modelobject import ModelObject

class Standings(ModelObject):
    """ The Standings Model for OWL """

    cls_attr_types = {
        'ranks' : 'dict(dict())'
    }

    cls_attr_map = {
        'ranks': 'ranks'
    } 
    
    @classmethod
    def bootstrap_subclass(cls, data):
        """
        """
        return data['data']

    def __init__ (self, ranks=None):
        """
        """
        self.ranks = ranks

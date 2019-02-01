#!/usr/bin/python

import six
import pprint

class ModelObject(object):
    """
    Base model class all other model classes inherit from
    """

    def to_dict (self):
        """
        returns the model as a dictionary
        """
        # In the last reincarnation of this file (before I was dumb and rm -rf
        # everything...) I remember having a really neat idea about using the
        # built in __dict__ method and automatically generating classes and a
        # different approach at this method... but I am drawing a blank...
        # TODO: figure out what I am talking about above
        res = {}

        for attr, _ in six.iteritems(self.cls_attr_types):
            v = getattr(self, attr)

            # model attribute is a list of other objects
            if isinstance(v, list):
                res[attr] = list(map(lambda x: x.to_dict()
                    if hasattr(x, "to_dict") else
                    x, v))

            # attribute is a model type
            elif hasattr(v, "to_dict"):
                res[attr] = v.to_dict()

            # attribute is a dict of other objects
            elif isinstance(v, dict):
                res[attr] = dict(map( lambda i:
                    (i[0], i[1].to_dict()) if hasattr(i[1], "to_dict") else
                    i, v.items() ))
            else:
                res[attr] = v

        return res


    def to_str (self):
        """
        Convert the model to have a string representation for printing
        """
        return str(self.__class__) + " " + pprint.pformat(self.to_dict())


    # TODO: pass some sort of flag to print additional parameters that are
    # included in the deserializatino but are not built into the model 
    def __repr__ (self):
        """
        Overload builtin print method
        """
        return self.to_str()


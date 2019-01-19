#!/usr/bin/python

import json
import importlib
from datetime import date, datetime
from six import iteritems

class SerDeser(object):
    """
    """

    TYPES = (float, int, bool, bytes)
    TYPES_MAP = {
        'float': float,
        'int': int,
        'str': str,
        'bool': bool,
        'date': date,
        'datetime': datetime,
        'object': object
    }

    def deserialize(self, payload, cls_type):
        """
        """

        if payload is None:
            return None

        try:
            payload = json.loads(payload)
        except Exception:
            print("Could not parse : {}".format(payload))

        return self.__deserialize(payload, cls_type)


    def __deserialize(self, payload, cls_type):
        """
        """

        try:
            # nothing to do
            if payload is None:
                return None

            # If the class type is a data structure/string load the class
            if type(cls_type) == str:
                if cls_type.startswith('list['):
                    cls_collection = re.match('list\[(.*)\]').group(1)
                    cls_collection = cls_collection.split(',')

                    deser_cls_list = []
                    for sub_payload, cls in zip(payload, cls_collection):
                        deser_cls_list.append(self.__deserialize(
                                                sub_payload, cls.strip()))
                    return deser_cls_list

                if cls_type.startswith('dict('):
                    # TODO: fill should work similar to the list segment above
                    pass

                if cls_type in self.TYPES_MAP:
                    cls_type = self.TYPES_MAP[cls_type]
                else:
                    # load class from name
                    #cls_type = self.__load_class_from_name(cls_type)
                    import_list = cls_type.rsplit('.', 1)

                    # class lives in another module on the path
                    if import_list > 1:
                        module_name = import_list[0]
                        cls_name = import_list[1]
                        module = importlib.import_module(module_name, cls_name)

                        cls_type = getattr(module, cls_name)
                    # class is in the current module
                    else:
                        cls_name = import_list[0]
                        cls_type = getattr(sys.modules[__name__], cls_name)

            # cls_type is now a class object begin to deserialize

            #TODO: handle other cls_types (e.g., datetimes)
            # deserialize from a built-in ype
            if cls_type in self.TYPES:
                # TODO: handle encoding, type and value error exceptions
                return cls_type(payload) 

            # else deserialize from an model class
            elif hasattr(cls_type, 'cls_attr_types') and \
                    hasattr(cls_type, 'cls_attr_map'):

                attr_types = cls_type.cls_attr_types
                attr_map = cls_type.cls_attr_map

                model_cls= cls_type()
                for cls_attr, payload_param in iteritems(attr_map):
                    if payload_param in payload:
                        setattr(model_cls, cls_attr,
                                self.__deserialize(payload[payload_param],
                                                   attr_types[cls_attr]))

                add_attr = [attr for attr in payload
                                if attr not in attr_map.values()]

                for attr in add_attr:
                    setattr(model_cls, attr, payload[attr])

                return model_cls
            # could not be further deserialized
            else:
                return payload

        except Exception as e:
            print("ERROR: deserialization error...")
            print("ERROR: " + str(e))


# Simple test case
if __name__=="__main__":
    import requests
    import sys

    from team import Team

    owlurl = "https://api.overwatchleague.com"
    teams = "/teams"

    r = requests.get(owlurl+teams)
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    d = json.loads(r.content)

    competitors = d['competitors']

    sd = SerDeser()

    team = sd.deserialize(json.dumps(competitors[0]['competitor']), Team)
    
    print(team)




#!/usr/bin/python

import json
import importlib
import re
from dateutil import parser
from datetime import datetime
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
                    cls_collection = re.match('list\[(.*)\]', cls_type).group(1)
                    # isntead of doing a standard .split(',') be more careful to
                    # allow embedded objects (e.g., list[dict(...),...])
                    cls_collection = re.findall('list\[.*\]|dict\(.*\)|[a-zA-Z][^,]*',
                                                    cls_collection)

                    deser_cls_list = []
                    if len(cls_collection) > 1:
                        for sub_payload, cls in zip(payload, cls_collection):
                            deser_cls_list.append(self.__deserialize(
                                                    sub_payload, cls.strip()))
                    else:
                        for sub_payload in payload:
                            deser_cls_list.append(self.__deserialize(
                                                    sub_payload,
                                                    cls_collection[0].strip()))
                    return deser_cls_list

                if cls_type.startswith('dict('):
                    cls_dict_type = re.match(
                        'dict\(([^,]*), (.*)\)', cls_type).group(2)

                    return { k : self.__deserialize(v, cls_dict_type)
                                for k, v in iteritems(payload) }

                if cls_type in self.TYPES_MAP:
                    cls_type = self.TYPES_MAP[cls_type]
                else:
                    # load class from name
                    cls_type = self.__load_cls_from_name(cls_type)

            # cls_type is now a class object begin to deserialize

            # deserialize from a built-in ype
            if cls_type in self.TYPES:
                # TODO: handle encoding, type and value error exceptions
                return cls_type(payload) 

            elif cls_type == datetime:
                if type(payload) == str:
                    return parser.parse(payload)
                elif type(payload) == int:
                    # timestamps are in miliseconds since epoch
                    return datetime.fromtimestamp(payload/1000.0)
                else:
                    raise Exception()
                    return None

            # else deserialize from an model class
            elif hasattr(cls_type, 'cls_attr_types') and \
                    hasattr(cls_type, 'cls_attr_map'):
                # promote payload to match object notation (i.e., want class
                # behavior but payload is a primitive type)
                if hasattr(cls_type, 'bootstrap_subclass'):
                    payload = cls_type.bootstrap_subclass(payload)

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

                if hasattr(cls_type, 'finalize_init'):
                    model_cls.finalize_init()

                return model_cls
            # could not be further deserialized
            else:
                return payload

        except Exception as e:
            print("ERROR: deserialization error...")
            print("ERROR: " + str(e))


    def __load_cls_from_name(self, cls_type_as_str):
        try:
            import_list = cls_type_as_str.rsplit('.', 1)
            # class lives in another module on the path
            if len(import_list) > 1:
                module_name = import_list[0]
                cls_name = import_list[1]
                module = importlib.import_module(module_name, cls_name)
                cls_type = getattr(module, cls_name)
            # class is in the current module
            else:
                cls_name = import_list[0]
                cls_type = getattr(sys.modules[__name__], cls_name)

            return cls_type

        except Exception as e:
            print("Error in __load_cls_from_name method:", e)


# Simple test case
if __name__=="__main__":
    import requests
    import sys

    owlurl = "https://api.overwatchleague.com"
    teams = "/teams"
    schedule = "/schedule"
    match = "/match"

    sd = SerDeser()

    # exampl how to work with a single team from a request of all teams
    from owl_model.team import Team
    r = requests.get(owlurl+teams)
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    d = json.loads(r.content)
    competitors = d['competitors']

    team = sd.deserialize(json.dumps(competitors[0]['competitor']), Team)

    # test a fetch on an individual team
    teamId = '/4523'
    r = requests.get(owlurl + teams + teamId)
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    dal = sd.deserialize(r.content, Team)

    # example for how to work with a single match from a full schedule
    from owl_model.match import Match
    r = requests.get(owlurl+schedule)
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    d = json.loads(r.content)
    stages = d['data']['stages']
    m = sd.deserialize(json.dumps(stages[0]['matches'][0]), Match)

    # test a fetch on an individual match
    r = requests.get(owlurl+match+'/21271')
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    m2 = sd.deserialize(r.content, Match)

    # Example to fetch and get full teams request parse
    from owl_model.apirequest import TeamRequest
    r = requests.get(owlurl+teams)
    if r.status_code != 200:
        print("Error getting request from the OW API server...")

    league = sd.deserialize(r.content, TeamRequest)



#!/usr/bin/python

from modelobject import ModelObject
import requests

# TODO: For the URL class I was considering not having subclasses because
# there could potentially be too many different subclasses to maintain
# (e.g., Links, Logos, Icons, Accounts like facebook, twitter). However, I
# was stuck trying to figure out how initialize. One idea I had was to have
# possibly a third class dictionary type that acts sort of a a discriminator
# map. The todo item here is to reconsider this approach and revisit the
# idea of discriminators

class URL(ModelObject):

    cls_attr_types = {
        'cls_type': 'str',
        'path': 'str'
    }
    cls_attr_map = {
        'type': 'cls_type',
        'path': 'path'
    }


    def __init__ (self, cls_type=None, path=None):
        """
        """
        self.cls_type= cls_type 
        self.path = path 


    @classmethod
    def bootstrap_subclass(cls, data):
        """
        bootstrap data by promoting to a dictionary because we want class
        behaviour but the payload received in the request doesn't support
        identifying as an object (e.g., The specifc example is that from the OWL
        API we don't receive the response
          {..., 'url' : {'logo' : 'https://...'}, ... }
        We instead receive
          {..., 'logo' : 'https://...'}, ... }
        However there are differnt types of URLs we receive and want to know
        functionality what type it is but also generally abstract out the
        common comes with a URL like Get-ing the resource

        Note that in looking for this type of adjustment violates the serializer
        being a general use serializer unless the method generalizes possible
        cases.
        """

        return { cls.__name__.lower() : data }


    def get_resource(self):
        """
        GET the resources data at 'path'
        """
        try:
            print('fetching:', self.path)
            r = requests.get(self.path)
            if r.status_code != 200:
                print('raising exception...')
                raise Exception()
        except Exception as e:
            print('ERROR: getting URL resource failed')

        return r.content

class Logo(URL):
    """
    """

    cls_attr_types = {
        'path': 'str'
    }
    cls_attr_map = {
        'path': 'logo'
    }

    def __init__ (self, path=None):
        """
        """

        self.path=path

class Icon(URL):
    """
    """

    cls_attr_types = {
        'path': 'str'
    }
    cls_attr_map = {
        'path': 'icon'
    }

    def __init__ (self, path=None):
        """
        """

        self.path=path

 

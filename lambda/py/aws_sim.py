
import sys, os
import importlib

from ask_sdk_core.serialize import DefaultSerializer
from ask_sdk_model.request_envelope import RequestEnvelope
from ask_sdk_model.context import Context

sd = DefaultSerializer()

# TODO: I think the smart thing to build a test bench would be to go through all
# the handlers and just look for a file in some predetermined location and a
# file with the name of the function with a json extension.
#   e.g., def LaunchRequestHandler: ==> ../sampleEvents/LaunchRequest.json
# Then if someone wanted different names for the files they would have to
# specify a dictionry below. To quickly get the that information I think it
# would be able to come from the generated language model that the online
# creator makes. But there is away to do it by going through the model and
# looking at it's parent class. 

samples_path = 'utils/sampleEvents'
sample_events = {
    'LaunchRequest': '/LaunchRequestEvent.json',
    'HelpIntent': '/helpIntent.json',
    'GetNextMatchIntent': '/getNextMatchEvent.json',
    'GetNextTeamMatchIntent': '',
    'GetTeamRecordIntent': '/getTeamRecordEvent.json',
    'GetTodaysMatchesIntent': '/getTodaysMatchesEvent.json',
    'GetTomorrowsMatchesIntent': '/getTomorrowsMatchesEvent.json',
    'GetStandingsIntent': '/getStandingsEvent.json',
    'GetTopTeamIntent': '/getTopTeamEven.json',
    'GetNextTeamMatchIntent': '/getNextTeamMatchEvent.json'
}

def get_file_contents(fname):
    if not os.path.exists(fname):
        print("ERROR: {} does not exist".format(fname))
        sys.exit()
    with open(fname, 'r') as f:
        fdata = f.read() 

    return fdata


# TODO: Don't understand to what extent context should be used. Hence the not
# being required to load a default context
def load_context(fname=None):
    if not fname:
       fname = '../../alexasim/context.json'

    raw_request = get_file_contents(fname)
    context = sd.deserialize(raw_request, Context)
    return context


def load_request_from_template(fname):
    raw_request = get_file_contents(fname)
    request_envelope = sd.deserialize(raw_request, RequestEnvelope)
    return request_envelope
 

# TODO: Need to figure out a way to look for the handler, how does aws do it?
def load_skill(module_name):
    try:
        module = importlib.import_module(module_name)
        if not hasattr(module, 'sb'):
            raise Exception('Requested module has no `sb` member')
        skill = getattr(module, 'sb')
        return skill

    except Exception as e:
        print("Error loading requested module {}:".format(module_name), e)


if __name__=="__main__":

    args = sys.argv[1:]

    if len(args) == 0:
        print("Error: simulation module not specified")
        sys.exit()

    if len(args) > 1:
        print("Error: too many args")
        sys.exit()

    skill_builder = load_skill(args[0])
    s = skill_builder.create()

    #request_fname = 'utils/sampleEvents/HelloWorldLaunchRequest.json'

    #context = load_context()
    #request_envelope = load_request_from_template(request_fname)

    #response = skill.invoke(request_envelope, context)
    #print(response)


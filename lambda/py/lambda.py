import sys, inspect

# Amazon/Alexa Imports
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import (
    AbstractRequestHandler, AbstractExceptionHandler,
    AbstractRequestInterceptor, AbstractResponseInterceptor)

# Other imports
import owl_skill.request_handlers
import owl_skill.exception_handlers
import owl_skill.interceptors

# Skill Builder Object
sb = SkillBuilder()

# Register intent request handlers
cls_members = inspect.getmembers(owl_skill.request_handlers, inspect.isclass)
for member in cls_members:
    cls = member[1]
    if issubclass(cls, AbstractRequestHandler) and \
      cls is not AbstractRequestHandler:
        sb.add_request_handler(cls())

# Register exception handlers
cls_members = inspect.getmembers(owl_skill.exception_handlers, inspect.isclass)
for member in cls_members:
    cls = member[1]
    if issubclass(cls, AbstractExceptionHandler) and \
      cls is not AbstractExceptionHandler:
        sb.add_exception_handler(cls())

# request interceptors
cls_members = inspect.getmembers(owl_skill.interceptors, inspect.isclass)
for memeber in cls_members:
    cls = memeber[1]
    if issubclass(cls, AbstractRequestInterceptor) and \
      cls is not AbstractRequestInterceptor:
        sb.add_global_request_interceptor(cls())
    if issubclass(cls, AbstractResponseInterceptor) and \
      cls is not AbstractResponseInterceptor:
        sb.add_global_response_interceptor(cls())


lambda_handler = sb.lambda_handler()

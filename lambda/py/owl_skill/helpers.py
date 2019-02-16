
import random

# =====================================================================
# Helper Functions
# =====================================================================

# Function to grab a random entry from a list
def getRandomEntry(inputList):
    """Gets a random entry from a list"""
    randomEntry = random.choice(list(inputList))
    return inputList[randomEntry]



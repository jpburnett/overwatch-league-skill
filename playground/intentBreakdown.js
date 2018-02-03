//
// Breaking down how the RecipeIntent function works
//

// The user 'intent' is registered as a handler by the Alexa object. The handler
// object is a dictionary of key-value pair where the key indicates the requested
// intent and the value is the action to take with that user intent.
// A code analogy of this process could be considered as a C/C++ switch statement.
'RecipeIntent': function () {
        // The following syntax is a nifty tool. I am uncertain of the correct
        // vernacular but in JS all objects can be considered a JSON/dictionary
        // tree of key value pairs and so the dot-notaion is a short-cut to accessing
        // the value of say the python equivalent bracket accessor (i.e.,
        // in Node dicrionary.key = dictionary['key'])

        // Therefore, being completely verbose as to what I mean here,the following
        // line is equivalent to: this['event']['request']['intent']['slots']['Item'].
        // There fore the objec that the keyword 'this' referes to has the structure.
        const itemSlot = this.event.request.intent.slots.Item;
        let itemName;

        // Now, with the dot notation behavior described, this allows for this control
        // statement to make more sense. Because, if the field in the dot-notation
        // accessor string is not present the JS equivalent of 'null' or 'empty' is
        // returned. (which I think is represented by the word 'undefined'?)

        // So if itemSlot and if itemSlot['value'] is not empty we have a valid
        // item we can get. 
        if (itemSlot && itemSlot.value) {
            itemName = itemSlot.value.toLowerCase();
        }

        const cardTitle = this.t('DISPLAY_CARD_TITLE', this.t('SKILL_NAME'), itemName);
        const myRecipes = this.t('RECIPES');
        const recipe = myRecipes[itemName];

        if (recipe) {
            this.attributes.speechOutput = recipe;
            this.attributes.repromptSpeech = this.t('RECIPE_REPEAT_MESSAGE');

            this.response.speak(recipe).listen(this.attributes.repromptSpeech);
            this.response.cardRenderer(cardTitle, recipe);
            this.emit(':responseReady');
        } 
        else {
            let speechOutput = this.t('RECIPE_NOT_FOUND_MESSAGE');
            const repromptSpeech = this.t('RECIPE_NOT_FOUND_REPROMPT');
            if (itemName) {
                speechOutput += this.t('RECIPE_NOT_FOUND_WITH_ITEM_NAME', itemName);
            } 
            else {
                speechOutput += this.t('RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME');
            }
            speechOutput += repromptSpeech;

            this.attributes.speechOutput = speechOutput;
            this.attributes.repromptSpeech = repromptSpeech;

            this.response.speak(speechOutput).listen(repromptSpeech);
            this.emit(':responseReady');
        }
/**
 * Created by sagar.gohil on 18-04-2017.
 */

var restify = require('restify');
var builder = require('botbuilder');
var dateFormat = require('dateformat');
var o = require('odata');
var poData = [];

const {Wit, log} = require('node-wit');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: '96dfe8c2-7b02-4cbd-a77b-53b89fa8c108',
    appPassword:'oan4dMEcTWgadx4s2cyo3Pu'
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var Enum = require('enum');
var rootFlow = new Enum(['payment', 'issue','Yes','No','Reset', 'StartGreeting'],{ignoreCase:true});
const client = new Wit({accessToken: 'OMA6J3GMQV43OCFXKIA3QKP7BJQCFDBT'});

var userAddress= {};

/*
var recognizer = new builder.LuisRecognizer('https://eastus2.api.cognitive.microsoft.com/luis/v2.0/apps/e52f3664-4bf6-4ca4-8c47-70a64301a866?subscription-key=8a9e130238094022b9fd0f71e02df48b&timezoneOffset=0&verbose=true&q=');
bot.recognizer(recognizer);
*/

// On Error
bot.on('error', function(message) {
    console.log('[error] called'+message);
});

bot.on('conversationUpdate', function (message) {
    console.log("Called Conversation updated");
    if (message.membersAdded && message.membersAdded.length > 0) {
        var isSelf = false;
        var membersAdded = message.membersAdded
            .map(function (m) {
                isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');
        if (!isSelf) {
            console.log("not self");
            bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + membersAdded + "! How can I help you?"));
            bot.beginDialog(message.address,'/');
        }
    }
});

Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
};



// Root dialog for entry point in application
bot.dialog('/', [
    function (session,args, next) {
        result = args || {};
        if (result == undefined || result.response == undefined) {
            userAddress = session.message.address;
            session.send("Welcome! \n\n You are in hackathon world. \n\n" + session.message.user.name + " there is Innojam event happening in our town");
            builder.Prompts.text(session, "would you like to register?");
        }
        /*else if (result.response == "NU") {
            builder.Prompts.text(session, "Please try again");
        }*/
    },
    function (session, results) {
        client.message(results.response, {}).then((data) => {
            var intentData = data.entities.intent != undefined ? data.entities.intent[0] : {};
            if (rootFlow.No.is(intentData.value)) {
                session.beginDialog('/ConversationEnd');
            }
            else {
                session.beginDialog('/UserRegistration');
            }
        })
            .catch(console.error);
    },
    function (session,results) {

    }
]);

bot.dialog('/UserRegistration',[
    function (session,args,next) {
        builder.Prompts.text(session, "Sure! may i know your employee id please?");
    },
    function (session,results,next) {
        // results.response will have employee Id from user
        session.send(session.message.user.name + ', your registration is confirmed with us.\n\n we will update you for further processes.');
        session.beginDialog('/ConversationEnd');
    }
]);

bot.dialog('/ConversationEnd',[
    function (session) {
        session.conversationData  = {};
        session.send('Thank you so much for visiting :)');
        session.endDialog();
    }
]);
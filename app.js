/**
 * Created by sagar.gohil on 18-04-2017.
 */

var restify = require('restify');
var builder = require('botbuilder');
var dateFormat = require('dateformat');
var o = require('odata');
var https = require('https');
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
var rootFlow = new Enum(['payment', 'issue','Yes','No','Reset', 'StartGreeting','EmployeeData'],{ignoreCase:true});
const client = new Wit({accessToken: 'OMA6J3GMQV43OCFXKIA3QKP7BJQCFDBT'});

var commonAddress= {};

/*
var recognizer = new builder.LuisRecognizer('https://eastus2.api.cognitive.microsoft.com/luis/v2.0/apps/e52f3664-4bf6-4ca4-8c47-70a64301a866?subscription-key=8a9e130238094022b9fd0f71e02df48b&timezoneOffset=0&verbose=true&q=');
bot.recognizer(recognizer);
*/

// On Error
bot.on('error', function(message) {
    console.log('[error] called'+message);
});


// ConversationUpdate action
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
            /*bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + membersAdded + "! How can I help you?"));*/
            bot.beginDialog(message.address,'/');
        }
    }
});

// Root dialog for entry point in application
bot.dialog('/', [
    function (session,args, next) {
        result = args || {};
        if (result == undefined || result.response == undefined) {
            if(commonAddress !== undefined || commonAddress==={}) {
                var commonAddress = session.message.address;
            }
            console.log(JSON.stringify( session.message.address));
            session.send("Hey "+session.message.user.name+", Welcome to Innojam!");
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
        builder.Prompts.text(session, "Sure! May i know your employee id please?");
    },
    function (session,results,next) {
        var userSpecificAddress = session.message.address.user;

        ValidateEmployeeId(session, results.response, function (data,isValidated) {
            session.dialogData.data = data;
            session.dialogData.isValidated = isValidated;
            if (data === undefined || data.name == undefined) {
                if (isValidated === true) {
                    // call service to update user registration
                    RegisterUser(userSpecificAddress, response);

                    session.send(session.message.user.name + ', your registration is confirmed.');
                    session.beginDialog('/ConversationEnd');
                }
                else {
                    session.send("you can only register for yourself, try again with your employee id");
                    builder.Prompts.text(session, "Please enter valid employee id");
                }
            }
            else {
                session.send("Provided employee id not found");
                builder.Prompts.text(session, "Please enter valid employee id");
            }
        })
    },
    function (session,results,next) {
        var userSpecificAddress = session.message.address.user;
        if(session.dialogData.isValidated === false) {
            ValidateEmployeeId(session, results.response, function (data,isValidated) {
                session.dialogData.data = data;
                session.dialogData.isValidated = isValidated;
                if (data === undefined || data.name == undefined) {
                    if (isValidated === true) {
                        // call service to update user registration
                        RegisterUser(userSpecificAddress, response);

                        session.send(session.message.user.name + ', your registration is confirmed.');
                        session.beginDialog('/ConversationEnd');
                    }
                    else {
                        session.send("Please try again with valid details!");
                        session.beginDialog('/ConversationEnd');
                    }
                }
                else {
                    session.send("Please try again with valid details!");
                    session.beginDialog('/ConversationEnd');
                }
            })
        }
        else {
            next();
        }
    },
    function (session,results) {

    }
]);

function ValidateEmployeeId(session,response,cb) {
    // results.response will have employee Id from user

    /*const client = new Wit({accessToken: 'OMA6J3GMQV43OCFXKIA3QKP7BJQCFDBT'});
     client.message(results.response, {}).then((data) => {

     })
     .catch(console.error);*/
    GetUserDetails(response,function (data) {
        var userFullName = data.name;
        var userNameArray = data.name.split(" ");
        var IsValidated = true;
        if(userNameArray.length>2) {
            userFullName = userNameArray[0] + " " + userNameArray[2];
        }
        if(session.message.user.name.toLowerCase() === userFullName.toLowerCase())
        {
            IsValidated = true;
        }
        else
        {
            IsValidated = false;
        }
        cb(data,IsValidated);
    });
}

bot.dialog('/ConversationEnd',[
    function (session) {
        session.conversationData  = {};
        session.send('Thank you so much for visiting :)');
        session.endDialog();
    }
]);

function RegisterUser(userAddress,EmployeeId) {
    'use strict';
    var options = {
        "host": "https://bcone-chatbot.firebaseio.com/",
        "path": "/" + EmployeeId + "/.json?auth=0HY0myMya6iF18GcQ4ahwhx6dS9VWFUJ4ootQo8u",
        "method": "PATCH",
        "headers": {
            "Content-Type": "application/json"
        }
    }
   var body = JSON.stringify({
       userAdress: userAddress,
       registered: true
   });
    https.request(options, (response) => {
        response.on('data', (chunk) => { body += chunk })
        response.on('end', () => {
        })
    }).end(body);
}

function GetUserDetails(employeeId,cb) {
    'use strict';
    const endpoint = "https://bcone-chatbot.firebaseio.com/" + employeeId + "/.json?auth=0HY0myMya6iF18GcQ4ahwhx6dS9VWFUJ4ootQo8u"; // ENDPOINT GOES HERE
    console.log(endpoint);
    var body = "";
    https.get(endpoint, (response) => {
        response.on('data', (chunk) => {
            body += chunk
        })
        response.on('end', () => {
            var data = JSON.parse(body)
            // console.log("data : " + JSON.stringify(data));
            cb(data);
        })
    })
}
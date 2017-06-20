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
/*bot.on('conversationUpdate', function (message) {
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
            /!*bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + membersAdded + "! How can I help you?"));*!/
            //bot.beginDialog(message.address,'/');
        }
    }
});*/

// Root dialog for entry point in application
bot.dialog('/', [
    function (session,args, next) {
        result = args || {};
        if (result == undefined || result.response == undefined) {
            if (commonAddress !== undefined || commonAddress === {}) {
                var commonAddress = session.message.address;
            }
            //sendEmail();
            //session.send(JSON.stringify( session.message.address));
            console.log(JSON.stringify(session.message.address));
            session.send("Hey " + session.message.user.name.split(" ")[0] + ", Welcome to Innojam!");
            builder.Prompts.text(session, "Would you like to register?");

            //bot.send(new builder.Message().address(new IAddress '{"id":"0dac75a3-ede5-4c31-af5e-b95cb3791d85","channelId":"skypeforbusiness","user":{"id":"aditya.das@bcone.com","name":"Aditya Das"},"conversation":{"isGroup":true,"id":"NWYwNmJkY2Ijc2lwOmlubm9qYW1ib3RAYnJpc3RsZWNvbmVvbmxpbmUub25taWNyb3NvZnQuY29t"},"bot":{"id":"sip:innojambot@bristleconeonline.onmicrosoft.com","name":"sip:innojambot@bristleconeonline.onmicrosoft.com"},"serviceUrl":"https://webpoolsg20r04.infra.lync.com/platformservice/tgt-0b9142c259f65d3b918b34dd29074ee2/botframework"}'));
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
        session.endDialog();
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
            if (data !== undefined && data !== null) {
                if (data.registered === false) {
                    if (isValidated === true) {
                        // call service to update user registration
                        RegisterUser(userSpecificAddress, results.response);

                        session.send(session.message.user.name.split(" ")[0] + ', your registration is confirmed.');
                        session.beginDialog('/ConversationEnd');
                    }
                    else {
                        session.send("You can only register for yourself, try again with your employee id");
                        builder.Prompts.text(session, "Please enter valid employee id");
                    }
                }
                else {
                    session.beginDialog('/AlreadyRegistered');
                }
            }
            else {
                session.send("Provided employee id not found");
                builder.Prompts.text(session, "Please enter valid employee id");
            }
        })
    },
    function (session,results,next) {
        if (results.response === "NA") {
            next();
        }
        else {
            var userSpecificAddress = session.message.address.user;
            if (session.dialogData.isValidated === false) {
                ValidateEmployeeId(session, results.response, function (data, isValidated) {
                    session.dialogData.data = data;
                    session.dialogData.isValidated = isValidated;
                    if (data !== undefined || data !== null) {
                        if (isValidated === true) {
                            // call service to update user registration
                            RegisterUser(userSpecificAddress, results.response);

                            session.send(session.message.user.name.split(" ")[0] + ', your registration is confirmed.');
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
        }
    },
    function (session,results) {
        session.endDialog();
    }
]);

bot.dialog('/AlreadyRegistered',[
    function (session) {
        session.send(session.message.user.name.split(" ")[0] + ', you are already registered.');
        builder.Prompts.text(session,"Do you need any help?");
    },
    function (session,results) {
        client.message(results.response, {}).then((data) => {
            var intentData = data.entities.intent != undefined ? data.entities.intent[0] : {};
            if (rootFlow.No.is(intentData.value)) {
                session.beginDialog('/ConversationEnd');
            }
            else {
                session.beginDialog('/help');
            }
        })
            .catch(console.error);
    },
    function (session,results) {
        session.endDialogWithResult({response: "NA"});
    }
]);

bot.dialog('/help',[
    function (session) {
        session.send("Please contact this person for any queries \n\nName : Siddharth Bajaj \n\nEmail : siddharth.bajaj@bcone.com");
        session.beginDialog('/ConversationEnd');
    }
]);

function ValidateEmployeeId(session,response,cb) {
    // results.response will have employee Id from user

    /*const client = new Wit({accessToken: 'OMA6J3GMQV43OCFXKIA3QKP7BJQCFDBT'});
     client.message(results.response, {}).then((data) => {

     })
     .catch(console.error);*/
    GetUserDetails(response,function (data) {
        var IsValidated = false;
        if(data !== null && data !==undefined) {
            var userFullName = data.name;
            var userNameArray = data.name.split(" ");

            if (userNameArray.length > 2) {
                userFullName = userNameArray[0] + " " + userNameArray[2];
            }
            if (session.message.user.name.toLowerCase() === userFullName.toLowerCase()) {
                IsValidated = true;
            }
            else {
                IsValidated = false;
            }
        }
        cb(data,IsValidated);
    });
}

bot.dialog('/ConversationEnd',[
    function (session) {
        session.send('Thank you so much for visiting :)');
        session.endDialogWithResult({response: "NA"});
    }
]);

function RegisterUser(userAddress,EmployeeId) {
    'use strict';
    var options = {
        "host": "bcone-chatbot.firebaseio.com",
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

//send email code for AWS SES service
/*function sendEmail(ToEmailAddress) {
    'use strict';
    var aws = require('aws-sdk');
    var ses = new aws.SES({
        region: 'us-east-1'
    });

    var eParams = {
        Destination: {
            ToAddresses: ['sagar.gohil@bcone.com'] //email id of person who is trying to register
        },
        Message: {
            Body: {
                Text: {
                    Data: "Sagar, you have been registered for the InnoJam event. Best of Luck!"
                }
            },
            Subject: {
                Data: "Registered for Innojam event ✔"
            }
        },
        Source: 'hashim.kahily@bcone.com'  //email id of the sender
    };

    var email = ses.sendEmail(eParams, function(err, data){
        if(err) {
            console.log("Email error : " + err);
        }
        else {
            console.log("===EMAIL SENT===");
            console.log(data);
            console.log("EMAIL CODE END");
            console.log('EMAIL: ', email);
        }
    });

}*/

// send mail through node mailer library
function sendEmail(toEmailAddress) {

    var nodemailer = require('nodemailer');

// Create the transporter with the required configuration for Outlook
// change the user and pass !
    var transporter = nodemailer.createTransport({
        host: "smtp.office365.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
            ciphers:'SSLv3'
        },
        auth: {
            user: 'sagar.gohil@bcone.com',
            pass: 'Chinu@123'
        }
    });

// setup e-mail data, even with unicode symbols
    var mailOptions = {
        from: '"Sagar Gohil"<sagar.gohil@bcone.com>', // sender address (who sends)
        to: toEmailAddress, // list of receivers (who receives)
        subject: 'Registered for InnoJam ✔', // Subject line
        text: 'Hello world ', // plaintext body
        html: 'Dear <b></b>Sagar,</b><br><br> you have been registered for the Innojam event. Best of Luck!' // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log("error from emailer : "+error);
        }

        console.log('Message sent: ' + info.response);
    });

}
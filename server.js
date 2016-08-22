////////////////////////////////////////////
// server.js
var express = require('express');
var app = express();
var path = require('path'),
    fs = require('fs');
    moment = require('moment');

// function to encode file data to base64 encoded string
function file_base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function file_base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

var testJson=
 '{\
    "sender" : [\
        {\
            "ID":"yoonhwan.ko@gmail.com",\
            "PWD":"xlglkzwzwqpmmsiv"\
        },\
        {\
            "ID":"yoonhwan.ko@gmail.com",\
            "PWD":"ggoggo07#@"\
        }\
    ],\
    "reciver" : "yoonhwan.ko@neowiz.com;yoonhwan.ko@gmail.com",\
    "replyTo" : "yoonhwan.ko@neowiz.com",\
    "subject" : "test subject",\
    "text" : "test text"\
 }';

var send = require('gmail-send')({
                                 user: '',               // Your GMail account used to send emails
                                 pass: '',             // Application-specific password
                                 to:   '"User" <yoonhwan.ko@neowiz.com>',      // Send back to yourself
                                 // from:   '"User" <user@gmail.com>'  // from: by default equals to user
                                 // replyTo:'user@gmail.com'           // replyTo: by default undefined
                                 subject: 'test subject',
                                 text:    'test text'
                                 // html:    '<b>html text text</b>'
                                 });

app.get('/wines', function(req, res) {
    res.send([{name:'wine1'}, {name:'wine2'}]);
});
app.get('/wines/:id', function(req, res) {
    res.send({id:req.params.id, name: "The Name", description: "description"});
});

app.get('/sendmail/:id', function(req, res) {
        
    var now = moment();
    var file = now.format('x')+'.png';        // File to attach
    
    var recive_params = JSON.parse(new Buffer(req.query.data, 'base64').toString('utf8'));//JSON.parse(testJson);
    var senderID = 0;
    var senderIDMax = recive_params['sender'].length-1;
    
    var sendmail = function (sender, reciver, replyTo, subject, text, file, cb){
        
        console.log(sender['ID'] + ":" + reciver + ":" + replyTo);
        // Override any default option and send email
            send({
                 subject: subject,
                 text: text,
                 to: reciver,
                 replayTo: replyTo,
                 files: [file],                // String or array of strings of filenames to attach
                 
                 user: sender['ID'],
                 pass: sender['PWD'],
                 },
                 function (err, res) {
                     cb(err);
                 }
                 );

        };
        
    var callback = function(err) {
        if(err)
        {
            if(senderID != senderIDMax)
            {
                senderID += 1;
                sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['replyTo'], recive_params['subject'], recive_params['text'], file, callback);
            }else   {
                res.send("send fail");
            }
        }else  {
        
            fs.unlink(file);
            res.send("send success");
        
        
        }
    }
     
        
        
    if (('raw' in recive_params))
    {
        //save image
        fs.writeFile(file, recive_params['raw'], 'base64', function(err) {
                                if(err){
                                    console.log(err);
                                }else{
                                    sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['replyTo'], recive_params['subject'], recive_params['text'], file, callback);
                                }
                            });
    }else
    {
        res.send("image raw not found");
    }
        
//    res.send("send finish to :"+req.query.to);
});
 
app.listen(3000);
console.log('Express Listening on port 3000...');
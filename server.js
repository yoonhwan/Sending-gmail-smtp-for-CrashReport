////////////////////////////////////////////
// server.js
var express = require('express');
var app = express();
var path = require('path'),
    fs = require('fs');
    moment = require('moment');
var email 	= require('emailjs/email');

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

function mail_server(id, pwd, smtp, ssl) {
    const option_server = {
    user: id,
    password: pwd,
    host: smtp,//'mailneo.ds.neowiz.com',
    ssl: ssl//false
    };
    return email.server.connect(option_server);
}

var testJson=
 '{\
    "sender" : [\
        {\
            "ID":"yoonhwan.ko@gmail.com",\
            "PWD":""\
        },\
        {\
            "ID":"yoonhwan.ko@gmail.com",\
            "PWD":""\
        }\
    ],\
    "reciver" : "yoonhwan.ko@neowiz.com;yoonhwan.ko@gmail.com",\
    "from" : "yoonhwan.ko@neowiz.com",\
    "subject" : "test subject",\
    "text" : "test text"\
 }';

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
    
    var sendmail = function (sender, reciver, from, subject, text, file, cb){
        
        console.log(sender['ID'] + ":" + reciver + ":" + from);
        // Override any default option and send email
        var message= {
        text:	text,
        from:	from,
        to:		reciver,
        subject:	subject
        };
    
        if(file)
        {
            message= {
                text: text,
                from:	from,
                to:		reciver,
                subject:	subject,
                attachment:
                [
                 {path:file, type:"image/png", name:file}
                 ]
            };
        
            console.log(message);
        
        }
        
        mail_server(sender['ID'], sender['PWD'], sender['smtp'], sender['ssl']).send(message, function (err, message) {
                                                                        if(err) {
                                                                            cb(err || message);
                                                                            console.log(err || message);
                                                                        }else
                                                                            cb('');
             }
         );

        };
        
    var callback = function(err) {
        if(err)
        {
            if(senderID != senderIDMax)
            {
                senderID += 1;
                sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['from'], recive_params['subject'], recive_params['text'], file, callback);
            }else   {
                res.send("send fail : " || err);
                if(file)
                    fs.unlink(file);
            }
        }else  {
        
            if(file)
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
                                    sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['from'], recive_params['subject'], recive_params['text'], file, callback);
                                }
                            });
    }else
    {
        file = '';
        console.log("image raw not found");
        sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['from'], recive_params['subject'], recive_params['text'], file, callback);
    }
        
//    res.send("send finish to :"+req.query.to);
});
 
app.listen(3000);
console.log('Express Listening on port 3000...');

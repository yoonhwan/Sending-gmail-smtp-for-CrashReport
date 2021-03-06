////////////////////////////////////////////
// server.js
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true,
                              limit: '50mb'
                              }));

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
            "id":"yoonhwan.ko@gmail.com",\
            "pwd":""\
        },\
        {\
            "id":"yoonhwan.ko@gmail.com",\
            "pwd":""\
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

app.post('/sendmail/:id', function(req, res)   {
    var recive_params;
    if(req.body && req.body.data && req.body.data.length >0)
        recive_params = JSON.parse(new Buffer(req.body.data, 'base64').toString('utf8'));
    else    {
        console.log("crashreport reponse err : parameter data error");
        res.send("data error");
        return;
    }
         
    RunMailProcess(recive_params, res);
});

app.get('/sendmail/:id', function(req, res) {
        
    var recive_params;
    if(req.query.data && req.query.data.length >0)
        recive_params = JSON.parse(new Buffer(req.query.data, 'base64').toString('utf8'));//JSON.parse(testJson);
    else    {
        console.log("crashreport reponse err : parameter data error");
        res.send("data error");
        return;
    }
        
    RunMailProcess(recive_params, res);

});

function RunMailProcess(data, res)  {
    var now = moment();
    var file = now.format('x')+'.png';        // File to attach
    
    console.log("crashreport recv " + now.format('YYYY-MM-DD HH:MM:SS'));
    
    var recive_params = data;
    
    var senderID = 0;
    var senderIDMax = recive_params['sender'].length-1;
    
    var sendmail = function (sender, reciver, from, subject, text, file, cb){
        
//        console.log(sender['id'] + ":" + reciver + ":" + from);
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
        
//            console.log(message);
        
        }
        
        mail_server(sender['id'], sender['pwd'], sender['smtp'], sender['ssl']).send(message, function (err, message) {
                                                                        if(err) {
                                                                            cb(err || message);
                                                                            console.log(err || message);
                                                                            console.log(sender['id'] + " : " + sender['smtp'] + ":" + sender['ssl']);
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
                res.send("send fail : " + err);
                if(file)
                    fs.unlink(file);
        
                console.log("crashreport reponse err : " + err);
        
            }
        }else  {
        
            if(file)
                fs.unlink(file);
            res.send("send success");
        
            console.log("crashreport reponse");
        }
    }
     
        
        
    if (('raw' in recive_params))
    {
        //save image
        fs.writeFile(file, recive_params['raw'], 'base64', function(err) {
                                if(err){
//                                    console.log(err);
                                }else{
                                    sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['from'], recive_params['subject'], recive_params['text'], file, callback);
                                }
                            });
    }else
    {
        file = '';
//        console.log("image raw not found");
        sendmail(recive_params['sender'][senderID], recive_params['reciver'], recive_params['from'], recive_params['subject'], recive_params['text'], file, callback);
    }
        
//    res.send("send finish to :"+req.query.to);
}
 
//app.listen(3000);
//console.log('Express Listening on port 3000...');
app.listen(38320);
console.log('Express Listening on port 38320...');

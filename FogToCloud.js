
'use strict';
// Using MQTT protocol to send telemetry from edge to cloud
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString;
var Message = require('azure-iot-device').Message;

// File System to read Files from 
var fs = require('fs');
var internetAvailable = require("internet-available");
var config = JSON.parse(fs.readFileSync('config.json','utf8'));

var connectionString = config['DeviceConnectionString'];
var WebSocket = require('ws');
var ws ;

var events = require('events');
var eventEmitter = new events.EventEmitter(); 

var internet = false ;  

function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
};

function checknet () {
internetAvailable({
            timeout: 500,
            retries: 2,
            }).then(function(){
           // console.log("Internet available");
            internet = true; 
    
            }).catch(function(){
               console.log("No internet");
               internet = false;
       });

 return internet;
} ; 



var client = clientFromConnectionString(connectionString);

function connect () {
	
ws = new WebSocket("ws://localhost:2012/");

ws.on('open', function() {
	console.log('Established connection to web Socket');
 	ws.send(JSON.stringify({
    "Cmd": "RequestEventValuesUpdate",
    "data": {
        "sourceFilter": [
            "Rheidiant",
            "Catwalk",
            "CBM"
        ],
        "ignoreFunctionNamesContaining": [
            "FeIdNf_PeIdNf"
        ]
    }
}));
});

var valueArray = [] ,JSONdata, tempstr  , DeviceId , tempJSON = {} , distictDevices = [], tempValueJSON = {}, finalAarrayJSON = [] , rawDataMessage  ;

ws.on('message', function(data, flags) {
	console.log('it is running');
	JSONdata = JSON.parse(data).data;
	finalAarrayJSON = [];
	valueArray = [] ; 
	
	for ( var i in  JSONdata ){
		tempstr = JSONdata[i].functionName.split("_") ;
		tempJSON["deviceId"] = tempstr[0] + '_' + tempstr[1] ; 
		tempJSON["functionName"] = tempstr[2];
		tempJSON["rawVal"] = JSONdata[i].rawVal; 
		//console.log( 'console log of tempJSON'+ JSON.stringify( tempJSON ) ) ;
		if ( distictDevices.indexOf(tempstr[0] + '_' +  tempstr[1]) == -1 ){ 
			distictDevices.push(tempstr[0] + '_' + tempstr[1]);
		}
		valueArray.push( { "deviceId" : tempstr[0] + '_' + tempstr[1] , "functionName" :  tempstr[2] ,  "rawVal" :  JSONdata[i].rawVal } ); 
	}
	/*
	for ( i in valueArray ) {
		//console.log( 'pushing array Values' + JSON.stringify(valueArray[i])); 
	}
	*/
	for ( var i in distictDevices ) { 
		// console.log( 'pushing Sistinct Device'); 
		finalAarrayJSON.push( { "deviceId" : distictDevices[i]  } ) ; 
	}
	
	for ( var i in valueArray ) {
		// console.log( 'pushing array Values' + JSON.stringify(valueArray[i])); 
		for (var j in finalAarrayJSON ) {
			// console.log( finalAarrayJSON[j].deviceId + '===' + valueArray[i].deviceId );
			if ( finalAarrayJSON[j].deviceId === valueArray[i].deviceId ) {
				//console.log('inserting in final' + valueArray[i]["functionName"]  );
				finalAarrayJSON[j][ valueArray[i]["functionName"] ] = valueArray[i]["rawVal"];
			}
		}
	}
	
	if( checknet() == true ) {
		for (var i in finalAarrayJSON ) {
			rawDataMessage = new Message( JSON.stringify ( finalAarrayJSON[i] ));
			client.sendEvent( rawDataMessage, printResultFor('send'));
		}
		
	}
	
	
	
   // console.log(finalAarrayJSON);
   /*console.log( JSON.stringify( valueArray ) ) ; */
 }
);

ws.on('error' , function() {
	
} ); 

ws.on('close' , function() {
	console.log('reconnecting ');
	setTimeout( connect , 10000) ; 
});
	
	
}

connect();


var connectCallback = function (err) {
  if (err) {
    console.log('Could not connect: ' + err);
eventEmitter.emit('connectToIoTHub');
return ;
  } else {
    console.log('Client connected');
  }
  return;
  // Create a message and send it to the IoT Hub every second
  //console.log('About to call getlatestValues method ');
  //getLatestValues();
  //console.log( 'get latest Values Method finished calling') ;
};

eventEmitter.on('connectToIoTHub', function(){
//console.log('Connection to Even from event Emitter ');
connectionString = config['DeviceConnectionString'];
client.open(connectCallback);
});

client.open(connectCallback);



setInterval( function(){ 
		try { 
		if(ws.readyState === WebSocket.OPEN) { 
			ws.send(JSON.stringify({
                "Cmd": "RequestEventValuesUpdate",
                "data": {
                   "sourceFilter": [
                   "Rheidiant",
                   "Catwalk",
                   "CBM"
                ],
			"ignoreFunctionNamesContaining": [
            "FeIdNf_PeIdNf"
        ]
    }
}));
		}
	}
    catch(e){
		
	} 		
	} , 1000 ) ; 


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
	
		for (var i in finalAarrayJSON ) {
				/* write code to save to file system */
				/**************************************/
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

// once in every one second make call to this function to send message from websocket

setInterval( function(){ 
		try { 
		if(ws.readyState === WebSocket.OPEN && checknet() == true ) { 
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



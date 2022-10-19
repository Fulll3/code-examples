//GENERAL -----------------------------------------------------------------------------------------------------------
var serviceName = 'TestBOTANICA.xsjs';
var userId = $.session.getUsername();
var step;


///////////////////////////////////////////
function validateLength(value, nLength){
	var length = value.length;
	if (length > nLength){
		$.response.setBody("An error has occurred. Please contact the application responsible.");
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		
		return false;
	}
	
	return true;
}

function healthCheck(value){
    if(value.toLowerCase()=="healthcheck"){
        $.response.status = $.net.http.OK;
        $.response.setBody("OK");
        
        return true;
    }
    
    return false;
}

function handle() {     
            "use strict";     
            var s = {};
            var row = {};
            var result = [];            

            var aParams = {}, name, value,i;
            var content = $.request.body.asString();
            
        	for (i = 0; i < $.request.parameters.length; ++i) {
        		name = $.request.parameters[i].name;
        		value = $.request.parameters[i].value;
        		switch (name) {       		
        			case "PARAMS" : aParams.params = value;
        			break;        		
        		}
        	} 
        	
        	if (
        	  validateLength(content, 5000) &&
        	  validateLength(aParams.params, 1300) &&
        	  !healthCheck(aParams.params)
        	) {
        	
            	var split =  aParams.params.split("|");
                
                var conn = $.hdb.getConnection();
                
                
                var q;
                            q = aParams.SQL;
                            var rsQ ;
                            rsQ = conn.executeQuery(content, ...split);
                            
                            
                            for (var i = 0; i < rsQ.length; i++) {
                                       row = {};
                                       row = rsQ[i];
                                       result.push(row)
                            }
    
                s.result = result;
    
                $.response.status = $.net.http.OK;
                $.response.contentType = "application/json";
                $.response.setBody(JSON.stringify(s));
        	}

}

//END OF SERVICE LOGIC

/*
* Hilfsfunktion zur Gleichbehandlung von GET und POST
*/
function handleGET() {
          handle();
//            $.response.status = $.net.http.OK;
}

/*
* Hilfsfunktion zur Gleichbehandlung von GET und POST
*/
function handlePOST() {
            handle();
}

//main entry

try {
            switch ($.request.method) {
            case $.net.http.GET:
                        handleGET();
                        break;
            case $.net.http.POST:
                        handlePOST();
                        break;
            default:
                        $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
            }
} catch (err) {
            $.response.setBody(err.toString());
			//$.response.setBody("An error has occurred. Please contact the application responsible.");
            $.response.status = $.net.http.INTERNAL_SERVER_ERROR;
}


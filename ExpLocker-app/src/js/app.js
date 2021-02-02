let count_carrier_request=0;
App = {
 web3Provider: null,
 contracts: {},
 names: new Array(),
 url: 'http://127.0.0.1:7545',
 // network_id: 5777,
 chairPerson: null,
 currentAccount: null,
 AccessPointRequestData:{},
 count:1,
 zero:"0x0000000000000000000000000000000000000000",
 ownerPassword:"CSE426526",
  // Init - 0; StartClientAction - 1; pickByDriver - 2; pickByClient - 3; Done - 4
 ExpPhase: {
  "0": "Initing",
  "1": "Waiting for Client Action",
  "2": "Pick By Driver",
  "3": "Self-Pickup",
  "4": "Action End"
},
 init: function () {
   console.log("Checkpoint 0");
   return App.initWeb3();
 },
 initWeb3: function () {
   // Is there is an injected web3 instance?
   if (typeof web3 !== 'undefined') {
     App.web3Provider = web3.currentProvider;
   } else {
     // If no injected web3 instance is detected, fallback to the TestRPC
     App.web3Provider = new Web3.providers.HttpProvider(App.url);
   }
   web3 = new Web3(App.web3Provider);
   ethereum.enable();
   return App.initContract();
 },
 initContract: function () {
   $.getJSON("ExpLocker.json", function (data) {
     // Get the necessary contract artifact file and instantiate it with truffle-contract
     var voteArtifact = data;
     App.contracts.vote = TruffleContract(voteArtifact);
     App.contracts.mycontract = data;
     // Set the provider for our contract
     App.contracts.vote.setProvider(App.web3Provider);
     App.currentAccount = web3.eth.coinbase;
     //App.getCurrentPhase();
     App.getPhase();
     App.getChairperson();
     $('#current-address').val(App.currentAccount);
     if($('#Package-Today').length){
       let currentStatus;
       App.contracts.vote.deployed().then(function(instance) {
        return instance.clientStatus(App.currentAccount);
      }).then(function(result) {
        console.log(result[0]);
        if(result[0]==true){
          currentStatus="True";
        }
        else{
          currentStatus="False";
        }
        $('#Package-Today').val(currentStatus);
      })
     }
     //return App.populateCarrierDetails();
     //handle when switching account from meta mask send user back to index.html page
    //  var account = web3.eth.accounts[0];
    //  var accountInterval = setInterval(function() {
    //    if (web3.eth.accounts[0] !== account) {
    //      account = web3.eth.accounts[0];
    //      window.location.replace('index.html')
    //    }
    //  }, 100);
     return App.populateCartDetails();
   });
 },
 populateCartDetails:function(){
  if($('#carrier-tabel').length){
  App.contracts.vote.deployed().then(function(instance) {
    return instance.returnArray(App.currentAccount);
  }).then(function(result) {
    console.log(result[1]==App.zero)
    for(let i=0;i<result.length;i++){
      if(result[i]!=App.zero){
        $("#carrier-tabel tbody").append('<tr><th scope="row">'+App.count+'</th><td>'+result[i]+'</td></tr>')
        App.count++;
      }
    }
  })
}
if($('#queue_table').length){
  App.contracts.vote.deployed().then(function(instance) {
    return instance.tableLength();
  }).then(function(res){
    for(let i=0;i<res['c'][0];i++){
      App.contracts.vote.deployed().then(function(instance){
        return instance.requestingTable(i)
      }).then(function(result){
        console.log(result)
        let tips=result[0]['c']/10000
        let clinet= result[1]
        let s=result[2]['c']
        let status;
        if(s==2){status="Accepted"}
        else if(s==3){status="Cancelled"}
        else if(s==4){status="Delivered"}
        else{status="Pending"}
        let driver=result[3];
        $("#queue_table tbody").append('<tr><th scope="row">'+tips+'</th><td>'+clinet+'</td><td>'+status+'</td><td>'+driver+'</td></tr>')
      })
    }
  })
}
$.get("/countMaking",function(data,status){
  if(status=="success"){
    console.log(data.Count)
    if($('#couting').length){
      $('#couting').val(data.Count);
  }
  }
});
  //  $.get("/RedeliveryRequesting",function(data,status){
  //    if(status=="success"){
  //      if($('#queue_table').length){
  //      App.AccessPointRequestData=data;
  //      console.log(App.AccessPointRequestData);
  //      for(d in data){
  //        let Detail=data[d];
  //        $("#queue_table tbody").append('<tr><th scope="row">'+Detail.Tips+'</th><td>'+Detail.ClientAddress+'</td><td>'+Detail.Status+'</td><td>'+Detail.DriverAddress+'</td></tr>')
  //      }
  //    }
  //    }
  //  });
   return App.lockerEvent();
 },
 getPhase:function(){
  if($('#Current-Phase').length){
  App.contracts.vote.deployed().then(function(instance) {
    return instance.currentPhase(App.currentAccount);
  }).then(function(result) {
    let current=result['c'][0];
    let currentText=(App.ExpPhase[current]);
    $('#Current-Phase').val(currentText)
    // App.currentPhase = result;
    // var notificationText = App.auctionPhases[App.currentPhase];
    // console.log(App.currentPhase);
    // console.log(notificationText);
    // $('#phase-notification-text').text(notificationText);
    // console.log("Phase set");
  })
}
 },
 lockerEvent:function(){
   //owner
   $(document).on('click', '#location-assign', App.handleSetLocationLocker);
   //Register
   //$(document).on('click', '#ExpLocker-Register', App.handleRegister);
   $(document).on('click', '#ExpLocker-Register', App.handleRegister);
   //owner login
   $(document).on('click', '#login-owner', App.handleOwnerLogin);
   //user login
   $(document).on('click', '#Login', App.handleUserLogin);
   //client function
   $(document).on('click', '#requestToAP', App.handleRequestAccessPoint);
   $(document).on('click', '#requestPick', App.handleRequestPick);
   $(document).on('click', '#cancelPick', App.handleRequestCancelPick);
   $(document).on('click', '#requestLocationPin', App.handleLocationPin);
   $(document).on('click', '#requestAPLocation', App.handleRequestAPLocation);
   $(document).on('click', '#requestRedelivery', App.handleRequestRedelivery);
   $(document).on('click', '#cancel-redelivery', App.handleCancelRedelivery);
   $(document).on('click', '#driver-info-client', App.handleRequestDriverInfo);
   $(document).on('click', '#recieved-package', App.handleRecieved);
   //driver function
   $(document).on('click', '#accept', App.handleAcceptRequest);
   $(document).on('click', '#client-info', App.handleRequestClientInfo);
   $(document).on('click', '#location-pin-driver', App.handleLocationPin);
   $(document).on('click', '#picked-up', App.handlePackagePicked);
   $(document).on('click', '#delivered-client', App.handlePackageDelivered);
   //carrier function
   $(document).on('click', '#carrier-assign', App.handleCarrierAssign);
   $(document).on('click', '#delivered-access', App.handleCarrierDelivered);
   //all people function
   $(document).on('click', '#withdraw', App.handleWithdraw);
 },
 getChairperson: function () {
   App.contracts.vote.deployed().then(function(instance) {
     return instance.chair();
   }).then(function(result) {
     App.chairPerson = result;
   })
   // App.contracts.vote.deployed().then(function(instance) {
   //   return instance.user(App.currentAccount);
   // }).then(function(result) {
   //   console.log(result['c'][0]);
   // })
 },

 handleOwnerLogin: function(event){ //handle chair person login
   let passwd = document.getElementById('owner-password').value;
   if(passwd == App.ownerPassword){ //the password
     if(App.currentAccount!==App.chairPerson){
       App.showNotification("You have no premission to enter", 5);} //make sure its chair person
     else{window.location.replace("Owner.html")} //if is chair person bring to chair person interface
   } else {
    App.showNotification("Wrong password", 5);
    event.preventDefault();
    event.stopPropagation();
   }
 },
 handleSetLocationLocker:function(event){//chair person set access point location
   let location=$('#owner-locker-location').val();
   App.contracts.vote.deployed().then(function (instance) {
     return instance.setLocation(location);
   }).then(function(result){
     if (result&&parseInt(result.receipt.status) == 1) {
       App.showNotification("Set Location Successfully", 4);
     } else {
       App.showNotification("Error during Setting", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Setting", 5);
   });
 },
 handleUserLogin:function(event){ //handle user login
   let whichUser=0; //will get which type of user in current account
   let password=$('#inputPassword').val();
   App.contracts.vote.deployed().then(function (instance) {
     return instance.checkPassword(password);
   }).then(function (result) {
     if (result){
       App.contracts.vote.deployed().then(function (instance){
           return instance.user(App.currentAccount);
       }).then(function (result){
           console.log(result);
           whichUser=parseInt(result['c'][0]) //get current user type
           if(whichUser==1){ //if current user == client then bring to client interface
             window.location.replace('client-interface.html')
           }
           else if(whichUser==2){
             window.location.replace('driver-interface.html')
           }
           else if(whichUser==3){
             window.location.replace('carrier-interface.html')
           }
           // else{ //Have not resigster yet.
           //   App.showNotification("Please register", 5);
           // }
         })      
     }
     else{
       App.showNotification("Wrong Password", 5);
    }
   })
   // App.contracts.vote.deployed().then(function(instance) {
   //   return instance.user(App.currentAccount);
   // }).then(function(result) {
   //   console.log(result);
   //   let pwd=$("#Password").val();
   //   if(App.users[App.currentAccount]==pwd){
   //   whichUser=parseInt(result['c'][0]) //get current user type
   //   if(whichUser==1){ //if current user == client then bring to client interface
   //     window.location.replace('client-interface.html')
   //   }
   //   else if(whichUser==2){
   //     window.location.replace('driver-interface.html')
   //   }
   //   else if(whichUser==3){
   //     window.location.replace('carrier-interface.html')
   //   }
   //   // else{ //Have not resigster yet.
   //   //   App.showNotification("Please register", 5);
   //   // }
   // }
   // else{
   //    App.showNotification("Wrong Password", 5);
   // }
   // })
 },
 handleRegister: function (event) { //let user register
   let name="";
   let address="";
   let liscence="";
   let pwd=""
   let role=0;
   var selectedValue = document.getElementById("Role").value;
   if(selectedValue=="Client"){
     role=1;
   }
   else if(selectedValue=="Driver"){
     role=2;
   }
   if(selectedValue=="Carrier"){
     role=3;
   }
   name=$("#Name").val();
   name=encrypt(name); //encryption
   if($("#HomeAddress").val()!=NaN){
     address=$("#HomeAddress").val();
     address=encrypt(address);
   }
   if($("#LiscenceNumber").val()!=NaN){
     liscence=$("#LiscenceNumber").val()
     liscence=encrypt(liscence);
   }
   pwd=$("#Password").val();
   console.log(role,name,address,liscence,pwd);
   App.contracts.vote.deployed().then(function (instance) {
       return instance.register(role,name,address,liscence,pwd);
     })
     .then(function (result) {
       console.log(result)
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification("Registration successful", 4);
       } else {
         App.showNotification("Error during registration", 5);
       }
     })
     .catch(function (err) {
       App.showNotification("Error during registration", 5);
     });
 },
 //client function
 handleRequestAccessPoint:function(event){//let client request carrier to deliver their packages to accesspoint
   let tip=$('#tip-carrier').val(); //tip 
   App.contracts.vote.deployed().then(function (instance) {
     return instance.requestToAccessPoint({ value: web3.toWei(tip, "ether") });
   }).then(function(result){
     if (result&&parseInt(result.receipt.status) == 1) {
      //  App.updateRequest(App.currentAccount)
       App.showNotification(String(App.currentAccount)+" has request the package to access point successfuly", 4);
     } else {
       App.showNotification("Error during Requesting", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Requesting", 5);
   });
 },
 updateRequest:function(add){ //send client data to index.js
   console.log(add)
   $.post(
     "/updateRequests",
     {
       Address:add
     }
   )
 },
 handleRequestPick:function(event){ //client request to self-pickup
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.requestToPickUp();
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification("Request Pick Up Successfully", 4);
         App.showNotification("Event Phase: Pick By Client Phase", 3);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handleRequestCancelPick:function(event){ //Client request to cancel self-pickup
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.cancelPickUp();
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification("Request To Cancel Pick Up Successfully", 4);
         App.showNotification("Event Phase: Start Client Action Phase", 3);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handleLocationPin:function(event){ //Return client's package location and pin in locker
   let pwd=$("#password-location-pin").val();
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.requestLocationPin(pwd);
     }).then(function(result){
       console.log(result)
       console.log(result[1]['e'],result[1]['c'][0])
       if ((result[1]['e']!==""&&result[1]['c'][0]!=="")) {
         console.log(result)
         let location=decrypt(result[0]);
         let pin=decrypt(result[1])
         App.showNotification("Lokcer Location:"+result[1]['e']+'\n'+"Lokcer Pin:"+result[1]['c'][0], 4);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handleRequestRedelivery:function(event){//let client request for redelivery
   let tip=$('#tip-driver').val(); //tip 
   console.log(tip)
   App.contracts.vote.deployed().then(function (instance) {
     return instance.requestToRedelivery({ value: web3.toWei(tip, "ether") });
   }).then(function(result){
     console.log(result)
     if (result&&parseInt(result.receipt.status) == 1) {
      //  App.UpdateRedeliveryRequesting(tip,App.currentAccount);
       App.showNotification(String(App.currentAccount)+" has request to redelivery", 4);
       App.showNotification("Event Phase: Pick By Driver Phase", 3);
       setTimeout(function(){ window.location.replace('client-interface.html');}, 1200);
     } else {
       App.showNotification("Error during Requesting", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Requesting", 5);
   });
 },
 UpdateRedeliveryRequesting:function(tip,add){
   $.post(
     "/UpdateRedeliveryRequests",
     {
       tips:tip,
       Address:add
     }
   )
 },
 handleCancelRedelivery:function(event){//let client request for redelivery
   let driverAddress=$('#driver-address-cancel').val(); //tip 
   App.contracts.vote.deployed().then(function (instance) {
     return instance.requestToCancel(driverAddress);
   }).then(function(result){
     if (result&&parseInt(result.receipt.status) == 1) {
      //  App.DeleteingRedeliveryRequesting(App.currentAccount);
       App.showNotification(String(App.currentAccount)+" has cancel the redelivery", 4);
       setTimeout(function(){ window.location.replace('client-interface.html');}, 1200);
     } else {
       App.showNotification("Error during Requesting", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Requesting", 5);
   });
 },
 DeleteingRedeliveryRequesting:function(client){
   $.post(
     "/DeleteingRedeliveryRequest",
     {
       client:client
     }
   )
 },
 handleRequestDriverInfo:function(event){ //handle carrier assign
   let driverAddress=$('#driver-address-info').val()
   let pwd=$('#password-driver-info').val() 
   console.log(driverAddress,pwd)
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.requestDriverInfo(driverAddress,pwd);
     }).then(function(result){
       console.log(result)
       if (result[0]!==""&&result[1]!==""&&result[2]!=="") {
         let name=decrypt(result[0])
         let lisnum=decrypt(result[1])
         App.showNotification("Name:"+name+" Liscense:"+lisnum, 4);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handleRecieved:function(event){ //handle carrier assign
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.recieved();
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification(String(App.currentAccount)+" Has Recieved Its Packages "+String(App.currentAccount), 4);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 //driver function
 handleAcceptRequest:function(event){ //handle carrier assign
   let clientAddress=$('#client-address-accept').val()
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.acceptRedelivery(clientAddress);
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
        //  App.AcceptingRequest(clientAddress,App.currentAccount);
         App.showNotification(String(clientAddress)+" Request Has Been Accepted By "+String(App.currentAccount), 4);
         setTimeout(function(){ window.location.replace('driver-interface.html');}, 1200);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
     },
 AcceptingRequest:function(client,driver){
   $.post(
     "/updateAcceptingRequesting",
     {
       client:client,
       driver:driver
     }
   )
 },
 handleRequestClientInfo:function(event){ //handle carrier assign
   let clientAddress=$('#client-address-request-info').val()
   let pwd=$('#password-driver-client-info').val()
   console.log(clientAddress,pwd)
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.requestClientInfo(clientAddress,pwd);
     }).then(function(result){
       console.log(result)
       if (result[0]!==""&&result[1]!==""&&result[2]!=="") {
         let name=decrypt(result[0])
         let homeAdd=decrypt(result[1])
         let lisnum=decrypt(result[2])
         App.showNotification("Name:"+name+" Address:"+homeAdd+" Liscense:"+lisnum, 4);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handlePackagePicked:function(event){ //handle carrier assign
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.packagePicked();
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification(String(App.currentAccount)+" Has Picked Up The Packages", 4);
       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 handlePackageDelivered:function(event){ //handle carrier assign
   let clientAddress=$('#driver-delivered-client').val()
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.deliveredToClient(clientAddress);
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         //App.UpdateDelivered(clientAddress)
         App.updatingCountMake();
         App.showNotification(String(clientAddress)+" Packages Has Been Delivered", 4);
         App.showNotification("Event Phase: End Phase", 3);
         setTimeout(function(){ window.location.replace('driver-interface.html');}, 1200);

       } else {
         App.showNotification("Error During Requesting", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Requesting", 5);
     });
 },
 updatingCountMake:function(){
  $.post("/updatingCount",{})
},
 UpdateDelivered:function(client){
   $.post(
     "/updateDelivered",
     {
       client:client
     }
   )
 },
 //carrier function
 handleCarrierAssign:function(event){ //handle carrier assign
   let clientAddress=$('#client-address').val()
   App.contracts.vote
     .deployed()
     .then(function (instance) {
       return instance.assign(clientAddress);
     }).then(function(result){
       if (result&&parseInt(result.receipt.status) == 1) {
         App.showNotification(String(clientAddress)+" has been assigned a package arrive today", 4);
       } else {
         App.showNotification("Error During Assigning", 5);
       }
     }).catch(function (err) {
       App.showNotification("Error During Assigning", 5);
     });
 },
 handleCarrierDelivered:function(event){
   let clientAddress=$('#client-address-delivered').val()
   let lockerLocation=$('#locker-position').val()
   let lockerPin=$('#locker-pin').val()
   let pwd=$('#password').val()
   console.log(lockerLocation,lockerPin)
  //  lockerLocation=encrypt(lockerLocation);
  //  lockerPin=encrypt(lockerPin);
   App.contracts.vote.deployed().then(function (instance) {
     return instance.deliveredAccessPoint(clientAddress,lockerLocation,(lockerPin),pwd);
   }).then(function(result){
     if (result&&parseInt(result.receipt.status) == 1) {
      //  App.deleteRequest(clientAddress)
       App.showNotification(String(clientAddress)+" package has been delivered to access point. ", 4);
       App.showNotification("Event: Start Client Action", 3);
       setTimeout(function(){ window.location.replace('carrier-interface.html');}, 1200);
     } else {
       App.showNotification("Error during Delivered", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Delivered", 5);
   });
 },
 deleteRequest:function(add){
   App.count--;
   $.post(
     "deleteRequests",
     {
       Address:add
     }
   )
 },
 //all people
 handleRequestAPLocation:function(event){
   App.contracts.vote.deployed().then(function (instance) {
     return instance.requestAccessPointLocation();
   }).then(function(result){
     App.showNotification(result, 4);
   });
 },
 handleWithdraw:function(event){
   App.contracts.vote.deployed().then(function (instance) {
     return instance.withdraw();
   }).then(function(result){
     if (result&&parseInt(result.receipt.status) == 1) {
       App.showNotification("Withdraw Successfully", 4);
     } else {
       App.showNotification("Error during Withdraw", 5);
     }
   }).catch(function (err) {
     App.showNotification("Error during Withdraw", 5);
   });
 },
 
 showNotification: function (text, type) {
   toastr.info(text, "", {
     iconClass: "toast-info notification" + String(type),
   });
 },
}
$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      showDuration: "1000",
      positionClass: "toast-top-center",
      preventDuplicates: true,
      closeButton: true,
    };
  });
});
function encrypt(message = '', key = 'fiojhusdenguiosdghnuioyesgherayhtdrfhiusdgunzguiondzfiopbm'){ //encryption
  var message = CryptoJS.AES.encrypt(message, key);
  return message.toString();
}
function decrypt(message = '', key = 'fiojhusdenguiosdghnuioyesgherayhtdrfhiusdgunzguiondzfiopbm'){
  var code = CryptoJS.AES.decrypt(message, key);
  var decryptedMessage = code.toString(CryptoJS.enc.Utf8);

  return decryptedMessage;
}
$("#Role").change(function(){
  if($(this).val()=="Client"){
    $('#register-name').show();
    $('#register-HomeAddress').show();
    $('#register-Liscence').show();
    $('#register-password').show();
    $('#Name').attr('required', '');
    $('#Name').attr('data-error', 'This field is required.');
    $('#HomeAddress').attr('required', '');
    $('#HomeAddress').attr('data-error', 'This field is required.');
    $('#LiscenceNumber').attr('required', '');
    $('#LiscenceNumber').attr('data-error', 'This field is required.');
    $('#Password').attr('required', '');
    $('#Password').attr('data-error', 'This field is required.');
  }
  else if($(this).val()=="Driver"){
    $('#register-name').show();
    $('#register-HomeAddress').hide();
    $('#register-Liscence').show();
    $('#register-password').show();    $('#Name').attr('required', '');
    $('#Name').attr('data-error', 'This field is required.');
    $('#LiscenceNumber').attr('required', '');
    $('#LiscenceNumber').attr('data-error', 'This field is required.');
    $('#Password').attr('required', '');
    $('#Password').attr('data-error', 'This field is required.');
    $('#HomeAddress').removeAttr('required');
    $('#HomeAddress').removeAttr('data-error');
  }
  else if($(this).val()=="Carrier"){
    $('#register-name').show();
    $('#register-HomeAddress').hide();
    $('#register-Liscence').hide();
    $('#register-password').show();
    $('#Name').attr('required', '');
    $('#Name').attr('data-error', 'This field is required.');
    $('#Password').attr('required', '');
    $('#Password').attr('data-error', 'This field is required.');
    $('#HomeAddress').removeAttr('required');
    $('#HomeAddress').removeAttr('data-error');
    $('#LiscenceNumber').removeAttr('required');
    $('#LiscenceNumber').removeAttr('data-error');
  }
});
$("#Role").trigger("change");
var modal = document.getElementById('id01');
if($('#sign-in').length){
  $('#sign-in').hide();
  $('#sign-in').show("slow","swing");
}
if($('#register-body').length){
  $('#register-body').hide();
  $('#register-body').show("slow","swing");
}

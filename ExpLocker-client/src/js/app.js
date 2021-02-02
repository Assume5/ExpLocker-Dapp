App = {
 web3Provider: null,
 contracts: {},
 names: new Array(),
 //url: 'http://127.0.0.1:7545',
 // network_id: 5777,
 chairPerson:null,
 currentAccount:null,
 AccessPointRequestData:{},
 count:1,
 zero:"0x0000000000000000000000000000000000000000",
 ownerPassword:"CSE426526",
 address:'0x5A776BA7832C1e7A9fe0F90df25a3760c9b2d055',
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
  if (typeof web3 !== 'undefined') {
    App.web3Provider = web3.currentProvider;
  } else {
    // If no injected web3 instance is detected, fallback to the TestRPC
    App.web3Provider = new Web3.providers.HttpProvider(App.url);
  }
  web3 = new Web3(App.web3Provider);  
  ethereum.enable();    //Enables metamask and gives the popup  
  return App.initContract(); 
 },
 initContract: function () {
    App.contracts.ExpLocker = web3.eth.contract(App.abi).at(App.address)
    App.currentAccount = web3.eth.coinbase; // get current account
    App.getPhase();
    App.getChairperson();
    if($('#current-address').length){
      $('#current-address').val(App.currentAccount);
    }
    if($('#Package-Today').length){
      let currentStatus;
      App.contracts.ExpLocker.clientStatus(App.currentAccount,(err,result)=>{
        console.log(result)
        if(result[0]){
          currentStatus="True";
        }
        else{
          currentStatus="False";
        }
        $('#Package-Today').val(currentStatus);
      })
    }
    return App.populateCartDetails();
 },
 populateCartDetails:function(){
  if($('#carrier-tabel').length){
    App.contracts.ExpLocker.returnArray(App.currentAccount,(err,result)=>{
      console.log(result)
      for(let i=0;i<result.length;i++){
        if(result[i]!=App.zero){
          $("#carrier-tabel tbody").append('<tr><th scope="row">'+App.count+'</th><td>'+result[i]+'</td></tr>')
          App.count++;
        }
      }
    })
}
if($('#queue_table').length){
  App.contracts.ExpLocker.tableLength((err,res)=>{
    for(let i=0;i<res['c'][0];i++)
  {  App.contracts.ExpLocker.requestingTable(i,(err,result)=>{
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
    })}
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
   return App.lockerEvent();
 },
 getPhase:function(){
  if($('#Current-Phase').length){
    App.contracts.ExpLocker.currentPhase(App.currentAccount,(err,result)=>{
      console.log(result)

      if(!err){
        console.log(result)
        let current=result['c'][0];
        let currentText=(App.ExpPhase[current]);
        $('#Current-Phase').val(currentText)
      }
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
 getChairperson : function(){
  App.contracts.ExpLocker.chair((e,result)=>{
  if(!e){
    App.chairPerson=result
    console.log(result,"R")
  }
})
},

 handleOwnerLogin: function(event){ //handle chair person login
  console.log(App.currentAccount)
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
   App.contracts.ExpLocker.setLocation(location,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
      if(rec){
        clearInterval(myInterval);
      if(parseInt(rec.status)==1){
        App.showNotification("Set Location Successfully", 4);
      }
          else{
            App.showNotification("Error during Setting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error during Setting", 5);
    }
   })
   //---------
 },
 handleUserLogin:function(event){ //handle user login
   let whichUser=0; //will get which type of user in current account
   let password=$('#inputPassword').val();
   App.contracts.ExpLocker.checkPassword(password,(err,result)=>{
     if(!err){
       if(result){
        App.contracts.ExpLocker.user(App.currentAccount,(err,  result)=>{
         whichUser=parseInt(result['c'][0]) //get current  user type
         if(whichUser==1){ //if current user == client then  bring to client interface
           window.location.replace('client-interface.html')
         }
         else if(whichUser==2){
           window.location.replace('driver-interface.html')
         }
         else if(whichUser==3){
           window.location.replace('carrier-interface.html')
         }
        })
      }
      else{
        App.showNotification("Wrong Password", 5);
       }
     }
     else{
      App.showNotification("Wrong Password", 5);
     }
   })
   //------------------------------
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
   App.contracts.ExpLocker.register(role,name,address,liscence,pwd,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
      if(rec){
        clearInterval(myInterval);
      if(parseInt(rec.status)==1){
        App.showNotification("Registration successful", 4);
      }
          else{
            App.showNotification("Error during registration", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error during registration", 5);
    }
   })
 },
 //client function
 handleRequestAccessPoint:function(event){//let client request carrier to deliver their packages to accesspoint
   let tip=$('#tip-carrier').val(); //tip 
   App.contracts.ExpLocker.requestToAccessPoint({value:web3.toWei(tip, "ether")},(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              //App.updateRequest(App.currentAccount)
              App.showNotification(String(App.currentAccount)+" has request the package to access point successfuly", 4);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
   //-----
 },
//  updateRequest:function(add){ //send client data to index.js
//    console.log(add)
//    $.post(
//      "/updateRequests",
//      {
//        Address:add
//      }
//    )
//  },
 handleRequestPick:function(event){ //client request to self-pickup
  App.contracts.ExpLocker.requestToPickUp((err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              App.showNotification("Request Pick Up Successfully", 4);
              App.showNotification("Event Phase: Pick By Client Phase", 3);
            }
            else{
              App.showNotification("Error During Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);

      // App.showNotification("Request Pick Up Successfully", 4);
      // App.showNotification("Event Phase: Pick By Client Phase", 3);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
  })
 },
 handleRequestCancelPick:function(event){ //Client request to cancel self-pickup
  App.contracts.ExpLocker.cancelPickUp((err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              App.showNotification("Request To Cancel Pick Up Successfully", 4);
              App.showNotification("Event Phase: Start Client Action Phase", 3);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
  })
 },
 handleLocationPin:function(event){ //Return client's package location and pin in locker
   let pwd=$("#password-location-pin").val();
   App.contracts.ExpLocker.requestLocationPin(pwd,(err,result)=>{
     if(!err){
      if ((result[1]['e']!==""&&result[1]['c'][0]!=="")) {
        console.log(result)
        let location=decrypt(result[0]);
        let pin=decrypt(result[1])
        App.showNotification("Lokcer Location:"+result[1]['e']+'\n'+"Lokcer Pin:"+result[1]['c'][0], 4);
      }
       else {
        App.showNotification("Error During Requesting", 5);
      }
     }
   })
 },
 handleRequestRedelivery:function(event){//let client request for redelivery
   let tip=$('#tip-driver').val(); //tip 
   console.log(tip)
   App.contracts.ExpLocker.requestToRedelivery({ value: web3.toWei(tip, "ether")},(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              // App.UpdateRedeliveryRequesting(tip,App.currentAccount);
              App.showNotification(String(App.currentAccount)+" has request to redelivery", 4);
              App.showNotification("Event Phase: Pick By Driver Phase", 3);
              setTimeout(function(){ window.location.replace('client-interface.html');}, 1200);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
//  UpdateRedeliveryRequesting:function(tip,add){
//    $.post(
//      "/UpdateRedeliveryRequests",
//      {
//        tips:tip,
//        Address:add
//      }
//    )
//  },
 handleCancelRedelivery:function(event){//let client request for redelivery
   let driverAddress=$('#driver-address-cancel').val(); //tip 
   App.contracts.ExpLocker.requestToCancel(driverAddress,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              // App.DeleteingRedeliveryRequesting(App.currentAccount);
              App.showNotification(String(App.currentAccount)+" has cancel the redelivery", 4);
              setTimeout(function(){ window.location.replace('client-interface.html');}, 1200);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
//  DeleteingRedeliveryRequesting:function(client){
//    $.post(
//      "/DeleteingRedeliveryRequest",
//      {
//        client:client
//      }
//    )
//  },
 handleRequestDriverInfo:function(event){ //handle carrier assign
   let driverAddress=$('#driver-address-info').val()
   let pwd=$('#password-driver-info').val() 
   console.log(driverAddress,pwd)
   App.contracts.ExpLocker.requestDriverInfo(driverAddress,pwd,(err,result)=>{
    if (result[0]!==""&&result[1]!==""&&result[2]!=="") {
      let name=decrypt(result[0])
      let lisnum=decrypt(result[1])
      App.showNotification("Name:"+name+" Liscense:"+lisnum, 4);
    } else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
 handleRecieved:function(event){ //handle carrier assign
  App.contracts.ExpLocker.recieved((err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              App.showNotification(String(App.currentAccount)+" Has Recieved Its Packages "+String(App.currentAccount), 4);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
  })
 },
 //driver function
 handleAcceptRequest:function(event){ //handle carrier assign
   let clientAddress=$('#client-address-accept').val()
   App.contracts.ExpLocker.acceptRedelivery(clientAddress,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              // App.AcceptingRequest(clientAddress,App.currentAccount);
              App.showNotification(String(clientAddress)+" Request Has Been Accepted By "+String(App.currentAccount), 4);
              setTimeout(function(){ window.location.replace('driver-interface.html');}, 1200);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
     },
//  AcceptingRequest:function(client,driver){
//    $.post(
//      "/updateAcceptingRequesting",
//      {
//        client:client,
//        driver:driver
//      }
//    )
//  },
 handleRequestClientInfo:function(event){ //handle carrier assign
   let clientAddress=$('#client-address-request-info').val()
   let pwd=$('#password-driver-client-info').val()
   console.log(clientAddress,pwd)
   App.contracts.ExpLocker.requestClientInfo(clientAddress,pwd,(err,result)=>{
    if (result[0]!==""&&result[1]!==""&&result[2]!=="") {
      let name=decrypt(result[0])
      let homeAdd=decrypt(result[1])
      let lisnum=decrypt(result[2])
      App.showNotification("Name:"+name+" Address:"+homeAdd+" Liscense:"+lisnum, 4);
    } else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
 handlePackagePicked:function(event){ //handle carrier assign
  App.contracts.ExpLocker.packagePicked((err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              App.showNotification(String(App.currentAccount)+" Has Picked Up The Packages", 4);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
  }) 
 },
 handlePackageDelivered:function(event){ //handle carrier assign
   let clientAddress=$('#driver-delivered-client').val()
   App.contracts.ExpLocker.deliveredToClient(clientAddress,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              // App.UpdateDelivered(clientAddress)
              App.updatingCountMake();
              App.showNotification(String(clientAddress)+" Packages Has Been Delivered", 4);
              App.showNotification("Event Phase: End Phase", 3);
              setTimeout(function(){ window.location.replace('driver-interface.html');}, 1200);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
 updatingCountMake:function(){
   $.post("/updatingCount",{})
 },
//  UpdateDelivered:function(client){
//    $.post(
//      "/updateDelivered",
//      {
//        client:client
//      }
//    )
//  },
 //carrier function
 handleCarrierAssign:function(event){ //handle carrier assign
   let clientAddress=$('#client-address').val()
   App.contracts.ExpLocker.assign(clientAddress,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              App.showNotification(String(clientAddress)+" has been assigned a package arrive today", 4);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
 handleCarrierDelivered:function(event){
   let clientAddress=$('#client-address-delivered').val()
   let lockerLocation=$('#locker-position').val()
   let lockerPin=$('#locker-pin').val()
   let pwd=$('#password').val()
   console.log(clientAddress,pwd)
  //  lockerLocation=encrypt(lockerLocation);
  //  lockerPin=encrypt(lockerPin);
   App.contracts.ExpLocker.deliveredAccessPoint(clientAddress,lockerLocation,lockerPin,pwd,(err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
          if(rec){
            clearInterval(myInterval);
            if(parseInt(rec.status)==1){
              //App.deleteRequest(clientAddress)
       App.showNotification(String(clientAddress)+" package has been delivered to access point. ", 4);
       App.showNotification("Event: Start Client Action", 3);
       setTimeout(function(){ window.location.replace('carrier-interface.html');}, 1200);
            }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
//  deleteRequest:function(add){
//    App.count--;
//    $.post(
//      "deleteRequests",
//      {
//        Address:add
//      }
//    )
//  },
 //all people
 handleRequestAPLocation:function(event){
   App.contracts.ExpLocker.requestAccessPointLocation((err,result)=>{
    App.showNotification(result, 4);
   })
 },
 handleWithdraw:function(event){
   App.contracts.ExpLocker.withdraw((err,result)=>{
    if(!err){
      function pendingConfirmation() {
        web3.eth.getTransactionReceipt(result,(e,rec)=>{
      if(rec){
        clearInterval(myInterval);
      if(parseInt(rec.status)==1){
          App.showNotification("Withdraw Successfully", 4);
        }
          else{
            App.showNotification("Error during Requesting", 5);
          }
        }
         })
     }
     const myInterval = setInterval(pendingConfirmation, 3000);
    }else {
      App.showNotification("Error During Requesting", 5);
    }
   })
 },
 
 showNotification: function (text, type) {
   toastr.info(text, "", {
     iconClass: "toast-info notification" + String(type),
   });
 },
 "abi": [
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "currentPhase",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "clientStatus",
    "outputs": [
      {
        "name": "packageToday",
        "type": "bool"
      },
      {
        "name": "toAccessPoint",
        "type": "bool"
      },
      {
        "name": "pickUpStatus",
        "type": "bool"
      },
      {
        "name": "requestRedelivery",
        "type": "bool"
      },
      {
        "name": "cancelled",
        "type": "bool"
      },
      {
        "name": "recieved",
        "type": "bool"
      },
      {
        "name": "accepted",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "tableLength",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "user",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "requestingTable",
    "outputs": [
      {
        "name": "givenTips",
        "type": "uint256"
      },
      {
        "name": "requestAddress",
        "type": "address"
      },
      {
        "name": "status",
        "type": "uint256"
      },
      {
        "name": "acceptedAddress",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "chair",
    "outputs": [
      {
        "name": "",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "ClientAction",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "DriverPicked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "ClientPicked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "end",
    "type": "event"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "role",
        "type": "uint256"
      },
      {
        "name": "personName",
        "type": "string"
      },
      {
        "name": "hAddress",
        "type": "string"
      },
      {
        "name": "liscenNumber",
        "type": "string"
      },
      {
        "name": "password",
        "type": "bytes32"
      }
    ],
    "name": "register",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "add",
        "type": "address"
      }
    ],
    "name": "returnArray",
    "outputs": [
      {
        "name": "",
        "type": "address[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "Location",
        "type": "string"
      }
    ],
    "name": "setLocation",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "client",
        "type": "address"
      }
    ],
    "name": "assign",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "client",
        "type": "address"
      },
      {
        "name": "lockerPosition",
        "type": "uint256"
      },
      {
        "name": "lockerPin",
        "type": "uint256"
      },
      {
        "name": "secret",
        "type": "bytes32"
      }
    ],
    "name": "deliveredAccessPoint",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "requestToAccessPoint",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "requestToPickUp",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "cancelPickUp",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "secret",
        "type": "bytes32"
      }
    ],
    "name": "requestLocationPin",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "requestToRedelivery",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "driver",
        "type": "address"
      }
    ],
    "name": "requestToCancel",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "driver",
        "type": "address"
      },
      {
        "name": "secret",
        "type": "bytes32"
      }
    ],
    "name": "requestDriverInfo",
    "outputs": [
      {
        "name": "",
        "type": "string"
      },
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "recieved",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "client",
        "type": "address"
      }
    ],
    "name": "acceptRedelivery",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "client",
        "type": "address"
      },
      {
        "name": "secret",
        "type": "bytes32"
      }
    ],
    "name": "requestClientInfo",
    "outputs": [
      {
        "name": "",
        "type": "string"
      },
      {
        "name": "",
        "type": "string"
      },
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "packagePicked",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "client",
        "type": "address"
      }
    ],
    "name": "deliveredToClient",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "secret",
        "type": "bytes32"
      }
    ],
    "name": "checkPassword",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "requestAccessPointLocation",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
};
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

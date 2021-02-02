let express = require('express');
let fs = require("fs");
let app = express();
let bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('src'));
app.use(express.static('../ExpLocker-contract/build/contracts'));

app.get('/', function (req, res) {
  res.render('index.html');
});
app.get("/countMaking",function(req,res){
  let contents = fs.readFileSync("db/DriverAccepted.json");
  let cursor = JSON.parse(contents);
  let amountMade=0;
  amountMade=cursor["Count"];
  console.log(amountMade)
  res.send({Count:amountMade})
})
app.post("/updatingCount",function(req,res){
  let contents = fs.readFileSync("./db/DriverAccepted.json");
  let cursor = JSON.parse(contents);
  count=parseInt(cursor.Count);
  let data={"Count":count+1}
  fs.writeFile("./db/DriverAccepted.json", JSON.stringify(data), err => { 
    if (err) throw err;  
    console.log("Done writing"); // Success 
}); 
})
// app.post("/deleteRequests", function (req, res) {  //handle when carrier delivered the packages to access point, delete the json and update the chart.
//   let address = req.body.Address;
//   let contents = fs.readFileSync("./db/AccessPointRequest.json");
//   let cursor = JSON.parse(contents);
//   var filtered = cursor.filter(function(add) { 
//     return add.Address != address;  
//  });
//     fs.writeFile("./db/AccessPointRequest.json", JSON.stringify(filtered), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// });
// app.get("/AddressRequesting", function (req, res) { //handle when client requesting a packages to access point update the chart this will send json data to js for updating the cart
//   let contents = fs.readFileSync("db/AccessPointRequest.json");
//   let cursor = JSON.parse(contents);
//   let requestAddress = {};
//   for (index in cursor) {
//     requestAddress[cursor[index].Address] = cursor[index];
//   }
//   res.send(requestAddress);
// });

// app.get("/RedeliveryRequesting", function (req, res) { //handle when client requesting for a redelivery update the chart this will send json data to js for updating the cart
//   let contents = fs.readFileSync("db/RedeliveryRequest.json");
//   let cursor = JSON.parse(contents);
//   let requestAddress = {};
//   for (index in cursor) {
//     requestAddress[cursor[index].ClientAddress] = cursor[index];
//   }
//   console.log(requestAddress)
//   res.send(requestAddress);
// });
// app.post("/updateRequests", function (req, res) { //handle when driver accepts client's request update the chart
//   let address = req.body.Address;
//   let contents = fs.readFileSync("./db/AccessPointRequest.json");
//   let cursor = JSON.parse(contents);
//   let newRequest={
//     Address:address
//   }
//   cursor.push(newRequest);
//   fs.writeFile("./db/AccessPointRequest.json", JSON.stringify(cursor), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// });

// app.post("/UpdateRedeliveryRequests",function(req,res){
//   let address = req.body.Address;
//   let tip=req.body.tips
//   let contents = fs.readFileSync("db/RedeliveryRequest.json");
//   let cursor = JSON.parse(contents);
//   let newData={
//     ClientAddress:address,
//     Tips:tip,
//     Status:"Pending",
//     DriverAddress:"NONE"
//   }
//   cursor.push(newData);
//   fs.writeFile("./db/RedeliveryRequest.json", JSON.stringify(cursor), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// })
// app.post("/updateAcceptingRequesting",function(req,res){
//   let addressC = req.body.client;
//   let addressD = req.body.driver;
//   //console.log("This is req body:",addressC)
//   let contents = fs.readFileSync("db/RedeliveryRequest.json");
//   let cursor = JSON.parse(contents);
//   for(i in cursor){
//     //console.log("This is cursor[i]:  ",cursor[i].ClientAddress)
//     if(cursor[i].ClientAddress==addressC){
//       cursor[i].Status="Accepted";
//       cursor[i].DriverAddress=addressD
//     }
//   }
//   console.log(cursor)
//   fs.writeFile("./db/RedeliveryRequest.json", JSON.stringify(cursor), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// })
// app.post("/DeleteingRedeliveryRequest",function(req,res){
//   let addressC = req.body.client;
//   //console.log("This is req body:",addressC)
//   let contents = fs.readFileSync("db/RedeliveryRequest.json");
//   let cursor = JSON.parse(contents);
//   for(i in cursor){
//     //console.log("This is cursor[i]:  ",cursor[i].ClientAddress)
//     if(cursor[i].ClientAddress==addressC){
//       cursor[i].Status="Cancelled";
//     }
//   }
//   console.log(cursor)
//   fs.writeFile("./db/RedeliveryRequest.json", JSON.stringify(cursor), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// })
// app.post("/updateDelivered",function(req,res){
//   let addressC = req.body.client;
//   //console.log("This is req body:",addressC)
//   let contents = fs.readFileSync("db/RedeliveryRequest.json");
//   let cursor = JSON.parse(contents);
//   for(i in cursor){
//     //console.log("This is cursor[i]:  ",cursor[i].ClientAddress)
//     if(cursor[i].ClientAddress==addressC){
//       cursor[i].Status="Delivered";
//     }
//   }
//   console.log(cursor)
//   fs.writeFile("./db/RedeliveryRequest.json", JSON.stringify(cursor), err => { 
//     if (err) throw err;  
//     console.log("Done writing"); // Success 
// }); 
// })
app.listen(3000, function () {
  console.log('ExpLocker Dapp listening on port 3000!');
});
pragma solidity >=0.4.22 <=0.6.0;
contract ExpLocker{
    //struct
    struct clientInfo{
        uint tablePosition;
        string name;
        string homeAddress;
        string driverNumber;
        address driverAddress;//this will assign when driver accept the request
        address carrierAddress; //this will assign by carriers
        uint lockerLocation;//this will sotre locker location when client request pickup
        uint lockerPassword; //this will store the locker password when client request to pickup
    }
    struct driverInfo{
        string name;
        string driverNumber; 
        address clientAddress;//this will assign when driver accept the request
    }
    struct carrierInfo{
        string name; //ups or usps..
        address clientAddress; //this will asign when carrier is deliverying the client's package
        uint length;
    }
    struct statusClient{
        bool packageToday;
        bool toAccessPoint; //this will turn true if client request to access point
        bool pickUpStatus; //this will turn true if client request to pick up
        bool requestRedelivery; //this will turn true if client request driver to redelivery
        bool cancelled; //this will turn true if client cancelled the redelivery
        bool recieved; //true if client recieved its own package
        bool accepted; //true if driver accepted
    }
    struct statusDriver{
        bool acceptRequest; //this will turn true if driver accept client's request
        bool pickedUp; //will true true if driver picked up client's package, so that client can't cancel the delivery
    }
     struct statusCarrier{
        bool toLocation; //this will turn true if client request toAccessPoint
    }
    struct requestTable{
        uint givenTips;
        address requestAddress;
        uint status;
        address acceptedAddress;
    }
    
    //address of people
    address payable public chair; //owner
    mapping (uint => requestTable) public requestingTable;
    uint  public tableLength=0;
    mapping (address => uint) public user; // this will assign user by roles. 1=Client 2=Driver 3=Carrier
    mapping (address => address[]) private whoToAccessPoint; // this will assign user by roles. 1=Client 2=Driver 3=Carrier
    mapping (address => uint) addressIndex;
    bytes32 private hashedValue;
    //address zero=0x0000000000000000000000000000000000000000;//default
    //variable
    //mapping (address => address) accepted; // this will map client and driver who accept client's request
    mapping (address => clientInfo) private clientInformation;
    mapping (address => driverInfo) private driverInformation;
    mapping (address => carrierInfo) private carrierInformation;
    mapping (address => statusClient) public clientStatus;
    mapping (address => statusDriver) private driverStatus;
    mapping (address => statusCarrier) private carrierStatus;
    mapping(address=>bytes32) private hashedAddress; //Only people have the password can access.
    string  location;
    mapping(address => uint) depositReturns; 
    
    //Event
    // Init - 0; StartClientAction - 1; pickByDriver - 2; pickByClient - 3; Done - 4
    enum Phase {Init,StartClientAction,pickByDriver,pickByClient,Done}
    event ClientAction();
    event DriverPicked();
    event ClientPicked();
    event end();
    mapping (address => Phase) public currentPhase; //will assign each client event.
    //event requestToPickUp();
    
    //modifier and rules
    modifier validPhase(address Client,Phase phase) {
        require(currentPhase[Client] == phase, "phaseError");
        _;
    }
    modifier onlyChairperson{ 
        require(msg.sender==chair);
        _;
    }
    modifier onlyClient{ 
        require(user[msg.sender]==1);
        _;
    }
    modifier onlyDriver{ 
        require(user[msg.sender]==2);
        _;
    }
    modifier onlyCarrier{ 
        require(user[msg.sender]==3);
        _;
    }
    //constructor
    constructor()public payable{
        chair=msg.sender;
    }
    
    
    //functions
    function register(uint role,string memory personName,string memory hAddress,string memory liscenNumber,bytes32 password)public{ //value 1=client 2=driver 3=carrier
    	hashedValue = keccak256(abi.encodePacked(msg.sender, password));
        if(role==1){//client
            user[msg.sender]=1;
            //updating status and information to default
            clientInformation[msg.sender].name=personName;
            clientInformation[msg.sender].homeAddress=hAddress;
            clientInformation[msg.sender].driverNumber=liscenNumber;
            clientInformation[msg.sender].driverAddress=0x0000000000000000000000000000000000000000;
            clientInformation[msg.sender].carrierAddress=0x0000000000000000000000000000000000000000;
            clientInformation[msg.sender].tablePosition=0;
            clientStatus[msg.sender].toAccessPoint=false;
            clientStatus[msg.sender].pickUpStatus=false;
            clientStatus[msg.sender].requestRedelivery=false;
            clientStatus[msg.sender].recieved=false;
            clientStatus[msg.sender].accepted=false;
            clientStatus[msg.sender].packageToday=false;
            currentPhase[msg.sender]=Phase.Init;
            
        }
        else if(role==2){//driver
            user[msg.sender]=2;
            driverInformation[msg.sender].name=personName;
            driverInformation[msg.sender].driverNumber=liscenNumber;
            driverInformation[msg.sender].clientAddress=0x0000000000000000000000000000000000000000;
            driverStatus[msg.sender].acceptRequest=false;
            driverStatus[msg.sender].pickedUp=false;
        }
        else{//carrier
            user[msg.sender]=3;
            carrierInformation[msg.sender].name=personName;
            carrierInformation[msg.sender].length=0;
            carrierStatus[msg.sender].toLocation=false;
        }
        hashedAddress[msg.sender]=hashedValue;//store hashed address.
    }  //register function ended 
    function returnArray(address add) public view returns(address[] memory) {
        return whoToAccessPoint[add];
    } 
    //chairPerson function
    function setLocation(string memory Location)onlyChairperson public{//this will only let chair person to set the access point location
        location=Location;
    }//setLocation function ended
    
    
    //carriers Function
    function assign(address client)onlyCarrier public{ //Carrier will put client's address if the carriers delivery client's package
        //carrier must assign first inorder to run rest of function
        require(user[client]==1);
        clientInformation[client].carrierAddress=msg.sender;
        clientStatus[client].packageToday=true;
    }//assign function ended
    
    function deliveredAccessPoint(address client, uint lockerPosition, uint lockerPin,bytes32 secret)onlyCarrier public validPhase(client,Phase.Init){
        require(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret)));
        //when carrier delivered to access point, carrier must provides which locker and Password of the locker to clients.
        clientInformation[client].lockerLocation=lockerPosition;
        clientInformation[client].lockerPassword=lockerPin;
        clientInformation[client].carrierAddress=0x0000000000000000000000000000000000000000;//use to identify that driver has delivered client's package to access point
        delete whoToAccessPoint[msg.sender][addressIndex[client]];
        //carrierInformation[msg.sender].length=carrierInformation[msg.sender].length-1;
        clientStatus[client].packageToday=false;
        //updating event phase to 1
        uint nextPhase = uint(currentPhase[client]) + 1;
        currentPhase[client]=Phase(nextPhase);
        emit ClientAction();
    } 
    
    //function for client
    
    function requestToAccessPoint()onlyClient public payable{//client requestToAccessPoint
        require(clientInformation[msg.sender].carrierAddress!=0x0000000000000000000000000000000000000000);
        clientStatus[msg.sender].toAccessPoint=true;
        //tips to carriers.
        address carrier=clientInformation[msg.sender].carrierAddress;
        whoToAccessPoint[carrier].push(msg.sender);
        addressIndex[msg.sender]=carrierInformation[carrier].length;
        carrierInformation[carrier].length=uint(carrierInformation[carrier].length)+1;
        depositReturns[carrier]=msg.value; //will tip carrier
    }//requestToAccessPoint function ended 
    
    function requestToPickUp() onlyClient public validPhase(msg.sender,Phase.StartClientAction){ //client want to requestToPickUp
        //the package must be in the locker inorder to pick up.
        require(clientInformation[msg.sender].carrierAddress==0x0000000000000000000000000000000000000000&& clientStatus[msg.sender].toAccessPoint==true && clientStatus[msg.sender].recieved==false);
        clientStatus[msg.sender].pickUpStatus=true;
        //update phase to pickByClient
        uint nextPhase = uint(currentPhase[msg.sender]) + 2;
        currentPhase[msg.sender] = Phase(nextPhase);
        emit ClientPicked();
    }//requestToPickUp function ended;
    
    function cancelPickUp() onlyClient public validPhase(msg.sender,Phase.pickByClient){ //if clinet change their mind they can cancel it
        require(clientStatus[msg.sender].pickUpStatus==true);
        clientStatus[msg.sender].pickUpStatus=false;
        //update phase to previous event (StartClientAction)
        uint prevPhase = uint(currentPhase[msg.sender]) - 2;
        currentPhase[msg.sender] = Phase(prevPhase);
        emit ClientAction();
    }
    function requestLocationPin(bytes32 secret)public view returns(uint,uint){//Only if client has requested to pick up then Driver or Client can request the pin and location
        require(user[msg.sender]!=3);
        if(user[msg.sender]==2){ //if Driver request
            require(driverInformation[msg.sender].clientAddress!=0x0000000000000000000000000000000000000000);
            //If driver had accepted Client's request, then it will be automatic mapped with Client's address.
            //In order to access Pin and Location driver must have Client's password to access the Pin and Password.
            address clientsAdd=driverInformation[msg.sender].clientAddress;
            if(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret))){
                return (clientInformation[clientsAdd].lockerLocation,clientInformation[clientsAdd].lockerPassword);
            }
        }
        else if(user[msg.sender]==1){//if client request
            require(clientStatus[msg.sender].pickUpStatus==true);
            //Client must have secret to authenticate itself.
            if(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret))){
                return (clientInformation[msg.sender].lockerLocation,clientInformation[msg.sender].lockerPassword);
            }
        }
        // else{
        //     return(-1,-1);
        // }
    }//requestLocationPin function end
    function requestToRedelivery()onlyClient public payable validPhase(msg.sender,Phase.StartClientAction){ //if user request to let driver delivery
        //the package must be in the locker and tip are require.
        require(clientInformation[msg.sender].carrierAddress==0x0000000000000000000000000000000000000000 && msg.value>0 &&clientStatus[msg.sender].pickUpStatus==false);
        clientStatus[msg.sender].requestRedelivery=true;//update status
        //tips
        depositReturns[msg.sender]=msg.value;
        //update phase to pickByDriver
        uint nextPhase = uint(currentPhase[msg.sender]) + 1;
        currentPhase[msg.sender] = Phase(nextPhase);
        emit DriverPicked();
        // //handle requestingTable
        clientInformation[msg.sender].tablePosition=tableLength;
        requestingTable[clientInformation[msg.sender].tablePosition].givenTips=msg.value;
        requestingTable[clientInformation[msg.sender].tablePosition].requestAddress=msg.sender;
        requestingTable[clientInformation[msg.sender].tablePosition].status=0;
        requestingTable[clientInformation[msg.sender].tablePosition].acceptedAddress=0x0000000000000000000000000000000000000000;
        clientInformation[msg.sender].tablePosition=tableLength;
        tableLength++;
    }//requestToRedelivery function ended
    
    function requestToCancel(address driver)onlyClient public validPhase(msg.sender,Phase.pickByDriver){ //client may cancel the redelivery
        //require that driver hasn't picked up package from access point.
        require(clientStatus[msg.sender].accepted==true && driverInformation[driver].clientAddress!=0x0000000000000000000000000000000000000000 && driverStatus[driver].pickedUp==false
        &&clientInformation[msg.sender].driverAddress==driver); //driver must accepted in order to cancel and driver hasnt picked up the package yet;
        //update status and balance
        clientStatus[msg.sender].requestRedelivery=false;
        driverStatus[driver].acceptRequest=false;
        address driverAdd=clientInformation[msg.sender].driverAddress;
        clientInformation[msg.sender].driverAddress=0x0000000000000000000000000000000000000000; //this will prevent driver to access Cleints personal information and pin of locker 
        depositReturns[msg.sender]=depositReturns[driver]; 
        depositReturns[driverAdd]=0;
        requestingTable[clientInformation[msg.sender].tablePosition].status=3;
        //update phase to previous phase (StartClientAction)
        uint prevPhase = uint(currentPhase[msg.sender]) - 1;
        currentPhase[msg.sender] = Phase(prevPhase);
        emit ClientAction();
        withdraw();
    }//requestToCancel function end
    
    function requestDriverInfo(address driver,bytes32 secret)onlyClient public view returns (string memory,string memory){
        require(clientInformation[msg.sender].driverAddress==driver && clientStatus[msg.sender].recieved==false);//only driver that accept client's request can review the infomation
        if(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret))){//for security
            return (driverInformation[driver].name,driverInformation[driver].driverNumber);
        }
    }//requestDriverInfo function ended
    
    function recieved()onlyClient public validPhase(msg.sender,Phase.pickByClient){ //When client has recieved their package by picking up itself.
        //updated all status and information to default.
        clientInformation[msg.sender].driverAddress=0x0000000000000000000000000000000000000000;
        clientInformation[msg.sender].carrierAddress=0x0000000000000000000000000000000000000000;
        clientInformation[msg.sender].lockerLocation=0;
        clientInformation[msg.sender].lockerPassword=0;
        clientStatus[msg.sender].toAccessPoint=false;
        clientStatus[msg.sender].pickUpStatus=false;
        clientStatus[msg.sender].requestRedelivery=false;
        clientStatus[msg.sender].recieved=false;
        clientStatus[msg.sender].accepted=false;
        clientStatus[msg.sender].packageToday=false;
        //update phase to Done.
        uint nextPhase = uint(currentPhase[msg.sender]) + 1;
        currentPhase[msg.sender] = Phase(nextPhase);
        emit end();
        if(currentPhase[msg.sender]==Phase.Done){
            currentPhase[msg.sender]=Phase.Init;
        }
    }//recieved function ended
    
    //Driver function
    
    function acceptRedelivery(address client)onlyDriver public{//only if client has requested for redelivery then driver can accept the redelivery
        //all driver can only accept one delivery at a time.
        require(driverStatus[msg.sender].acceptRequest==false && clientStatus[client].requestRedelivery==true && clientStatus[client].recieved==false);
        //update status and balance
        clientStatus[client].requestRedelivery=true;
        clientStatus[client].accepted=true;
        clientInformation[client].driverAddress=msg.sender;
        
        driverStatus[msg.sender].acceptRequest=true;
        driverInformation[msg.sender].clientAddress=client;
        
        depositReturns[msg.sender]=depositReturns[client];
        depositReturns[client]=0;
        requestingTable[clientInformation[client].tablePosition].status=2;
        requestingTable[clientInformation[client].tablePosition].acceptedAddress=msg.sender;
    }//acceptRedelivery function ended    
    
    function requestClientInfo(address client,bytes32 secret)onlyDriver public view returns (string memory,string memory,string memory){
        if(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret))){//only driver that accepted client's request and with secret can review
            return (clientInformation[client].name,clientInformation[client].homeAddress,clientInformation[client].driverNumber);
        }
    }//requestClientInfo function ended
    
    function packagePicked()onlyDriver public{//when drier picked up client's package from access point, so client cant cancel
        require(driverStatus[msg.sender].acceptRequest==true);
        driverStatus[msg.sender].pickedUp=true;
    }
    
    function deliveredToClient(address client)onlyDriver public validPhase(client,Phase.pickByDriver){//When driver delivered pakcage to Cleints
        require(driverStatus[msg.sender].pickedUp==true && clientInformation[client].driverAddress==msg.sender);
        //update status inorder to accept another delivery
        //update client status and information inorder to let carrier delivery package in next day
        driverStatus[msg.sender].acceptRequest=false;
        clientInformation[client].driverAddress=0x0000000000000000000000000000000000000000;
        clientInformation[client].carrierAddress=0x0000000000000000000000000000000000000000;
        clientInformation[client].lockerLocation=0;
        clientInformation[client].lockerPassword=0;
        clientStatus[client].toAccessPoint=false;
        clientStatus[client].pickUpStatus=false;
        clientStatus[client].requestRedelivery=false;
        clientStatus[client].recieved=false;
        clientStatus[client].accepted=false;
        uint nextPhase = uint(currentPhase[client]) + 2;
        currentPhase[client] = Phase(nextPhase);
        emit end();
        if(currentPhase[client]==Phase.Done){
            currentPhase[client]=Phase.Init;
        }
        driverInformation[msg.sender].clientAddress=0x0000000000000000000000000000000000000000;//this use to identify if driver if delivered or not.
        requestingTable[clientInformation[client].tablePosition].status=4;
    }
    function checkPassword(bytes32 secret)public view returns(bool){
        if(hashedAddress[msg.sender]==keccak256(abi.encodePacked(msg.sender, secret))){//for security
            return true;
        }
        return false;
    }
    //All people function
    function requestAccessPointLocation()public view returns(string memory){ //all people can request access point location
        return location;
    }//requestAccessPointLocation function ended
    
    function withdraw() public {   //allow people withdraw
        uint amount = depositReturns[msg.sender];
        require (amount > 0);
        depositReturns[msg.sender] = 0;
        msg.sender.transfer(amount);
    }//end withdraw function
}
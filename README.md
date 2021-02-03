# Notice
IF YOU DEPLOY WITH GAS LIMIT ERROR, THE GAS LIMIT SHOULDBE INCREASE. Change the gas limit by going into ExpLocker-contract modifytruffle-config. i.e set gas to 6000000 (gas: 6000000).
<br />

# App Description
The ExpLocker App will allow people to request carrier to deliver the package into the access point whenpeople unable to receive their package when the package is out for delivery.

There are 3 kinds of users. Client (people that unable to receive their package), Driver (people that will redelivery the package to the client), and Carrier (who delivers the package into access point). They are reference by value 1=Client, 2=Driver, 3=Carrier.

People need to use the register function before using the app. The role represents their identity. Where 1=Client, 2=Driver, 3=Carrier. personName represent their name, the carrier can just type UPS, USPS, etc. hAddress represents the home address, only client require to write their home address. licenseNumber represents their license number or id number. Secret represents 32 bytes password that the user wants to input, this secret will hash the user’s address for authenticating.

Simple register will be register(1,”Chenyi”,”Chestnut Ridge Road”,”123456789”,”0x42652600000….”)

The name, address, and license number will be encrypted, so don't worry about leaking personal information.

To make this app work, the carrier must use assign function first. Assign(address client) where Carrier will put the client's address if the carriers delivery client's package

There are 5 event phases.
    1. Init: When client register, the Init Phase begins.
    2. StartClientAction, When carrier delivered client’s package to access point this phase begin.
    3. pickByDriver: When client request redelivery.
    4. pickByClient: When client request to pick up by itself
    5. Done: When driver delivered the packages to client’s home or when client received their package from the access point.
    Note: Every client will have its own phase. When hit the Done phase, it will begin the Init phase again, so carriers can have delivery next time.

# Installation.
In order to compile the app, you must first have Ganache and node.js installed.

[Ganache](https://www.trufflesuite.com/) this will help you install Ganache

After you installed your node.js and Ganache, open the terminal and type to install truffle.
```bash
npm install -g truffle 
```
<br />

# Compile the app
Open Ganache and click quick start.

```bash
cd ExpLocker-Dapp
cd Explocker-contract 
truffle compile
truffle migrations –rest //deploy
cd ..
cd ExpLocker-app
npm install //to install
npm start //to start listing.
```

After npm start, open Google Chrome and type http://localhost:3000/ to start the app. Connect the account you needed in metamask.

Make sure you have at least 4 accounts connected. Account 1 will be the chairperson. Then you can start registering using Account 2 - Account 4. Each account registers their role i.e. Account 2 be Client, Account 3 be Driver and let Account 3 be the Carrier.

![MetaMask](/img/Metamask.png) After selecting the account, you want, you can click next, and then click connect. After doing these steps you may start using the APP.
<br />


# Owner Login
When entering the index.html. Upper Right button says Owner Click Here To Enter button, the password is CSE426526 in default. However, you can change it in app.js file. In app.js the ownerPassword variable is the password for owner to enter. Let say you want to change your password to “1”, 

![Owner PW](/img/OwnerPW.png)
<br />


# Security

When user register, it requires user to enter bytes32 password, the password will be use to hashed user’s address for authenticating.

When input personal information from HTML, the User information such as name, address, and license number will be ENCRYPTED!

It will DECRYPTED when owner, or the person who have permission and needs to access it.
<br />

# Function Description For Smart Contract.
## The chairperson function.
setLocation(string memory location) this allows the chairperson to set access point location.
<br />

## The Carrier’s Function.
<b>Assign</b> (address <b>client</b>) where Carrier will put the client's address if the carriers delivery client's package

<b>deliveredAccessPoint</b>(address <b>client</b>, string memory <b>lockerPosition</b>, string memory <b>lockerPin</b>), when carrier delivered client’s package to the access point they will need to put which client packages are delivered to access point by inputting client’s address, and carriers need to input which locker they put, and 4 digits pin to open the locker. By calling deliveredAccessPoint function, it will go to next event phase (StartClientAction Phase). Premise the current phase must be Init phase.
<br />

## The Client's Function
<b>requestToAccessPoint()</b> this function allows clients to request carrier to deliver their packages to the access points. The client can pay ether tip to the carrier.

<b>requestToPickUp()</b> this function allows clients to request to pick up their packages on their own. Before clients request to pick up the carrier must be delivered their package to the access point first. To access this function current phase must be in StartClientAction phase. This function will move to next event phase (pickByClient Phase).

<b>cancelPickUp()</b> this function allows clients to cancel pick up on its own. To access this function current phase must be in pickByClient Phase. After the cancellation, this function will go back to the previous phase (pickByClient Phase).

<b>requestLocationPin</b>(bytes32 <b>secret</b>) if clients had requested to pick up, then requestLocationPin() will return locker location and 4 digit passcode. In order to return locker location and passcode, clients must input secret when they register. The secret will verify whether the operated by yourself. 

<b>requestToRedelivery()</b> if clients don’t feel they can pick up the packages by itself, they can request a driver to redelivery the packages. This function requires clients to give tips to drivers. Before clients request the carrier must be delivered their package to the access point first. To access this function the event phase must be in StartClientAction Phase. This function will move to next event phase (pickByDriver Phase).

<b>requestToCancel()</b> if a driver has accepted the client’s request, then the client can cancel the redelivery. This will refund the tips to clients. In order to cancel, make sure that the driver hasn’t picked up the client’s package yet. To access this function the event phase must be in pickByDriver Phase. This function will move to previous event phase (StartClientAction Phase).

<b>requestDriverInfo</b>(address <b>driver</b>, bytes32 <b>secret</b>) This allows clients to request the driver’s license numbers and name when the driver accepted the client’s redelivery request. The client can only view the driver who accepts the request. Clients must enter the secret to verify its operated by yourself. 

<b> received()</b>, when the client picked up the package by itself. This requires the current phase equals to pickByClient. This function will move to the next Phase (Done Phase). When it's the Done phase it will automatically move to Inti Phase.
<br />

## Driver's Function
<b>acceptRedelivery</b>(address <b>client</b>) if the clients have requested redelivery driver can accept it by the client’s address.

<b>requestLocationPin</b>(bytes32 <b>secret</b>) This will return the locker location and locker passcode, so that the driver can open the locker to pick up the packages. The driver must enter the secret to verify its operated by yourself.

<b>requestClientInfo</b>(address <b>client</b>,bytes32 <b>secret</b>) After the driver accepted the client's request, then the driver can request their information. The Driver can only view the client that been accepted by the driver. Driver must enter the secret to verify its operated by yourself.

<b>packagePicked()</b> When the driver picked up the client’s packages from the access point so that the client can’t cancel the request.

<b>deliveredToClient</b>(address <b>client</b>) When driver delivered package to clients. Require current phase equals to pickByDriver. This function will move to the next Phase (Done Phase). When it's the Done phase it will automatically move to Init Phase.
<br />

## All people's Function
<b>requestAccessPointLocation()</b> this will return access point location.

<b>withdraw()</b> allows people to withdraw their balance.

# Smart-Contract-Infura
Before you Infura deployment you need to have following stuff set up.
    1. Metamask installed
    2. Ropsten account with seed phrase (mnemonic)
    3. Infura project endpoint.
    4. truffle-configure.js modified.

After you have these things set up go to directory ExpLocker-contract

Open command line, then type 
```bash
npm install @truffle/hdwallet-provider
```
This will install the require package for ropsten network.
Then modify the truffle_config.js
![Infura](/img/Infura.jpg)

Getting Infura endpoint, register Infura account from [Infura](https://infura.io/) after registered go to dashboard
    1. Click Ethereum
    2. Create new project // name whatever you want.
    3. Click your project 
    4. Click setting
    5. Get the endpoint.

After modify the truffle_config.js and hdwallet-provider installed, open cmd in ExpLocker-contract directory and type truffle migrate -network ropsten, make sure you have no build folder in ExpLokcer-contract directory.

If success you will have this shown in the cmd
![CMD](/img/Infura2.png)

After depolyed the contract go to ExpLocker-client directory and modify the app.js.
![address](/img/Infura-address.png)
Change address to your contract address where shown in your cmd.
![CMD Address](/img/Infura-cmdaddress.png)
Like this.
![replaceadd](/img/Infura-addresss-replace.png)
Last! You can start the app by typing npm start.
### Note: You can use my endpoint. You don't need to do anything just go to ExpLocker-client folder and npm start and start using the app.
<br />

# Interact with smart contract
Before reading this make sure you had read readme-smartcontract-infura.
After npm start you may start using the App.
Go to localhost:3000 and sign in your metamask Notice if you are testing by your self make sure you have at least 3 account to make interacting with others.
If you need ether please visit here [Ether](https://faucet.dimensions.network/) this website allow you to take 5 ether per day if your account balance is less than 10 ether.
<br />

# Example use case
### You can review full video demo [here](https://www.youtube.com/watch?v=X3DxCCE3IA0&feature=youtu.be)
### Most of the time I am waiting for response from infura contract interaction. Please skip it.
![Register](/img/Register.png)  Client, Driver, Carrier registered
### Note: When you login if the username(address) line are empty please HARD REFRESH the site. CTRL+F5.
## Carrier Login
![Carrer Login](/img/carrier-login.png) Carrier assign by input client address. That means that client have packages arriving today.
<br />

## Client login
![BoxPack](/img/PackageTodayBox.png) Client saw this box was true, client don’t think he/she will have time to sign the package so client request carrier to delivery his/her package into access point by giving 1$ Tip. ![Tip box](/img/Tip.png)
<br />

## Back to carrier
![Carrier-Table](/img/carrer-table.png) Carrier saw this table on the left. This means that client are requesting their packages to be deliver to access point
![Carrier-Delivered](/img/carrier-delivered.png) Carrier Delivered by entering client's address, Locker position, Pin to access Locker, and Carrier password to self-certification.
<br />

## Back to Client
[!Current-Phase](/img/Current-Phase/png) The current phase are waiting for client action, this means that client’s package has been delivered to the access point, waiting for client decision(self-pickup or request driver)
Client decided to request a driver ![redeliveryTip](/img/redeliveryTip.png) by giving 1$ tips. After request success this table in the left will shown like this ![Client-table](/img/Client-table.png) This means that you have request for redelivery so when driver saw their table they can accept it.

## Driver Login
Driver accept people that shown in the left table. ![DriverAccept](/img/DriverAccept.png) After Driver accept successfully the table will update. ![Driver-Table](/img/Driver-Table.png) The table are shown as Tip, Client address, Status, Driver.
After accept the request Driver can request client information and locker location pin by entering Client address and password for Driver to self-certification. ![Client-information](/img/Client-information.png)
After delivered to cleint driver can withdraw.

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var md5 = require('md5');
global.fetch = require('node-fetch');
global.navigator = () => null;
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const { nextTick } = require('process');
//const AWS = require('aws-sdk'); //
const poolData = {
    UserPoolId: 'us-east-2_nqAuygNnN', //"us-east-2_2UDkDCCcp",
    ClientId: '335n4608726nmda4mb2t97q0m4' //"47fpf90kp6nirabrh710h0a2t9"
};
const pool_region = "us-east-2"; //"us-east-2_2UDkDCCcp";
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const app = express();
var http = require('http').Server(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('port', 3000);

const Register = (body) => {
    var name = body.name;
    var email = body.email;
    var password = md5(body.password);
    var nickname = body.nickname;
    var attributeList = [];
    console.log('en register ', name, password, nickname);

    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "nickname", Value: nickname }));
    console.log('attributeList', attributeList);

    return new Promise((resolve, reject) => {
        userPool.signUp(name, password, attributeList, null, (err, result) => {
            if (err) {
                //console.log('por error =====> ', err.message);
                reject(err);
                return;

            }
            var cognitoUser = result.user;
            resolve(cognitoUser);

        });
    });
}

const Login = function(body) {
    var userName = body.name;
    //    var password = body.password;
    var password = md5(body.password);
    console.log('en login ', userName, password);
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: userName,
        Password: password
    });
    var userData = {
        Username: userName,
        Pool: userPool
    }
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                var accesstoken = result.getAccessToken().getJwtToken();
                resolve(accesstoken);
            },
            onFailure: (function(err) {
                console.log('entro error ', err.message);
                reject(err);
                return;
            })
        })
    })

};

const EnableUser = function(body) {

    var userName = body.name;
    var verificationCode = body.verificationCode;
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var userData = {
        Username: userName,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(verificationCode, true, function(err, result) {
            if (err) {
                console.log(err.message || JSON.stringify(err));
                reject(err);
                return;
            }
            resolve(result);
        });
    });
};

const Logout = function(body) {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: body.name,
        Password: md5(body.password),
    });

    var userData = {
        Username: body.name,
        Pool: userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                cognitoUser.globalSignOut();
                resolve({
                    message: 'Desconectado'
                });
            },
            onFailure: function(err) {
                //console.log(err);
                reject(err);
                return;
            },
        });
    });
}

const ChangePassword = function(body) {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: body.name,
        Password: md5(body.password),
    });

    var userData = {
        Username: body.name,
        Pool: userPool
    };
    //console.log(userData);
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    return new Promise((resolve, reject) => {

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                cognitoUser.changePassword(md5(body.password), md5(body.newpassword), (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                        return;
                    } else {
                        console.log("Successfully changed password of the user.");
                        resolve({
                            message: 'Success'

                        });
                        //console.log(result);
                    }
                });
            },
            onFailure: function(err) {
                reject(err);
                return;
            },
        });
    });
}

app.use('/register', async function(req, res) {
    try {
        let register = await Register(req.body);
        console.log('regreso ');
        res.send('SUCESS');

    } catch (err) {
        console.log('error catch ', err.message)
        res.send(err.message);
    }

});

app.use('/login', async function(req, res) {
    try {
        let register = await Login(req.body);
        console.log('regreso login ');
        res.send(register);

    } catch (err) {
        console.log('error catch ', err.message)
        res.send(err);
    }

});
app.use('/enableUser', async function(req, res) {
    try {
        let register = await EnableUser(req.body);
        console.log('regreso enableUser ');
        res.send(register);

    } catch (err) {
        console.log('error catch ', err.message)
        res.send(err);
    }

});

app.use('/logout', async function(req, res) {
    try {
        let register = await Logout(req.body);
        console.log('regreso Logout ');
        res.send(register);

    } catch (err) {
        console.log('error catch ', err.message)
        res.send(err);
    }

});

app.use('/changePassword', async function(req, res) {
    try {
        let register = await ChangePassword(req.body);
        console.log('regreso Logout ');
        res.send(register);

    } catch (err) {
        console.log('error catch ', err.message)
        res.send(err);
    }

});

http.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
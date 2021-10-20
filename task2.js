/*
●	What do you think is wrong with the code, if anything?
    "body.invitationId) == -1" (for me looks like you are trying to add it if it doesnt exist), 
    i also removed the 3 equals as this is a very strict rule
    
●	    Can you see any potential problems that could lead to exceptions
        the error of the superagent response is not handled, bt i am sure there is more
        
●	How might you use the latest JavaScript features to refactor the code?
    if you use ECMAScript 2018 you could transform the callbacks into promises with then/finally/catch and then to prevent a potential callback hell, other than that i am afraind i dont know all the differences between 19 and 18-15 in depth

refractoring
there is no logging, testing that would be key to improve it for testeability

functions can be defined outside of the exports for reusability

for stability there is always problems with the input parameters no having the expected properties like invitationResponse.body.authId etc. 
 synchronous functions could be replaced by async
 from my end i use try catch in when the logic is not straight forward
*/

    
exports.inviteUser = function(req, res) {
    var invitationBody = req.body;
    var shopId = req.params.shopId;
    var authUrl = "https://url.to.auth.system.com/invitation";

    superagent
        .post(authUrl)
        .send(invitationBody)
        .end(function(errResponse, invitationResponse) {
            if (errResponse || !invitationResponse.ok) {
                return res.status(500).send(errResponse || {
                    message: 'Service Unavaliable'
                });
            }else if (invitationResponse.status == 201) {

                User.findOneAndUpdate({
                    authId: invitationResponse.body.authId
                }, {
                    authId: invitationResponse.body.authId,
                    email: invitationBody.email
                }, {
                    upsert: true,
                    new: true
                }, function(err, createdUser) {
                    Shop.findById(shopId).exec(function(err, shop) {
                        if (err || !shop) {
                            return res.status(500).send(err || {
                                message: 'No shop found'
                            });
                        }
                        if (shop.invitations.indexOf(invitationResponse.body.invitationId) == -1) {
                            shop.invitations.push(invitationResponse.body.invitationId);
                        }
                        if (shop.users.indexOf(createdUser._id) == -1) {
                            shop.users.push(createdUser);
                        }
                        shop.save();
                    });
                });
                return res.json(invitationResponse);


            } else if (invitationResponse.status == 200) {
                return res.status(400).json({
                    error: true,
                    message: 'User already invited to this shop'
                });

            

        });
};

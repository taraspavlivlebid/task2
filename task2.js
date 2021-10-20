exports.inviteUser = function(req, res) {
    var invitationBody = req.body;
    var shopId = req.params.shopId;
    var authUrl = "https://url.to.auth.system.com/invitation";

    superagent
        .post(authUrl)
        .send(invitationBody)
        .end(function(errResponse, invitationResponse) {

            if (invitationResponse.status == 201) {

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

            } else if (errResponse || !invitationResponse.ok) {
                return res.status(500).send(errResponse || {
                    message: 'Service Unavaliable'
                });
            }

        });
};
